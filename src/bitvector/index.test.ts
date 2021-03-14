import * as bv from ".";
import { SuccinctBitVector } from "./succinct";

type BitVector = new (data?: Buffer) => bv.IBitVector;
function testBitvector(V: BitVector, withDump: boolean) {
  return () => {
    it('rank1', () => {
      const buf = Buffer.from([
        0b01011101,
        0b10001110,
        0b00000110
      ]);
      let vec = new V(buf);
      if (withDump) {
        const buf = vec.dump();
        vec = new V();
        vec.load(buf, 0);
      }
      
      expect(vec.rank1(0)).toBe(0);
      expect(vec.rank1(1)).toBe(1);
      expect(vec.rank1(2)).toBe(1);
      expect(vec.rank1(3)).toBe(2);
      expect(vec.rank1(8)).toBe(5);
      expect(vec.rank1(9)).toBe(5);
      expect(vec.rank1(10)).toBe(6);
      expect(vec.rank1(24)).toBe(11);
    });

    it('rank0', () => {
      const buf = Buffer.from([
        0b01011101,
        0b10001110,
        0b00000110
      ]);
      let vec = new V(buf);
      if (withDump) {
        const buf = vec.dump();
        vec = new V();
        vec.load(buf, 0);
      }
      
      expect(vec.rank0(0)).toBe(0);
      expect(vec.rank0(1)).toBe(0);
      expect(vec.rank0(2)).toBe(1);
      expect(vec.rank0(3)).toBe(1);
      expect(vec.rank0(8)).toBe(3);
      expect(vec.rank0(9)).toBe(4);
      expect(vec.rank0(10)).toBe(4);
      expect(vec.rank0(24)).toBe(13);
    });
  
    it('select1', () => {
      const buf = Buffer.from([
        0b01011101,
        0b10001110,
        0b00000110
      ]);
      let vec = new V(buf);
      if (withDump) {
        const buf = vec.dump();
        vec = new V();
        vec.load(buf, 0);
      }
      
      expect(vec.select1(0)).toBe(0);
      expect(vec.select1(1)).toBe(1);
      expect(vec.select1(10)).toBe(18);
    });
  
    it('select0', () => {
      const buf = Buffer.from([
        0b01011101,
        0b10001110,
        0b00000110
      ]);
      let vec = new V(buf);
      if (withDump) {
        const buf = vec.dump();
        vec = new V();
        vec.load(buf, 0);
      }
      
      expect(vec.select0(0)).toBe(0);
      expect(vec.select0(1)).toBe(2);
      expect(vec.select0(10)).toBe(21);
    });

    it('access', () => {
      const buf = Buffer.from([
        0b01011101,
      ]);
      let vec = new V(buf);
      if (withDump) {
        const buf = vec.dump();
        vec = new V();
        vec.load(buf, 0);
      }
      
      expect(vec.access(0)).toBe(true);
      expect(vec.access(1)).toBe(false);
      expect(vec.access(2)).toBe(true);
      expect(vec.access(7)).toBe(false);
    });
  };
}

describe('naive bitvector', testBitvector(bv.NaiveBitVector, false));
describe('naive bitvector with dump', testBitvector(bv.NaiveBitVector, true));
describe('succinct bitvector', testBitvector(bv.SuccinctBitVector, false));
describe('succinct bitvector with dump', testBitvector(bv.SuccinctBitVector, true));

describe('succinct bitvector with chunk width data', () => {
  it('rank1', () => {
    const buf = Buffer.alloc(128, 0xff);
    let vec = new SuccinctBitVector(buf);
    expect(vec.rank1(1023)).toBe(1023);
    expect(vec.rank1(1024)).toBe(1024);
  });
});

type StrVector = 
  (new (keys?: string[]) => bv.IStrVector)
  & {fromBufferIndices: (buf: Buffer, indices: Uint32Array) => bv.IStrVector};
function testStrvector(V: StrVector, withDump: boolean) {
  return () => {
    it('at', () => {
      const keys = "ai ao aj sea seashore".split(" ");
      let vec = new V(keys);
      if (withDump) {
        const buf = vec.dump();
        vec = new V();
        vec.load(buf, 0);
      }
  
      expect(vec.length).toBe(5);
      expect(vec.at(0)).toBe("ai");
      expect(vec.at(3)).toBe("sea");
      expect(vec.at(4)).toBe("seashore");
    });

    it('fromBufferIndices at', () => {
      const keys = "ai ao aj sea seashore".split(" ");
      const indices = [0];
      keys.forEach((v) => {indices.push(indices[indices.length-1] + v.length)});
      let vec = V.fromBufferIndices(Buffer.from(keys.join(''), 'ucs2'), new Uint32Array(indices));
      if (withDump) {
        const buf = vec.dump();
        vec = new V();
        vec.load(buf, 0);
      }
  
      expect(vec.length).toBe(5);
      expect(vec.at(0)).toBe("ai");
      expect(vec.at(3)).toBe("sea");
      expect(vec.at(4)).toBe("seashore");
    });
  };
}

describe('naive strvector', testStrvector(bv.NaiveStrVector, false));
describe('naive strvector with dump', testStrvector(bv.NaiveStrVector, true));
describe('succinct strvector', testStrvector(bv.SuccinctStrVector, false));
describe('succinct strvector with dump', testStrvector(bv.SuccinctStrVector, true));
