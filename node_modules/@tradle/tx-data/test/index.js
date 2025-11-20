
var crypto = require('crypto')
var test = require('tape')
var bufferEqual = require('buffer-equal')
var TxData = require('../tx-data')

test('transaction data', function(t) {
  t.plan(Object.keys(TxData.types).length * 2);

  var prefix = 'blah';
  for (var type in TxData.types) {
    var typeCode = TxData.types[type];
    var data = crypto.randomBytes(40);
    var tData = new TxData(prefix, typeCode, data);
    var serialized = tData.serialize();
    var deserialized = TxData.deserialize(serialized, prefix);
    var parsedData = deserialized.data();

    t.ok(bufferEqual(data, parsedData));
    t.equal(typeCode, deserialized.type());
  }
});
