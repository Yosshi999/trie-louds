import {IBitVector, IStrVector} from './base';

export class NaiveBitVector implements IBitVector {
  private ranks: Uint32Array = new Uint32Array();
  // private ranks: number[];
  data: Buffer = Buffer.alloc(0);
  length = 0;

  dump() {
    const lengthBuffer = Buffer.allocUnsafe(4);
    lengthBuffer.writeUInt32LE(this.length);
    const dataLengthBuffer = Buffer.allocUnsafe(4);
    dataLengthBuffer.writeUInt32LE(this.data.length);
    const ranksBuffer = Buffer.allocUnsafe(4 * this.ranks.length);
    this.ranks.forEach((v, i) => {
      ranksBuffer.writeUInt32LE(v, i*4);
    });
    const ranksLengthBuffer = Buffer.allocUnsafe(4);
    ranksLengthBuffer.writeUInt32LE(ranksBuffer.length);

    return Buffer.concat([
      lengthBuffer,
      dataLengthBuffer, this.data,
      ranksLengthBuffer, ranksBuffer
    ]);
  }

  load(buf: Buffer, offset: number) {
    this.length = buf.readUInt32LE(offset); offset += 4;
    const dataLength = buf.readUInt32LE(offset); offset += 4;
    this.data = buf.slice(offset, offset + dataLength); offset += dataLength;
    const ranksLength = buf.readUInt32LE(offset); offset += 4;
    this.ranks = new Uint32Array(ranksLength / 4);
    for (let i = 0; i < ranksLength / 4; i += 1) {
      this.ranks[i] = buf.readUInt32LE(offset + i*4);
    }
    offset += ranksLength;
    return offset;
  }

  constructor(_data?: Buffer) {
    if (typeof _data === "undefined") return;
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

export class NaiveStrVector implements IStrVector {
  length: number = 0;
  data: Buffer = Buffer.alloc(0);
  indices: Uint32Array = new Uint32Array();

  dump() {
    const lengthBuffer = Buffer.allocUnsafe(4);
    lengthBuffer.writeUInt32LE(this.length);
    const dataLengthBuffer = Buffer.allocUnsafe(4);
    dataLengthBuffer.writeUInt32LE(this.data.length);
    const indicesBuffer = Buffer.allocUnsafe(4 * this.indices.length);
    this.indices.forEach((v, i) => {
      indicesBuffer.writeUInt32LE(v, i*4);
    });
    const indicesLengthBuffer = Buffer.allocUnsafe(4);
    indicesLengthBuffer.writeUInt32LE(indicesBuffer.length);
    return Buffer.concat([
      lengthBuffer,
      dataLengthBuffer, this.data,
      indicesLengthBuffer, indicesBuffer
    ]);
  }

  load(buf: Buffer, offset: number) {
    this.length = buf.readUInt32LE(offset); offset += 4;
    const dataLength = buf.readUInt32LE(offset); offset += 4;
    this.data = buf.slice(offset, offset+dataLength); offset += dataLength;
    const indicesLength = buf.readUInt32LE(offset); offset += 4;
    this.indices = new Uint32Array(indicesLength / 4);
    for (let i = 0; i < indicesLength / 4; i += 1) {
      this.indices[i] = buf.readUInt32LE(offset + i*4);
    }
    offset += indicesLength;
    return offset;
  }

  constructor(keys?: string[]) {
    if (typeof keys === "undefined") return;
    this.data = Buffer.from(keys.join(""), 'ucs2');
    this.length = keys.length;
    this.indices = new Uint32Array(this.length+1);
    let n = 0;
    keys.forEach((v, idx) => {
      this.indices[idx] = n;
      n += v.length;
    });
    this.indices[keys.length] = n;
  }

  static fromBufferIndices(buf: Buffer, indices: Uint32Array) {
    const obj = new this();
    obj.data = buf;
    obj.indices = indices;
    obj.length = indices.length - 1;
    return obj;
  }

  at(index: number) {
    const begin = this.indices[index];
    const end = this.indices[index+1];
    return this.data.slice(begin*2, end*2).toString('ucs2');
  }
}
