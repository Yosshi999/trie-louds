import {BuildTrie} from '.';

describe('trie', () => {
  it('build', () => {
    const keys = ["an", "i", "of", "one", "our", "out"];
    const trie = BuildTrie(keys);
    expect(trie.labels).toBe("-^aionfnuert");
    expect(trie.vector.data.toString('hex')).toBe(Buffer.from([
      0b01011101,
      0b10001110,
      0b00000110
    ]).toString('hex'));
    expect(trie.terminals.toString('hex')).toBe(Buffer.from([
      0b00110100,
      0b00000111
    ]).toString('hex'));
    expect(trie.Contains("an")).toBe(true);
    expect(trie.Contains("i")).toBe(true);
    expect(trie.Contains("of")).toBe(true);
    expect(trie.Contains("one")).toBe(true);
    expect(trie.Contains("our")).toBe(true);
    expect(trie.Contains("out")).toBe(true);

    expect(trie.Contains("on")).toBe(false);
    expect(trie.Contains("")).toBe(false);
    expect(trie.Contains("ix")).toBe(false);
    expect(trie.Contains("outo")).toBe(false);
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
    const trie = BuildTrie(data, labels, terminals);
    expect(trie.Contains("an")).toBe(true);
    expect(trie.Contains("i")).toBe(true);
    expect(trie.Contains("of")).toBe(true);
    expect(trie.Contains("one")).toBe(true);
    expect(trie.Contains("our")).toBe(true);
    expect(trie.Contains("out")).toBe(true);

    expect(trie.Contains("on")).toBe(false);
    expect(trie.Contains("")).toBe(false);
    expect(trie.Contains("ix")).toBe(false);
    expect(trie.Contains("outo")).toBe(false);
  });
});
