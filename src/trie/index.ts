import assert from 'assert';
import * as bv from '../bitvector';

interface ITrieBackend<index_t> {
  BitVector: new (data: Buffer) => bv.IBitVector;

  getRoot(): index_t;
  // getParent(idx: index_t): index_t;
  getFirstChild(idx: index_t): index_t|null;
  getNextSibling(idx: index_t): index_t|null;
  getEdge(idx: index_t): string;
  build(keys: string[]): void;
  buildFromDataIndices(data: string, indices: Uint32Array): void;
  getTerminal(idx: index_t): {value: number, tail: string} | null;

  dump(): Buffer;
  load(buf: Buffer, offset: number): number;
}

class NumberList {
  data: Uint32Array;
  capacity: number;
  idx: number;

  constructor(capacity: number) {
    this.data = new Uint32Array(capacity);
    this.capacity = capacity;
    this.idx = 0;
  }
  push(x: number) {
    assert(this.idx < this.capacity, "overflow");
    this.data[this.idx++] = x;
  }
  at(i: number) {
    assert(i < this.idx, "out of bound");
    return this.data[i];
  }
  toArray() {
    return this.data.slice(0, this.idx);
  }
  clear() {
    this.idx = 0;
  }
}

class BitList {
  data: Buffer;
  capacity: number;
  idx: number;

  constructor(capacity: number) {
    this.data = Buffer.alloc(Math.ceil(capacity / 8));
    this.capacity = capacity;
    this.idx = 0;
  }
  push(x: boolean) {
    assert(this.idx < this.capacity);
    if (x) {
      this.data[this.idx >> 3] |= 1 << (this.idx % 8);
    }
    this.idx++;
  }
  at(i: number) {
    assert(i < this.idx);
    return (this.data[i >> 3] >> (i % 8)) & 1;
  }
  toBuffer() {
    return this.data.slice(0, Math.ceil(this.idx / 8));
  }
  clear() {
    this.idx = 0;
    this.data.fill(0);
  }
}

class StrList {
  data: string;
  indices: Uint32Array;
  capacity: number;
  idx: number;

  constructor(capacity: number) {
    this.data = "";
    this.capacity = capacity;
    this.indices = new Uint32Array(capacity+1);
    this.indices[0] = 0;
    this.idx = 0;
  }
  push(x: string) {
    assert(this.idx < this.capacity);
    this.data += x;
    this.indices[this.idx+1] = this.data.length;
    this.idx++;
  }
  toDataIndices() {
    return {
      data: this.data,
      indices: this.indices.slice(0, this.idx+1)
    };
  }
}

class NumberDoubleList {
  data: Uint32Array;
  delim: Uint32Array;
  capacity: number;
  idx: number = 0;
  delimIdx: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.data = new Uint32Array(capacity);
    this.delim = new Uint32Array(capacity + 1);
  }
  pushEmptyList() {
    assert(this.delimIdx < this.capacity + 1);
    this.delimIdx++;
    this.delim[this.delimIdx] = this.idx;
  }
  pushList(x: Uint32Array | number[]) {
    this.pushEmptyList();
    for (let i = 0; i < x.length; i++) {
      this.push(x[i]);
    }
  }
  push(x: number) {
    assert(this.delimIdx > 0);
    assert(this.idx < this.capacity);
    this.data[this.idx++] = x;
    this.delim[this.delimIdx] = this.idx;
  }
  atList(i: number) {
    assert(i < this.delimIdx);
    const begin = this.delim[i];
    const end = this.delim[i+1];
    return this.data.slice(begin, end);
  }
  clear() {
    this.idx = 0;
    this.delimIdx = 0;
    this.data.fill(0);
    this.delim.fill(0);
  }
}

export class LoudsBackend implements ITrieBackend<number> {
  BitVector: new (data?: Buffer) => bv.IBitVector;
  StrVector: new (data?: string[]) => bv.IStrVector = bv.NaiveStrVector;

  // index
  vector: bv.IBitVector;
  // label index
  edge: string = '';
  terminals: bv.IBitVector;
  // leaf index
  tails: bv.IStrVector;
  values: Uint32Array;

  constructor(V: new (data?: Buffer) => bv.IBitVector) {
    this.BitVector = V;
    this.vector = new this.BitVector();
    this.terminals = new this.BitVector();
    this.values = new Uint32Array();
    this.tails = new this.StrVector();
  }

  getRoot() {
    return 0;
  }
  // getParent(idx: number) {
  //   return this.vector.select1(this.vector.rank0(idx));
  // }
  getFirstChild(idx: number) {
    const r1 = this.vector.rank1(idx)+1;
    const child = this.vector.select0(r1);
    if (this.vector.access(child))
      return child;
    else
      return null;
  }
  getNextSibling(idx: number) {
    if (this.vector.access(idx+1)) {
      return idx+1;
    } else {
      return null;
    }
  }
  getEdge(idx: number) {
    const labelIdx = this.vector.rank1(idx) - 1;
    return this.edge[labelIdx];
  }

  getTerminal(idx: number) {
    const labelIdx = this.vector.rank1(idx) - 1;
    if (this.terminals.access(labelIdx)) {
      const leafIdx = this.terminals.rank1(labelIdx);
      return {value: this.values[leafIdx], tail: this.tails.at(leafIdx)};
    }
    else
      return null;
  }

  dump() {
    const edgeBuffer = Buffer.from(this.edge);
    const edgeLengthBuffer = Buffer.allocUnsafe(4);
    edgeLengthBuffer.writeUInt32LE(edgeBuffer.length);
    const valuesBuffer = Buffer.allocUnsafe(4 * this.values.length);
    this.values.forEach((v, i) => {
      valuesBuffer.writeUInt32LE(v, i*4);
    });
    const valuesLengthBuffer = Buffer.allocUnsafe(4);
    valuesLengthBuffer.writeUInt32LE(valuesBuffer.length);

    return Buffer.concat([
      this.vector.dump(),
      edgeLengthBuffer, edgeBuffer,
      this.terminals.dump(),
      this.tails.dump(),
      valuesLengthBuffer, valuesBuffer
    ]);
  }
  load(buf: Buffer, offset: number) {
    offset = this.vector.load(buf, offset);
    const edgeLength = buf.readUInt32LE(offset); offset += 4;
    this.edge = buf.slice(offset, offset + edgeLength).toString(); offset += edgeLength;
    offset = this.terminals.load(buf, offset);
    offset = this.tails.load(buf, offset);
    const valuesLength = buf.readUInt32LE(offset); offset += 4;
    this.values = new Uint32Array(valuesLength/4);
    for (let i = 0; i < valuesLength/4; i += 1) {
      this.values[i] = buf.readUInt32LE(offset + i*4);
    }
    offset += valuesLength;
    return offset;
  }

  buildFromDataIndices(data: string, dataIndices: Uint32Array) {
    const indices = new Uint32Array(dataIndices.length - 1);
    indices.forEach((_, i, array) => {array[i] = i;});
    const dataLengths = new Uint32Array(dataIndices.length - 1);
    dataLengths.forEach((_, i, array) => {array[i] = dataIndices[i+1] - dataIndices[i];});

    const rawVec = new BitList((1 + data.length) * 2);
    rawVec.push(true);
    rawVec.push(false);
    const rawTerm = new BitList((1 + data.length) * 2);
    const rawValue = new NumberList(indices.length);
    const rawTails = new StrList(indices.length);

    indices.sort((a, b) => (
      data.slice(dataIndices[a], dataIndices[a+1])
      < data.slice(dataIndices[b], dataIndices[b+1])
      ? -1 : 1)
    );
    
    this.edge = "";
    const queue = new NumberDoubleList(indices.length);
    const nextQueue = new NumberDoubleList(indices.length);

    const maxChars = dataLengths.reduce((x,e)=>Math.max(x,e));
    queue.pushList(indices);
    for (let i = 0; i < maxChars; i++) {
      nextQueue.clear();
      for (let j = 0; j < queue.delimIdx; j++) {
        let currNode = "";
        for (let k = queue.delim[j]; k < queue.delim[j+1]; k++) {
          const wordIdx = queue.data[k];
          if (i < dataLengths[wordIdx]) {
            const char = data[dataIndices[wordIdx]+i];
            if (currNode !== char) {
              // new sibling
              currNode = char;
              this.edge += char;
              nextQueue.pushEmptyList();
              rawVec.push(true);
            }
            nextQueue.push(wordIdx);
          }
        }
        rawVec.push(false);
      }
      // terminal check
      queue.clear();
      for (let j = 0; j < nextQueue.delimIdx; j++) {
        const qlen = nextQueue.delim[j+1] - nextQueue.delim[j];
        if (qlen === 1) {
          // only one word in the path.
          rawTerm.push(true);
          const wordIdx = nextQueue.data[nextQueue.delim[j]];
          const suffix = data.slice(dataIndices[wordIdx]+i+1, dataIndices[wordIdx+1]);
          rawValue.push(wordIdx);
          rawTails.push(suffix);
          queue.pushEmptyList();
        } else {
          let existTerm = false;
          for (let k = nextQueue.delim[j]; k < nextQueue.delim[j+1]; k++) {
            const wordIdx = nextQueue.data[k];
            const wlen = dataIndices[wordIdx+1] - dataIndices[wordIdx];
            if (i === wlen-1) { // this is terminal
              if (!existTerm) {
                existTerm = true;
                rawTerm.push(true);
                rawValue.push(wordIdx);
                rawTails.push('');
              }
            }
          }
          if (!existTerm) rawTerm.push(false);
          queue.pushList(nextQueue.atList(j));
        }
      }
    }
    // compress
    this.vector = new this.BitVector(rawVec.toBuffer());
    this.terminals = new this.BitVector(rawTerm.toBuffer());
    this.values = rawValue.toArray();
    const {data: strData, indices: strIndices} = rawTails.toDataIndices();
    this.tails = bv.NaiveStrVector.fromDataIndices(strData, strIndices);
  }

  build(keys: string[]) {
    const maxChars = keys.map(x=>x.length).reduce((x,e)=>Math.max(x,e));

    const rawVec: boolean[] = [true, false];
    const rawTerm: boolean[] = [];
    const rawValue: number[] = [];
    const rawTails: string[] = [];
    const kv = keys.map((value, idx) => ({value, idx}));
    kv.sort((a, b) => (a.value < b.value ? -1 : 1));
    this.edge = '';
    let queue: {value: string, idx: number}[][] = [kv];
    for (let i = 0; i < maxChars; i++) {
      let nextQueue: {value: string, idx: number}[][] = [];
      queue.forEach(q => {
        let currNode = "";
        q.forEach(item => {
          const word = item.value;
          if (i < word.length) {
            const char = word[i];
            if (currNode !== char) {
              // new sibling
              currNode = char;
              this.edge += char;
              nextQueue.push([]);
              rawVec.push(true);
            }
            nextQueue[nextQueue.length - 1].push(item);
          }
        });
        rawVec.push(false);
      });
      // terminal check
      nextQueue.forEach((q, idx, arr) => {
        if (q.length === 1) {
          rawTerm.push(true);
          rawValue.push(q[0].idx);
          rawTails.push(q[0].value.slice(i+1));
          arr[idx] = [];
        } else {
          let exist_term = false;
          q.forEach(item => {
            if (item.value.length-1 === i) {
              if (!exist_term) {
                exist_term = true;
                rawTerm.push(true);
                rawValue.push(item.idx);
                rawTails.push('');
              }
            }
          });
          if (!exist_term) {
            rawTerm.push(false);
          }
        }
      });

      queue = nextQueue;
    }

    // compress
    const vec = Buffer.alloc(Math.ceil(rawVec.length / 8));
    const term = Buffer.alloc(Math.ceil(rawTerm.length / 8));
    function compressor (this: Buffer, v: boolean, idx: number) {
      if (v) {
        this[idx >> 3] |= 1 << (idx % 8);
      }
    }
    rawVec.forEach(compressor, vec);
    rawTerm.forEach(compressor, term);

    this.vector = new this.BitVector(vec);
    this.terminals = new this.BitVector(term);
    this.values = new Uint32Array(rawValue);
    this.tails = new this.StrVector(rawTails);
  }
}
