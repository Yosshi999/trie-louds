import {readFileSync} from 'fs';
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
        const buffer = trie.dump();
        trie = ReadonlyTrieTree.load(buffer);
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
        const buffer = trie.dump();
        trie = ReadonlyTrieTree.load(buffer);
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
        const buffer = trie.dump();
        trie = ReadonlyTrieTree.load(buffer);
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
        const buffer = trie.dump();
        trie = ReadonlyTrieTree.load(buffer);
      }
      expect(trie.contains("sell")).toBe(true);
      expect(trie.contains("selll")).toBe(false);
      expect(trie.contains("seashores")).toBe(false);
      console.log(trie.getWords(""));
    
      expect(trie.getWords("").words.length).toBe(7);
      expect(trie.getWords("h").words.length).toBe(0);
      expect(trie.getWords("Sh").words.length).toBe(1);
      expect(trie.getWords("sea").words.length).toBe(2);
      expect(trie.getWords("sell").words.length).toBe(2);
      expect(trie.getWords("s").words.length).toBe(4);
      expect(trie.getWords("seashore").words.length).toBe(1);
      expect(trie.getWords("seashores").words.length).toBe(0);

      expect(trie.getMoreWords(trie.getWords("", 3).temporaryInfo!).words.length).toBe(4);
    });
  };
}
describe('readonly trie tree', testTrie(false, false));
describe('readonly trie tree from dataIndices', testTrie(false, true));
describe('readonly trie tree with dump', testTrie(true, false));
describe('readonly trie tree from dataIndices with dump', testTrie(true, true));

function testLargeTrie(withDump: boolean, fromDataIndices: boolean) {
  return () => {
    it('build', () => {
      const keys = readFileSync("./examples/oxford5000.txt").toString().trim().split(/\r\n|\r|\n/);
      const uniqueKeys = new Set(keys);
      const sortedUniqueKeys = Array.from(uniqueKeys).sort();
      let trie: ReadonlyTrieTree;
      if (fromDataIndices) {
        const indices = [0];
        keys.forEach((v) => {indices.push(indices[indices.length-1] + v.length)});
        trie = ReadonlyTrieTree.fromDataIndices(keys.join(""), new Uint32Array(indices));
      } else {
        trie = ReadonlyTrieTree.fromKeywordList(keys);
      }
      if (withDump) {
        const buffer = trie.dump();
        trie = ReadonlyTrieTree.load(buffer);
      }
      const result = trie.getWords("any");
      expect(result.words.length).toBe(6);
      expect(result.hasMore).toBe(false);
      const result21 = trie.getWords("");
      expect(result21.words.length).toBe(1000);
      expect(result21.words[0]).toBe(sortedUniqueKeys[0]);
      expect(result21.words[999]).toBe(sortedUniqueKeys[999]);
      expect(result21.hasMore).toBe(true);
      console.log(result21.words[999], result21.temporaryInfo);
      const result22 = trie.getMoreWords(result21.temporaryInfo!);
      expect(result22.words.length).toBe(1000);
      expect(result22.words[0]).toBe(sortedUniqueKeys[1000]);
      expect(result22.words[999]).toBe(sortedUniqueKeys[1999]);
      expect(result22.hasMore).toBe(true);

      const result31 = trie.getWords("cr", 30);
      expect(result31.words.length).toBe(30);
      expect(result31.words[0]).toBe("crack");
      expect(result31.hasMore).toBe(true);
      const result32 = trie.getMoreWords(result31.temporaryInfo!, 1);
      expect(result32.words.length).toBe(1);
      expect(result32.hasMore).toBe(true);
      const result33 = trie.getMoreWords(result32.temporaryInfo!, 3);
      expect(result33.words.length).toBe(3);
      expect(result33.hasMore).toBe(true);
      const result34 = trie.getMoreWords(result33.temporaryInfo!, 10);
      expect(result34.words.length).toBe(5);
      expect(result34.hasMore).toBe(false);

      expect(trie.getValue("on")).toBe(1809);
      expect(trie.getValue("onn")).toBe(null);
    
      expect(trie.contains("an")).toBe(false);
      expect(trie.contains("and")).toBe(true);
    });
  };
}
describe('(large file) readonly trie tree', testLargeTrie(false, false));
describe('(large file) readonly trie tree from dataIndices', testLargeTrie(false, true));
describe('(large file) readonly trie tree with dump', testLargeTrie(true, false));
describe('(large file) readonly trie tree from dataIndices with dump', testLargeTrie(true, true));
