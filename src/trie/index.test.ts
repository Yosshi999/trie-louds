import {BuildTrie} from '.';

describe('trie', () => {
  it('build', () => {
    const keys = ["an", "i", "of", "one", "out", "our"];
    const trie = BuildTrie(keys);
    expect(trie.labels).toBe("-^aionfnuert");
    expect(trie.vector.data.toString('hex')).toBe(Buffer.from([
      0b01011101,
      0b10001110,
      0b00000110
    ]).toString('hex'));
    expect(trie.terminals.data.toString('hex')).toBe(Buffer.from([
      0b00110100,
      0b00000111
    ]).toString('hex'));
    expect(trie.values.length).toBe(6);
    expect(trie.terminals.rank1(2)).toBe(0);
    expect(trie.terminals.rank1(3)).toBe(1);
    expect(trie.terminals.rank1(4)).toBe(1);
    expect(trie.terminals.rank1(5)).toBe(2);

    expect(trie.Contains("an")).toBe(0);
    expect(trie.Contains("i")).toBe(1);
    expect(trie.Contains("of")).toBe(2);
    expect(trie.Contains("one")).toBe(3);
    expect(trie.Contains("out")).toBe(4);
    expect(trie.Contains("our")).toBe(5);

    expect(trie.Contains("on")).toBe(null);
    expect(trie.Contains("")).toBe(null);
    expect(trie.Contains("ix")).toBe(null);
    expect(trie.Contains("outo")).toBe(null);
  });

  it('retrieve', () => {
    const data = Buffer.from([
      0b01011101,
      0b10001110,
      0b00000110
    ]);
    const labels = "-^aionfnuert";
    const terminals = Buffer.from([
      0b00110100,
      0b00000111
    ]);
    const trie = BuildTrie(data, labels, terminals, [1,0,2,3,5,4]);
    expect(trie.Contains("an")).toBe(0);
    expect(trie.Contains("i")).toBe(1);
    expect(trie.Contains("of")).toBe(2);
    expect(trie.Contains("one")).toBe(3);
    expect(trie.Contains("out")).toBe(4);
    expect(trie.Contains("our")).toBe(5);

    expect(trie.Contains("on")).toBe(null);
    expect(trie.Contains("")).toBe(null);
    expect(trie.Contains("ix")).toBe(null);
    expect(trie.Contains("outo")).toBe(null);
  });
});
