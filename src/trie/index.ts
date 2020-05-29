import * as bv from '../bitvector';

class LOUDS {
  vector: bv.IBitVector;
  labels: string = '';
  terminals: Buffer;

  constructor(data: Buffer, labels: string, terminals: Buffer) {
    this.vector = new bv.NaiveBitVector(data);
    this.vector.build();
    this.labels = labels;
    this.terminals = terminals;
  }

  private isTerminal(labelIdx: number) {
    const subindex = labelIdx % 8;
    const byteindex = labelIdx >> 3;
    return ((this.terminals[byteindex] >> subindex) & 1) == 1;
  }

  private getChildrenIdx(parentRank: number) {
    let begin = this.vector.select0(parentRank);
    let end = this.vector.select0(parentRank + 1) - 1;
    return { begin, end };
  }

  Contains(word: string) {
    let iterRank = 1; // rank1 of root, idx == 0
    for (let i = 0; i < word.length; i++) {
      const { begin, end } = this.getChildrenIdx(iterRank);
      const size = end - begin;
      const beginRank = this.vector.rank1(begin + 1);
      const children = this.labels.slice(beginRank, beginRank + size);

      const c = word[i];
      const ci = children.indexOf(c);
      if (ci === -1) return false;

      iterRank = beginRank + ci;
    }
    return this.isTerminal(iterRank - 1);
  }
}

class NaiveTrie {
  tree = {};
  readonly termKey = "$$";
  readonly rootKey = "^";
  nodes = 1; // root node
  constructor() {
    this.tree[this.rootKey] = {};
  }
  add(word: string) {
    let iter = this.tree[this.rootKey];
    for (let i = 0; i < word.length; i++) {
      const c = word[i];
      if (!(c in iter)) {
        iter[c] = {};
        this.nodes++;
      }
      iter = iter[c];
    }
    iter[this.termKey] = 0;
  }
}

export function BuildTrie(keys: string[]): LOUDS;
export function BuildTrie(data: Buffer, labels: string, terminals: Buffer): LOUDS;

export function BuildTrie(_x: any, _y?: string, _z?: Buffer) {
  if (_x instanceof Buffer) {
    return new LOUDS(_x, _y, _z);
  }
  const keys = _x;
  const trie = new NaiveTrie();
  keys.forEach(word => trie.add(word));
  const vecSize = trie.nodes * 2 + 1;
  const vec = Buffer.alloc(Math.ceil(vecSize / 8));
  const term = Buffer.alloc(Math.ceil(trie.nodes / 8));
  let labels = "-";

  // bfs
  let veci = 0;
  let termi = 0;
  let queue: {}[] = [trie.tree];
  do {
    let newQueue: {}[] = [];
    queue.forEach(iter => {
      const q = Object.keys(iter);
      q.sort();
      q.forEach(c => {
        if (c.length > 1) return; // skip termKey
        vec[veci >> 3] |= 1 << (veci % 8);
        labels += c;
        // console.log(iter, c);
        if (trie.termKey in iter[c]) {
          term[termi >> 3] |= 1 << (termi % 8);
        }
        newQueue.push(iter[c]);
        veci++;
        termi++;
      });
      veci++;
    });
    queue = newQueue;
  } while (queue.length > 0)
  return new LOUDS(vec, labels, term);
}
