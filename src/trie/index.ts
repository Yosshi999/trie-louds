import * as bv from '../bitvector';

interface ITrieTree<index_t> {
  index: index_t;
  BitVector: new (data: Buffer) => bv.IBitVector;

  getRoot(): index_t;
  // getParent(idx: index_t): index_t;
  getFirstChild(idx: index_t): index_t|null;
  getNextSibling(idx: index_t): index_t|null;
  getEdge(idx: index_t): string;
  // findFromChildren(idx: index_t, char: string): index_t;
  build(keys: string[]): void;
  getTerminal(idx: index_t): {value: number, tail: string} | null;

  dump(filename: string): void;
  load(filename: string): void;
}

export class LOUDS implements ITrieTree<number> {
  index = 0;
  BitVector: new (data: Buffer) => bv.IBitVector;
  StrVector: new (data: string[]) => bv.IStrVector = bv.NaiveStrVector;

  // index
  vector: bv.IBitVector;
  // label index
  edge: string = '';
  terminals: bv.IBitVector;
  // leaf index
  tails: bv.IStrVector;
  values: number[];

  constructor(V: new (data: Buffer) => bv.IBitVector) {
    this.BitVector = V;
  }

  getRoot() {
    return 0;
  }
  getParent(idx: number) {
    return this.vector.select1(this.vector.rank0(idx));
  }
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

  dump(filename: string) {
    // TODO
  }
  load (filename: string) {
    // TODO
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
    function compressor (v: boolean, idx: number) {
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
