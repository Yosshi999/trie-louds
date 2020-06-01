import {ReadonlyTrieTree} from '.';
describe('readonly trie tree', () => {
  it('build', () => {
    const keys = ["an", "i", "of", "one", "out", "our"];
    const trie = new ReadonlyTrieTree(keys);
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
    const trie = new ReadonlyTrieTree(keys);
    expect(trie.length).toBe(2);
    
    expect(trie.contains("apple")).toBe(true);
    expect(trie.contains("apples")).toBe(true);
    expect(trie.contains("appl")).toBe(false);
    expect(trie.contains("appless")).toBe(false);
  });

  it('build3', () => {
    const keys = ["an", "answer"];
    const trie = new ReadonlyTrieTree(keys);
    expect(trie.length).toBe(2);
    
    expect(trie.contains("a")).toBe(false);
    expect(trie.contains("an")).toBe(true);
    expect(trie.contains("answ")).toBe(false);
    expect(trie.contains("answer")).toBe(true);
    expect(trie.contains("answers")).toBe(false);
  });

  it('getwords', () => {
    const keys = "She sell sells seashells by the seashore".split(" ");
    const trie = new ReadonlyTrieTree(keys);
    expect(trie.contains("sell")).toBe(true);
    console.log(trie.getWords(""));

    expect(trie.getWords("").length).toBe(7);
    expect(trie.getWords("h").length).toBe(0);
    expect(trie.getWords("sea").length).toBe(2);
    expect(trie.getWords("sell").length).toBe(2);
    expect(trie.getWords("s").length).toBe(4);
  });
});
