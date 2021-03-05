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

  dump(): Buffer;
  load(buf: Buffer, offset: number): number;
}

export interface IStrVector {
  /** Returns the string at `index` */
  at(index: number): string;

  length: number;
  data: string;

  dump(): Buffer;
  load(buf: Buffer, offset: number): number;
}
