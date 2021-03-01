import * as bv from ".";

function testNaiveBitvector(withDump: boolean) {
  return () => {
    it('rank1', () => {
      const buf = Buffer.from([
        0b01011101,
        0b10001110,
        0b00000110
      ]);
      let vec = new bv.NaiveBitVector(buf);
      if (withDump) {
        const buf = vec.dump();
        vec = new bv.NaiveBitVector();
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
  
    it('select1', () => {
      const buf = Buffer.from([
        0b01011101,
        0b10001110,
        0b00000110
      ]);
      let vec = new bv.NaiveBitVector(buf);
      if (withDump) {
        const buf = vec.dump();
        vec = new bv.NaiveBitVector();
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
      let vec = new bv.NaiveBitVector(buf);
      if (withDump) {
        const buf = vec.dump();
        vec = new bv.NaiveBitVector();
        vec.load(buf, 0);
      }
      
      expect(vec.select0(0)).toBe(0);
      expect(vec.select0(1)).toBe(2);
      expect(vec.select0(10)).toBe(21);
    });
  };
}

describe('naive bitvector', testNaiveBitvector(false));
describe('naive bitvector with dump', testNaiveBitvector(true));

function testNaiveStrvector(withDump: boolean) {
  return () => {
    it('at', () => {
      const keys = "ai ao aj sea seashore".split(" ");
      let vec = new bv.NaiveStrVector(keys);
      if (withDump) {
        const buf = vec.dump();
        vec = new bv.NaiveStrVector();
        vec.load(buf, 0);
      }
  
      expect(vec.length).toBe(5);
      expect(vec.at(0)).toBe("ai");
      expect(vec.at(3)).toBe("sea");
      expect(vec.at(4)).toBe("seashore");
    });
  };
}

describe('naive strvector', testNaiveStrvector(false));
describe('naive strvector with dump', testNaiveStrvector(true));
