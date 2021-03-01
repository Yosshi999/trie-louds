import * as bv from '../bitvector';

interface ITrieBackend<index_t> {
  BitVector: new (data: Buffer) => bv.IBitVector;

  getRoot(): index_t;
  // getParent(idx: index_t): index_t;
  getFirstChild(idx: index_t): index_t|null;
  getNextSibling(idx: index_t): index_t|null;
  getEdge(idx: index_t): string;
  build(keys: string[]): void;
  getTerminal(idx: index_t): {value: number, tail: string} | null;

  dump(): Buffer;
  load(buf: Buffer, offset: number): number;
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
  values: number[];

  constructor(V: new (data?: Buffer) => bv.IBitVector) {
    this.BitVector = V;
    this.vector = new this.BitVector();
    this.terminals = new this.BitVector();
    this.values = [];
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
      valuesBuffer.writeInt32LE(v, i*4);
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
    this.values = Array(valuesLength/4);
    for (let i = 0; i < valuesLength/4; i += 1) {
      this.values[i] = buf.readInt32LE(offset + i*4);
    }
    offset += valuesLength;
    return offset;
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
    this.values = rawValue;
    this.tails = new this.StrVector(rawTails);
  }
}
