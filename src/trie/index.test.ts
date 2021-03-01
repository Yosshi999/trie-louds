import { assert } from 'console';
import {LoudsBackend} from '.';
import {NaiveBitVector} from '../bitvector';

function testLouds(withDump: boolean) {
  return () => {
    it('build', () => {
      const keys = ["an", "i", "of", "one", "out", "our"];
      let trie = new LoudsBackend(NaiveBitVector);
      trie.build(keys);
      if (withDump) {
        const buf = trie.dump();
        trie = new LoudsBackend(NaiveBitVector);
        trie.load(buf, 0);
      }
  
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
  
      const first = trie.getFirstChild(trie.getRoot())!;
      expect(trie.getEdge(first)).toBe("a");
      expect(trie.getTerminal(first)!.value).toBe(0);
      expect(trie.getTerminal(first)!.tail).toBe("n");
      expect(trie.getFirstChild(first)).toBe(null);
    });
  
    it('build2', () => {
      const keys = ["an", "ans"];
      let trie = new LoudsBackend(NaiveBitVector);
      trie.build(keys);
      if (withDump) {
        const buf = trie.dump();
        trie = new LoudsBackend(NaiveBitVector);
        trie.load(buf, 0);
      }
  
      const first = trie.getFirstChild(trie.getRoot())!;
      expect(trie.getEdge(first)).toBe("a");
      expect(trie.getNextSibling(first)).toBe(null);
      expect(trie.getTerminal(first)).toBe(null);
      const an = trie.getFirstChild(first)!;
      expect(trie.getEdge(an)).toBe("n");
      expect(trie.getTerminal(an)!.tail).toBe("");
      expect(trie.getNextSibling(an)).toBe(null);
      const ans = trie.getFirstChild(an)!;
      expect(trie.getEdge(ans)).toBe("s");
      expect(trie.getFirstChild(ans)).toBe(null);
      expect(trie.getTerminal(ans)!.tail).toBe("");
    });
  
    it('build3', () => {
      const keys = ["an", "answer"];
      let trie = new LoudsBackend(NaiveBitVector);
      trie.build(keys);
      if (withDump) {
        const buf = trie.dump();
        trie = new LoudsBackend(NaiveBitVector);
        trie.load(buf, 0);
      }
  
      const first = trie.getFirstChild(trie.getRoot())!;
      expect(trie.getEdge(first)).toBe("a");
      expect(trie.getNextSibling(first)).toBe(null);
      const an = trie.getFirstChild(first)!;
      expect(trie.getEdge(an)).toBe("n");
      expect(trie.getTerminal(an)!.tail).toBe("");
      expect(trie.getNextSibling(an)).toBe(null);
      const ans = trie.getFirstChild(an)!;
      expect(trie.getEdge(ans)).toBe("s");
      expect(trie.getFirstChild(ans)).toBe(null);
      expect(trie.getTerminal(ans)!.tail).toBe("wer");
    });
  };
}
describe('LOUDS', testLouds(false));
describe('LOUDS with dump', testLouds(true));

