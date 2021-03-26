import * as bv from './bitvector';
import * as trie from './trie';

type TempInfo = {depth: number, iter: number, prefix: string};
type OptSearchSetting = {limit?: number,  maxLength?: number, minLength?: number};
type SearchSetting = {limit: number,  maxLength: number, minLength: number};
type SearchResult = {words: string[], values: number[], hasMore: boolean, temporaryInfo?: TempInfo};

function SearchSettingWithDefault(_setting?: OptSearchSetting|number): SearchSetting {
  const setting = {limit: 1000, minLength: 0, maxLength: Infinity};
  if (typeof(_setting) === 'number') setting.limit = _setting;
  else if (_setting) {
    if (_setting.limit) setting.limit = _setting.limit;
    if (_setting.minLength) setting.minLength = _setting.minLength;
    if (_setting.maxLength) setting.maxLength = _setting.maxLength;
  }
  return setting;
}

export class ReadonlyTrieTree {
  tree: trie.LoudsBackend;
  length: number = 0;
  constructor() {
    this.tree = new trie.LoudsBackend(bv.SuccinctBitVector);
  }
  
  static fromDataIndices(data: string, indices: Uint32Array, verbose?: boolean) {
    return ReadonlyTrieTree.fromBufferIndices(Buffer.from(data, 'ucs2'), indices, verbose);
  }

  static fromBufferIndices(buffer: Buffer, indices: Uint32Array, verbose?: boolean) {
    const obj = new this();
    if (verbose) obj.tree.verbose = true;
    obj.tree.buildFromBufferIndices(buffer, indices);
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

  dump(): Buffer {
    const lengthBuffer = Buffer.allocUnsafe(4);
    lengthBuffer.writeUInt32LE(this.length);
    const buf = Buffer.concat([
      lengthBuffer,
      this.tree.dump()
    ]);
    return buf;
  }

  static load(buf: Buffer) {
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

  /*
  * Aggregate at most `setting.limit` words which are equal to / under the given node. 
  * `setting.limit` must be larger than zero.
  * Words longer than `setting.maxLength` and ones shorter than `setting.minLength` are excluded.
  */
  private aggregate(iter: number, prefix: string, setting: SearchSetting, depth: number, ret: SearchResult): void {
    if (prefix.length > setting.maxLength) return; // all words deeper than here is excluded.
    const term = this.tree.getTerminal(iter);
    if (term !== null) {
      const wordLength = prefix.length + term.tail.length;
      if (wordLength >= setting.minLength && wordLength <= setting.maxLength) {
        // has word
        if (setting.limit <= ret.words.length) {
          ret.hasMore = true;
          ret.temporaryInfo = {depth, iter, prefix};
          return;
        }
        ret.words.push(prefix + term.tail);
        ret.values.push(term.value);
      }
    }
    for (let _iter = this.tree.getFirstChild(iter); _iter !== null; _iter = this.tree.getNextSibling(_iter)) {
      this.aggregate(_iter, prefix+this.tree.getEdge(_iter), setting, depth+1, ret);
      if (ret.hasMore) return;
    }
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
  
  getWords(prefix: string, _setting?: OptSearchSetting | number): SearchResult {
    const setting = SearchSettingWithDefault(_setting);
    const root = this.tree.getRoot();
    const result = this.dfs(prefix, root);
    if (result === null) return {words: [], values: [], hasMore: false};

    if (result.suffix.length > 0) {
      // cannot step anymore
      const term = this.tree.getTerminal(result.iter);
      if (term !== null && term.tail.slice(0, result.suffix.length) === result.suffix
        && prefix.length >= setting.minLength && prefix.length <= setting.maxLength) {
          return {words: [prefix], values: [term.value], hasMore: false};
      }
      return {words: [], values: [], hasMore: false};
    }

    // can step more
    const ret: SearchResult = {
      words: [],
      values: [],
      hasMore: false,
    };
    this.aggregate(result.iter, prefix, setting, 0, ret);
    return ret;
  }

  getMoreWords(temporaryInfo: TempInfo, _setting?: OptSearchSetting | number): SearchResult {
    const setting = SearchSettingWithDefault(_setting);
    const ret: SearchResult = {
      words: [],
      values: [],
      hasMore: false,
    };

    let {depth, iter, prefix} = temporaryInfo;
    while(depth > 0) {
      while (true) {
        this.aggregate(iter, prefix, setting, depth, ret);
        if (ret.hasMore) return ret;
        const iterOpt = this.tree.getNextSibling(iter);
        if (iterOpt === null) break;
        iter = iterOpt;
        prefix = prefix.slice(0, -1) + this.tree.getEdge(iter);
      }
      iter = this.tree.getParent(iter);
      depth--;
      prefix = prefix.slice(0, -1);

      while (depth > 0) {
        const iterOpt = this.tree.getNextSibling(iter);
        if (iterOpt) {
          iter = iterOpt;
          prefix = prefix.slice(0, -1) + this.tree.getEdge(iter);
          break;
        } else {
          iter = this.tree.getParent(iter);
          depth--;
          prefix = prefix.slice(0, -1);
        }
      }
    }
    return ret;
  }
}
