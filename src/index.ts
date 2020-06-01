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

  private dfs(suffix: string, iter: number): {suffix: string, iter: number}|null {
    if (suffix === '') {
      return {suffix, iter};
    }

    const begin = this.tree.getFirstChild(iter);
    if (begin === null) {
      return {suffix, iter};
    }

    // has at least one child
    for (iter = begin; iter !== null; iter = this.tree.getNextSibling(iter)) {
      if (this.tree.getEdge(iter) === suffix[0]) {
        // step deeper
        return this.dfs(suffix.slice(1), iter);
      }
    }
    // cannot step anymore
    return null;
  }

  contains(word: string): boolean {
    const entry = this.getValue(word);
    return entry !== null;
  }
  getValue(word: string): number|null {
    const root = this.tree.getRoot();
    const result = this.dfs(word, root);
    if (result !== null) {
      const {suffix, iter} = result;
      const term = this.tree.getTerminal(iter);
      if (term !== null && term.tail === suffix) {
        return term.value;
      }
    }
    return null;
  }
  getWords(prefix: string): string[] {
    const root = this.tree.getRoot();
    const result = this.dfs(prefix, root);
    if (result === null) return [];

    if (result.suffix.length > 0) {
      // cannot step anymore
      const term = this.tree.getTerminal(result.iter);
      if (term !== null && term.tail === result.suffix) {
        return [prefix];
      }
    }
    const func = (iter: number, prefix: string, words: string[]) => {
      const term = this.tree.getTerminal(iter);
      if (term !== null) {
        // has word
        words.push(prefix + term.tail);
      }
      for (iter = this.tree.getFirstChild(iter); iter !== null; iter = this.tree.getNextSibling(iter)) {
        func(iter, prefix+this.tree.getEdge(iter), words);
      }
    };

    const words = [];
    func(result.iter, prefix, words);
    return words;
  }

}
