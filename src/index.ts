import * as bv from './bitvector';
import * as trie from './trie';

export class ReadonlyTrieTree {
  tree: trie.LOUDS;
  length: number;
  constructor(keys: string[]) {
    this.tree = new trie.LOUDS(bv.NaiveBitVector);
    this.tree.build(keys);
    this.length = keys.length;
  }

  private dfs(suffix: string, iter: number|null): number|null {
    if (suffix === '') {
      const term = this.tree.getTerminal(iter);
      if (term !== null) {
        if (term.tail === '')
          return term.value;
        else
          return null;
      } else {
        return null;
      }
    }

    const begin = this.tree.getFirstChild(iter);
    if (begin === null) {
      const term = this.tree.getTerminal(iter);
      if (term !== null) {
        if (term.tail === suffix)
          return term.value;
        else
          return null;
      } else {
        return null;
      }
    }

    // has at least one child
    for (iter = begin; iter !== null; iter = this.tree.getNextSibling(iter)) {
      if (this.tree.getEdge(iter) === suffix[0]) {
        // step deeper
        return this.dfs(suffix.slice(1), iter);
      }
    }
    return null;
  }
  contains(word: string): boolean {
    const entry = this.getValue(word);
    return entry !== null;
  }
  getValue(word: string): number|null {
    let iter = this.tree.getRoot();
    return this.dfs(word, iter);
  }
  getWords(prefix: string): string[] {
    return [];
  }

}
