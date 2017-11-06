var bf = require("bloomfilter"),
    BloomFilter = bf.BloomFilter,
    fnv_1a = bf.fnv_1a,
    fnv_1a_b = bf.fnv_1a_b;

module.exports = class PickleRick {
  constructor (bits, step) {
    this.step = step
    this.bits = bits
    this.bloom = new BloomFilter(
      bits, // number of bits to allocate.
      16        // number of hash functions.
    );
    this.index = 0;
  }

  compress(buffer) {
    var byteArr = Array.prototype.slice.call(buffer, 0)
    for (var i = 0; i < buffer.length; i += this.step) {
      var sliced = byteArr.slice(i, i + this.step)
      if(sliced.length < this.step) {
        sliced = sliced.concat(Array(this.step - sliced.length).fill(0))
      }
      console.log(`${this.index}:${sliced.join(":")}`);
      this.bloom.add(`${this.index}:${sliced.join(":")}`)
      this.index++;
    }
  }

  decompress() {
    var _this = this;
    var PoWByte = function(index) {
      var counter = Array(_this.step).fill(0)
      var checkCounter = function(pos) {
        if(counter[pos] === 256) {
          if(counter.length > (pos + 1)) {
            counter[pos + 1]++
            counter[pos] = 0
            checkCounter(pos + 1)
          }
        }
      }
      for(var i = 0; i < Math.pow(255, _this.step); i++) {
        // if(i % 100000 == 0) {
        //   console.log('still trying...', counter);
        // }
        var q = `${index}:${counter.join(":")}`
        if(_this.bloom.test(q)) {
          console.log(`Found a ${_this.step}-step byte array!`, q);
          return counter;
        }

        counter[0]++
        checkCounter(0)
        //console.log(`${index}:${counter.join(":")}`);
      }
      throw new Error(`No byte found at index ${index}!`)
    }
    var b = new Buffer(this.index * this.step)
    var offset = 0
    for(var i = 0; i < this.index; i++) {
      var bytes = PoWByte(i);
      for(var byte of bytes) {
        b[offset] = byte
        offset++
      }
    }
    return b;
  }

  toJSON() {
    var array = [].slice.call(this.bloom.buckets)
    return { index: this.index, array, bits: this.bits, step: this.step }
  }

  static fromJSON(obj) {
    var pickleRick = new PickleRick(obj.bits, obj.step)
    pickleRick.bloom = new BloomFilter(obj.array, 16)
    pickleRick.index = obj.index
    return pickleRick
  }
}
