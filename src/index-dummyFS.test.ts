const dummyFiles = new Map();
jest.mock('fs', () => ({
  readFileSync: (path: string) => dummyFiles.get(path),
  writeFileSync: ((path: string, data: any) => {dummyFiles.set(path, data);})
}));
import {ReadonlyTrieTree} from '.';

function testTrie(withDump: boolean, fromDataIndices: boolean) {
  return () => {
    it('build', () => {
      const keys = ["an", "i", "of", "one", "out", "our"];
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

      expect(trie.length).toBe(6);
      
      expect(trie.getValue("an")).toBe(0);
      expect(trie.getValue("i")).toBe(1);
      expect(trie.getValue("of")).toBe(2);
      expect(trie.getValue("one")).toBe(3);
      expect(trie.getValue("out")).toBe(4);
      expect(trie.getValue("our")).toBe(5);
    
      expect(trie.getValue("on")).toBe(null);
      expect(trie.getValue("")).toBe(null);
      expect(trie.getValue("ix")).toBe(null);
      expect(trie.getValue("outo")).toBe(null);
    
      expect(trie.contains("an")).toBe(true);
      expect(trie.contains("is")).toBe(false);
    });
    
    it('build2', () => {
      const keys = ["apple", "apples"];
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
      expect(trie.length).toBe(2);
      
      expect(trie.contains("apple")).toBe(true);
      expect(trie.contains("apples")).toBe(true);
      expect(trie.contains("appl")).toBe(false);
      expect(trie.contains("appless")).toBe(false);
    });
    
    it('build3', () => {
      const keys = ["an", "answer"];
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
      expect(trie.length).toBe(2);
      
      expect(trie.contains("a")).toBe(false);
      expect(trie.contains("an")).toBe(true);
      expect(trie.contains("answ")).toBe(false);
      expect(trie.contains("answer")).toBe(true);
      expect(trie.contains("answers")).toBe(false);
    });
    
    it('getwords', () => {
      const keys = "She sell sells seashells by the seashore".split(" ");
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
      expect(trie.contains("sell")).toBe(true);
      expect(trie.contains("selll")).toBe(false);
      expect(trie.contains("seashores")).toBe(false);
      console.log(trie.getWords(""));
    
      expect(trie.getWords("").length).toBe(7);
      expect(trie.getWords("h").length).toBe(0);
      expect(trie.getWords("Sh").length).toBe(1);
      expect(trie.getWords("sea").length).toBe(2);
      expect(trie.getWords("sell").length).toBe(2);
      expect(trie.getWords("s").length).toBe(4);
      expect(trie.getWords("seashore").length).toBe(1);
      expect(trie.getWords("seashores").length).toBe(0);
    });
  };
}
describe('readonly trie tree', testTrie(false, false));
describe('readonly trie tree from dataIndices', testTrie(false, true));
describe('readonly trie tree with dump', testTrie(true, false));
describe('readonly trie tree from dataIndices with dump', testTrie(true, true));
