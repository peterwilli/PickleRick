var bf = require("bloomfilter"),
    BloomFilter = bf.BloomFilter,
    fnv_1a = bf.fnv_1a,
    fnv_1a_b = bf.fnv_1a_b;
var fs = require('fs');
const PickleRick = require('./pickle-rick')

const task = process.argv[2];

if(task === 'compress') {
  var fname = process.argv[3]
  var pickleRick = new PickleRick(64 * 256, 2)
  var data = fs.readFileSync(fname)
  console.log(data);
  pickleRick.compress(data)
  console.log(data.length);
  console.log(JSON.stringify(pickleRick.toJSON()).length);

  console.log("trying to decompress..");
  data = pickleRick.decompress()
  console.log(data);
}
