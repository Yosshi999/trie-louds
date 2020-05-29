import * as bv from '../bitvector';

class LOUDS {
  vector: bv.IBitVector;
  labels: string = '';
  terminals: bv.IBitVector;
  values: number[];

  constructor(data: Buffer, labels: string, terminals: Buffer, values: number[]) {
    this.vector = new bv.NaiveBitVector(data);
    this.labels = labels;
    this.terminals = new bv.NaiveBitVector(terminals);
    this.values = values;
  }

  private getTerminalIdx(labelIdx: number): number|null {
    if(!this.terminals.access(labelIdx)) return null;
    return this.terminals.rank1(labelIdx);
  }

  private getChildrenIdx(parentRank: number) {
    let begin = this.vector.select0(parentRank);
    let end = this.vector.select0(parentRank + 1) - 1;
    return { begin, end };
  }

  Contains(word: string): number|null {
    let iterRank = 1; // rank1 of root, idx == 0
    for (let i = 0; i < word.length; i++) {
      const { begin, end } = this.getChildrenIdx(iterRank);
      const size = end - begin;
      const beginRank = this.vector.rank1(begin + 1);
      const children = this.labels.slice(beginRank, beginRank + size);

      const c = word[i];
      const ci = children.indexOf(c);
      if (ci === -1) return null;

      iterRank = beginRank + ci;
    }
    const idx = this.getTerminalIdx(iterRank - 1);
    if (idx !== null) {
      return this.values[idx];
    }
    return null;
  }
}

export function BuildTrie(keys: string[]): LOUDS;
export function BuildTrie(data: Buffer, labels: string, terminals: Buffer, values: number[]): LOUDS;

export function BuildTrie(_x: any, _y?: string, _z?: Buffer, _w?: number[]) {
  if (_x instanceof Buffer) {
    return new LOUDS(_x, _y, _z, _w);
  }
  const keys: string[] = _x;
  const maxChars = keys.map(x=>x.length).reduce((x,e)=>Math.max(x,e));

  const rawVec: boolean[] = [true, false];
  const rawTerm: boolean[] = [false];
  const rawValue: number[] = [];
  const kv = keys.map((value, idx) => ({value, idx}));
  kv.sort((a, b) => (a.value < b.value ? -1 : 1));
  let labels = "-^";
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
            labels += char;
            nextQueue.push([]);
            rawVec.push(true);
            rawTerm.push(false);
          }
          if (i === word.length - 1) {
            // terminate
            if (!rawTerm[rawTerm.length - 1]) {
              rawTerm[rawTerm.length - 1] = true;
              rawValue.push(item.idx);
            }
          }
          if (i < word.length - 1) {
            nextQueue[nextQueue.length - 1].push(item);
          }
        }
      });
      rawVec.push(false);
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

  return new LOUDS(vec, labels, term, rawValue);
}
