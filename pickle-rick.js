var bf = require("bloomfilter"),
    StableBloomFilter = bf.StableBloomFilter,
    fnv_1a = bf.fnv_1a,
    fnv_1a_b = bf.fnv_1a_b;
var BloomFilter = require('bloom-filter');

module.exports = class PickleRick {
  constructor (bits, step) {
    this.step = step
    this.bits = bits
    var falsePositiveRate = 0.01;
    var filter = BloomFilter.create(bits, falsePositiveRate);
    this.bloom = filter
    this.index = 0;
    this.startingPoint = 255
  }

  compress(buffer) {
    var byteArr = Array.prototype.slice.call(buffer, 0)
    for (var i = 0; i < buffer.length; i += this.step) {
      var sliced = byteArr.slice(i, i + this.step)
      for(var byte of sliced) {
        this.startingPoint = Math.min(byte, this.startingPoint)
      }
      if(sliced.length < this.step) {
        sliced = sliced.concat(Array(this.step - sliced.length).fill(0))
      }
      //console.log(`${this.index}:${sliced.join(":")}`);
      this.bloom.insert(`${this.index}:${sliced.join(":")}`)
      this.index++;
    }
  }

  decompress() {
    var _this = this;
    var PoWByte = function(index) {
      var counter = Array(_this.step).fill(_this.startingPoint)
      var checkCounter = function(pos) {
        if(counter[pos] === 256) {
          if(counter.length > (pos + 1)) {
            counter[pos + 1]++
            counter[pos] = _this.startingPoint
            checkCounter(pos + 1)
          }
        }
      }
      for(var i = 0; i < Math.pow(255, _this.step); i++) {
        if(i > 0 && i % 1000000 == 0) {
          console.log('still trying...', counter);
        }
        var q = `${index}:${counter.join(":")}`
        if(_this.bloom.contains(q)) {
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
    var array = this.bloom.toObject()
    return { index: this.index, array, bits: this.bits, step: this.step, startingPoint: this.startingPoint }
  }

  static fromJSON(obj) {
    var pickleRick = new PickleRick(obj.bits, obj.step)
    pickleRick.startingPoint = startingPoint
    pickleRick.bloom = StableBloomFilter.prototype.unserialize(obj.array)
    pickleRick.index = obj.index
    return pickleRick
  }
}
