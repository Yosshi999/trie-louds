import { assert } from 'console';
import {LoudsBackend} from '.';
import {IBitVector,NaiveBitVector,SuccinctBitVector} from '../bitvector';

type BitVector = new (data?: Buffer) => IBitVector;
function testLouds(V: BitVector, withDump: boolean, fromDataIndices: boolean) {
  return () => {
    it('build', () => {
      const keys = ["an", "i", "of", "one", "out", "our"];
      let trie = new LoudsBackend(V);
      if (fromDataIndices) {
        const indices = [0];
        keys.forEach((v) => {indices.push(indices[indices.length-1] + v.length)});
        trie.buildFromDataIndices(keys.join(""), new Uint32Array(indices));
      } else {
        trie.build(keys);
      }
      if (withDump) {
        const buf = trie.dump();
        trie = new LoudsBackend(V);
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
      expect(trie.getParent(first)).toBe(trie.getRoot());
      expect(trie.getEdge(first)).toBe("a");
      expect(trie.getTerminal(first)!.value).toBe(0);
      expect(trie.getTerminal(first)!.tail).toBe("n");
      expect(trie.getFirstChild(first)).toBe(null);

      const second = trie.getNextSibling(first)!;
      expect(trie.getEdge(second)).toBe("i");
      expect(trie.getParent(second)).toBe(trie.getRoot());
    });
  
    it('build2', () => {
      const keys = ["an", "ans"];
      let trie = new LoudsBackend(V);
      if (fromDataIndices) {
        const indices = [0];
        keys.forEach((v) => {indices.push(indices[indices.length-1] + v.length)});
        trie.buildFromDataIndices(keys.join(""), new Uint32Array(indices));
      } else {
        trie.build(keys);
      }
      if (withDump) {
        const buf = trie.dump();
        trie = new LoudsBackend(V);
        trie.load(buf, 0);
      }
  
      const first = trie.getFirstChild(trie.getRoot())!;
      expect(trie.getParent(first)).toBe(trie.getRoot());
      expect(trie.getEdge(first)).toBe("a");
      expect(trie.getNextSibling(first)).toBe(null);
      expect(trie.getTerminal(first)).toBe(null);
      const an = trie.getFirstChild(first)!;
      expect(trie.getParent(an)).toBe(first);
      expect(trie.getEdge(an)).toBe("n");
      expect(trie.getTerminal(an)!.tail).toBe("");
      expect(trie.getNextSibling(an)).toBe(null);
      const ans = trie.getFirstChild(an)!;
      expect(trie.getParent(ans)).toBe(an);
      expect(trie.getEdge(ans)).toBe("s");
      expect(trie.getFirstChild(ans)).toBe(null);
      expect(trie.getTerminal(ans)!.tail).toBe("");
    });
  
    it('build3', () => {
      const keys = ["an", "answer"];
      let trie = new LoudsBackend(V);
      if (fromDataIndices) {
        const indices = [0];
        keys.forEach((v) => {indices.push(indices[indices.length-1] + v.length)});
        trie.buildFromDataIndices(keys.join(""), new Uint32Array(indices));
      } else {
        trie.build(keys);
      }
      if (withDump) {
        const buf = trie.dump();
        trie = new LoudsBackend(V);
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
describe('LOUDS', testLouds(NaiveBitVector, false, false));
describe('LOUDS from dataIndices', testLouds(NaiveBitVector, false, true));
describe('LOUDS with dump', testLouds(NaiveBitVector, true, false));
describe('LOUDS from dataIndices with dump', testLouds(NaiveBitVector, true, true));

describe('Succinct LOUDS', testLouds(SuccinctBitVector, false, false));
describe('Succinct LOUDS from dataIndices', testLouds(SuccinctBitVector, false, true));
describe('Succinct LOUDS with dump', testLouds(SuccinctBitVector, true, false));
describe('Succinct LOUDS from dataIndices with dump', testLouds(SuccinctBitVector, true, true));
