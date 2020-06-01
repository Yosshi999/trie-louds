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
  });
});
