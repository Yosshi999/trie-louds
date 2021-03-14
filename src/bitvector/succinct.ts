import assert from 'assert';
import {IBitVector, IStrVector} from './base';

export class BitList {
  data: Buffer;
  capacity: number;
  idx: number;

  constructor(capacity: number) {
    this.data = Buffer.alloc(Math.ceil(capacity / 8));
    this.capacity = capacity;
    this.idx = 0;
  }
  push(x: boolean) {
    assert(this.idx < this.capacity);
    if (x) {
      this.data[this.idx >> 3] |= 1 << (this.idx % 8);
    }
    this.idx++;
  }
  // at(i: number) {
  //   assert(i < this.idx);
  //   return (this.data[i >> 3] >> (i % 8)) & 1;
  // }
  toBuffer() {
    return this.data.slice(0, Math.ceil(this.idx / 8));
  }
  // clear() {
  //   this.idx = 0;
  //   this.data.fill(0);
  // }
}

export class SuccinctBitVector implements IBitVector {
  data: Buffer = Buffer.alloc(0);
  length = 0;
  chunk: Uint32Array = new Uint32Array();
  block: Uint16Array = new Uint16Array();
  private popcntTable: Uint8Array;

  dump() {
    const lengthBuffer = Buffer.allocUnsafe(4);
    lengthBuffer.writeUInt32LE(this.length);
    const dataLengthBuffer = Buffer.allocUnsafe(4);
    dataLengthBuffer.writeUInt32LE(this.data.length);
    const chunkBuffer = Buffer.allocUnsafe(4 * this.chunk.length);
    this.chunk.forEach((v, i) => {
      chunkBuffer.writeUInt32LE(v, i*4);
    });
    const chunkLengthBuffer = Buffer.allocUnsafe(4);
    chunkLengthBuffer.writeUInt32LE(chunkBuffer.length);
    const blockBuffer = Buffer.allocUnsafe(2 * this.block.length);
    this.block.forEach((v, i) => {
      blockBuffer.writeUInt16LE(v, i*2);
    });
    const blockLengthBuffer = Buffer.allocUnsafe(4);
    blockLengthBuffer.writeUInt32LE(blockBuffer.length);

    return Buffer.concat([
      lengthBuffer,
      dataLengthBuffer, this.data,
      chunkLengthBuffer, chunkBuffer,
      blockLengthBuffer, blockBuffer
    ]);
  }

  load(buf: Buffer, offset: number) {
    this.length = buf.readUInt32LE(offset); offset += 4;
    const dataLength = buf.readUInt32LE(offset); offset += 4;
    this.data = buf.slice(offset, offset + dataLength); offset += dataLength;
    const chunkLength = buf.readUInt32LE(offset); offset += 4;
    this.chunk = new Uint32Array(chunkLength/4);
    for (let i = 0; i < chunkLength / 4; i++) {
      this.chunk[i] = buf.readUInt32LE(offset + i*4);
    }
    offset += chunkLength;
    const blockLength = buf.readUInt32LE(offset); offset += 4;
    this.block = new Uint16Array(blockLength/2);
    for (let i = 0; i < blockLength / 2; i++) {
      this.block[i] = buf.readUInt16LE(offset + i*2);
    }
    offset += blockLength;
    return offset;
  }

  constructor(_data?: Buffer) {
    this.popcntTable = new Uint8Array(65536);
    for (let i = 0; i < this.popcntTable.length; i++) {
      let cnt = 0;
      let x = i;
      while (x > 0) {
        if (x % 2 === 1) cnt++;
        x >>= 1;
      }
      this.popcntTable[i] = cnt;
    }
    if (typeof _data === "undefined") return;
    this.data = _data;
    this.length = _data.length * 8;
    this.chunk = new Uint32Array(1+Math.floor(this.length / 1024));
    this.block = new Uint16Array(1+Math.floor(this.length / 16));
    this.build();
  }
  protected build() {
    let idx = 0;
    let cr = 0;
    let br = 0;
    for (let i = 0; i < this.data.length; i++) { // 8-bit step
      if (idx % 1024 === 0) {
        this.chunk[idx / 1024] = cr;
        br = 0;
      }
      if (idx % 16 === 0) {
        this.block[idx / 16] = br;
      }
      let byte = this.data[i];
      br += this.popcntTable[byte];
      cr += this.popcntTable[byte];
      idx += 8;
    }
    if (idx % 1024 === 0) {
      this.chunk[idx / 1024] = cr;
      br = 0;
    }
    if (idx % 16 === 0) {
      this.block[idx / 16] = br;
    }
  }
  access(index: number) {
    const subindex = index % 8;
    return ((this.data[index >> 3] >> subindex) & 1) == 1;
  }
  rank1(index: number) {
    if (index === 0) return 0;
    const c = Math.floor(index / 1024);
    const b = Math.floor(index / 16);
    const offset = index % 16;
    let bitPtn = 0;
    if (this.data[b*16/8]) bitPtn += this.data[b*16/8];
    if (this.data[b*16/8 + 1]) bitPtn += this.data[b*16/8 + 1] * 256;
    const bitPtnMasked = bitPtn & ((1 << offset) - 1);
    
    return this.chunk[c] + this.block[b] + this.popcntTable[bitPtnMasked];
  }
  rank0(index: number) {
    return index - this.rank1(index);
  }
  select1(num: number) {
    if (num == 0) return 0;
    assert(
      this.rank1(this.length) >= num,
      `num given to select1() is too large: ${this.rank1(this.length)} vs ${num}`
    );
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
    assert(
      this.rank0(this.length) >= num,
      `num given to select0() is too large: ${this.rank0(this.length)} vs ${num}`
    );
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

export class SuccinctStrVector implements IStrVector {
  length: number = 0;
  data: Buffer = Buffer.alloc(0);
  /* isEmpty[i] <=> vector[i] == "" */
  isEmpty: SuccinctBitVector = new SuccinctBitVector();
  /* vector[i] == data[delim.select1(isEmpty.rank0(i))*2 : delim.select1(isEmpty.rank0(i)+1)*2] */
  delim: SuccinctBitVector = new SuccinctBitVector();

  constructor(keys?: string[]) {
    if (typeof keys === "undefined") return;
    this.data = Buffer.from(keys.join(""), 'ucs2');
    this.length = keys.length;
    const isEmpty = new BitList(this.length);
    const delim = new BitList(this.data.length >> 1);
    let n = 0;
    keys.forEach((v, idx) => {
      n += v.length;
      if (v.length > 0) {
        isEmpty.push(false);
        for (let i = 0; i < v.length-1; i++) delim.push(false);
        delim.push(true);
      } else {
        isEmpty.push(true);
      }
    });
    this.isEmpty = new SuccinctBitVector(isEmpty.toBuffer());
    this.delim = new SuccinctBitVector(delim.toBuffer());
  }

  dump() {
    const lengthBuffer = Buffer.allocUnsafe(4);
    lengthBuffer.writeUInt32LE(this.length);
    const dataLengthBuffer = Buffer.allocUnsafe(4);
    dataLengthBuffer.writeUInt32LE(this.data.length);
    return Buffer.concat([
      lengthBuffer,
      dataLengthBuffer, this.data,
      this.isEmpty.dump(),
      this.delim.dump()
    ]);
  }

  load(buf: Buffer, offset: number): number {
    this.length = buf.readUInt32LE(offset); offset += 4;
    const dataLength = buf.readUInt32LE(offset); offset += 4;
    this.data = buf.slice(offset, offset+dataLength); offset += dataLength;
    offset = this.isEmpty.load(buf, offset);
    offset = this.delim.load(buf, offset);
    return offset;
  }

  static fromBufferIndices(buf: Buffer, indices: Uint32Array) {
    const obj = new this();
    obj.data = buf;
    obj.length = indices.length - 1;

    const isEmpty = new BitList(obj.length);
    const delim = new BitList(obj.data.length >> 1);
    for (let i = 0; i < indices.length-1; i++) {
      if (indices[i] < indices[i+1]) {
        isEmpty.push(false);
        for (let j = indices[i]; j < indices[i+1]-1; j++) delim.push(false);
        delim.push(true);
      } else {
        isEmpty.push(true);
      }
    }
    obj.isEmpty = new SuccinctBitVector(isEmpty.toBuffer());
    obj.delim = new SuccinctBitVector(delim.toBuffer());
    return obj;
  }

  at(index: number) {
    if (this.isEmpty.access(index)) return '';
    const delimIdx = this.isEmpty.rank0(index);
    const begin = this.delim.select1(delimIdx);
    const end = this.delim.select1(delimIdx+1);
    return this.data.slice(begin*2, end*2).toString('ucs2');
  }
}
