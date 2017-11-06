var bf = require("bloomfilter"),
    BloomFilter = bf.BloomFilter,
    fnv_1a = bf.fnv_1a,
    fnv_1a_b = bf.fnv_1a_b;

module.exports = class PickleRick {
  constructor (bits, step) {
    this.step = step
    this.bloom = new BloomFilter(
      bits, // number of bits to allocate.
      16        // number of hash functions.
    );
    this.index = 0;
  }

  compress(buffer) {
    for (var i = 0; i < buffer.length; i++) {
      //console.log(`${this.index}:${buffer[i]}`);
      this.bloom.add(`${this.index}:${buffer[i]}`)
      this.index++;
    }
  }

  decompress() {
    var _this = this;
    var PoWByte = function(index) {
      for(var i = 0; i < 256; i++) {
        if(_this.bloom.test(`${index}:${i}`)) {
          return i;
        }
      }
      throw new Error(`No byte found at index ${index}!`)
    }
    var b = new Buffer(this.index)
    for(var i = 0; i < this.index; i++) {
      var byte = PoWByte(i);
      b[i] = byte
    }
    return b;
  }

  toJSON() {
    var array = [].slice.call(this.bloom.buckets)
    return array
  }

  static fromJSON(array) {
    var pickleRick = new PickleRick()
    pickleRick.bloom = new BloomFilter(array, 3)
  }
}
