import {readFileSync} from 'fs';
import {ReadonlyTrieTree} from '.';

function testTrie(withDump: boolean, fromDataIndices: boolean) {
  return () => {
    it('build', () => {
      const keys = readFileSync("./examples/oxford5000.txt").toString().trim().split(/\r\n|\r|\n/);
      let trie: ReadonlyTrieTree;
      if (fromDataIndices) {
        const indices = [0];
        keys.forEach((v) => {indices.push(indices[indices.length-1] + v.length)});
        trie = ReadonlyTrieTree.fromDataIndices(keys.join(""), new Uint32Array(indices));
      } else {
        trie = ReadonlyTrieTree.fromKeywordList(keys);
      }
      if (withDump) {
        trie.dumpFileSync("tmp.dat");
        trie = ReadonlyTrieTree.loadFileSync("tmp.dat");
      }

      expect(trie.getWords("any").length).toBe(6);

      expect(trie.getValue("on")).toBe(1809);
      expect(trie.getValue("onn")).toBe(null);
    
      expect(trie.contains("an")).toBe(false);
      expect(trie.contains("and")).toBe(true);
    });
  };
}
describe('(large file) readonly trie tree', testTrie(false, false));
describe('(large file) readonly trie tree from dataIndices', testTrie(false, true));
describe('(large file) readonly trie tree with dump', testTrie(true, false));
describe('(large file) readonly trie tree from dataIndices with dump', testTrie(true, true));

