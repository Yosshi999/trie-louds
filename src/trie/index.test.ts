import {LOUDS} from '.';
import {NaiveBitVector} from '../bitvector';

describe('LOUDS', () => {
  it('build', () => {
    const keys = ["an", "i", "of", "one", "out", "our"];
    const trie = new LOUDS(NaiveBitVector);
    trie.build(keys);

    expect(trie.edge).toBe("aiofnurt");
    expect(trie.tails.data).toBe("ne");
    expect(trie.vector.data.toString('hex')).toBe(Buffer.from([
      0b00011101,
      0b11000111,
      0b00000000
    ]).toString('hex'));
    expect(trie.terminals.data.toString('hex')).toBe(Buffer.from([
      0b11011011
    ]).toString('hex'));
    expect(trie.values.length).toBe(6);

    const first = trie.getFirstChild(trie.getRoot());
    expect(trie.getEdge(first)).toBe("a");
    expect(trie.getTerminal(first).value).toBe(0);
    expect(trie.getTerminal(first).tail).toBe("n");
    expect(trie.getFirstChild(first)).toBe(null);
  });
});

