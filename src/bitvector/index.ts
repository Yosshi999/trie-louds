export interface IBitVector {
  /** The number of '1' in [0, index) */
  rank1(index: number): number;

  /** The number of '0' in [0, index) */
  rank0(index: number): number;

  /** Returns minimum idx such that rank1(idx) == num */
  select1(num: number): number;

  /** Returns minimum idx such that rank0(idx) == num */
  select0(num: number): number;

  access(index: number): boolean;

  length: number;
  data: Buffer;
}

export class NaiveBitVector implements IBitVector {
  private ranks: Uint32Array;
  // private ranks: number[];
  data: Buffer;
  length = 0;

  constructor(_data: Buffer) {
    this.data = _data;
    this.length = _data.length * 8;
    this.ranks = new Uint32Array(this.length);
    // this.ranks = new Array(this.length);
    this.build();
  }
  protected build() {
    let r = 0;
    for (let i = 0; i < this.data.length; i++) {
      let byte = this.data[i];
      for (let j = 0; j < 8; j++) {
        if ((byte & 1) == 1) r++;
        this.ranks[i*8 + j] = r;
        byte >>= 1;
      }
    }
    this.length = this.ranks.length;
  }
  access(index: number) {
    const subindex = index % 8;
    return ((this.data[index >> 3] >> subindex) & 1) == 1;
  }
  rank1(index: number) {
    if (index === 0) return 0;
    return this.ranks[index - 1];
  }
  rank0(index: number) {
    return index - this.rank1(index);
  }
  select1(num: number) {
    if (num == 0) return 0;
    if (this.rank1(this.length) < num) return -1;
    let left = 0;
    let right: number = this.length;
    while (right - left > 1) {
      let mid = (left + right) >> 1;
      if (this.rank1(mid) >= num) {
        right = mid;
      }
      else {
        left = mid;
      }
    }
    return right;
  }
  select0(num: number) {
    if (num == 0) return 0;
    if (this.rank0(this.length) < num) return -1;
    let left = 0;
    let right: number = this.length;
    while (right - left > 1) {
      let mid = (left + right) >> 1;
      if (this.rank0(mid) >= num) {
        right = mid;
      }
      else {
        left = mid;
      }
    }
    return right;
  }
}

export class SuccinctBitVector extends NaiveBitVector {
  build() {

  }
  rank1(index: number) {
    return 0;
  }
}
