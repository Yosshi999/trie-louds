import {IBitVector} from './base';

export class SuccinctBitVector implements IBitVector {
  data: Buffer = Buffer.alloc(0);
  length = 0;
  chunk: Uint32Array = new Uint32Array();
  block: Uint16Array = new Uint16Array();
  private popcntTable: Uint16Array;

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
    this.popcntTable = new Uint16Array(65536);
    for (let i = 0; i < this.popcntTable.length; i++) {
      let cnt = 0;
      let x = i;
      while (x > 0) {
        if (x % 2 == 1) cnt++;
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
      if (idx % 1024 == 0) {
        this.chunk[idx / 1024] = cr;
        br = 0;
      }
      if (idx % 16 == 0) {
        this.block[idx / 16] = br;
        cr += br;
      }
      let byte = this.data[i];
      br += this.popcntTable[byte];
      idx += 8;
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
    let bitPtn = this.data[b*16/8];
    if (this.data[b*16/8 + 1]) bitPtn += this.data[b*16/8 + 1] * 256;
    const bitPtnMasked = bitPtn & ((1 << offset) - 1);
    
    return this.chunk[c] + this.block[b] + this.popcntTable[bitPtnMasked];
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
