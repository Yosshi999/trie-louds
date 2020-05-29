import * as bv from ".";

describe('naive bitvector', () => {
  it('rank1', () => {
    const buf = Buffer.from([
      0b01011101,
      0b10001110,
      0b00000110
    ]);
    const vec = new bv.NaiveBitVector(buf);
    
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
    const vec = new bv.NaiveBitVector(buf);
    
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
    const vec = new bv.NaiveBitVector(buf);
    
    expect(vec.select0(0)).toBe(0);
    expect(vec.select0(1)).toBe(2);
    expect(vec.select0(10)).toBe(21);
  });
});
