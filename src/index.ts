import * as bv from './bitvector';
import * as trie from './trie';
import * as fs from 'fs';
import { assert } from 'console';

export class ReadonlyTrieTree {
  tree: trie.LoudsBackend;
  length: number = 0;
  constructor() {
    this.tree = new trie.LoudsBackend(bv.SuccinctBitVector);
  }
  
  static fromDataIndices(data: string, indices: Uint32Array, verbose?: boolean) {
    const obj = new this();
    if (verbose) obj.tree.verbose = true;
    obj.tree.buildFromDataIndices(data, indices);
    obj.length = indices.length - 1;
    return obj;
  }

  static fromKeywordList(keys: string[], verbose?: boolean) {
    const obj = new this();
    if (verbose) obj.tree.verbose = true;
    obj.tree.build(keys);
    obj.length = keys.length;
    return obj;
  }

  dumpFileSync(filename: string) {
    const lengthBuffer = Buffer.allocUnsafe(4);
    lengthBuffer.writeUInt32LE(this.length);
    const buf = Buffer.concat([
      lengthBuffer,
      this.tree.dump()
    ]);
    fs.writeFileSync(filename, buf);
  }

  static loadFileSync(filename: string) {
    const buf = fs.readFileSync(filename);
    const ret = new this();
    ret.length = buf.readUInt32LE(0);
    ret.tree.load(buf, 4);
    return ret;
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
    for (let _iter: number|null = begin; _iter !== null; _iter = this.tree.getNextSibling(_iter)) {
      if (this.tree.getEdge(_iter) === suffix[0]) {
        // step deeper
        return this.dfs(suffix.slice(1), _iter);
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
      if (term !== null && term.tail.slice(0, result.suffix.length) === result.suffix) {
        return [prefix];
      } else {
        return [];
      }
    }

    // can step more
    const func = (iter: number, prefix: string, words: string[]) => {
      const term = this.tree.getTerminal(iter);
      if (term !== null) {
        // has word
        words.push(prefix + term.tail);
      }
      for (let _iter = this.tree.getFirstChild(iter); _iter !== null; _iter = this.tree.getNextSibling(_iter)) {
        func(_iter, prefix+this.tree.getEdge(_iter), words);
      }
    };

    const words: string[] = [];
    func(result.iter, prefix, words);
    return words;
  }

}
