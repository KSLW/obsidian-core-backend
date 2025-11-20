'use strict'

var assert = require('assert')
var bufferEqual = require('buffer-equal')
var bitcoin = require('@tradle/bitcoinjs-lib')
var utils = require('@tradle/utils')

TxData.types = {
  permission: 1,
  public: 2
}

TxData.ENCODING = 'base64'

function TxData(prefix, type, data) {
  assert(
    typeof prefix !== 'undefined' &&
    typeof type !== 'undefined' &&
    typeof data !== 'undefined',
    'prefix, type and data are all required'
  )

  if (!Object.keys(TxData.types).some(function(key) {
    return TxData.types[key] === type
  })) {
    throw new Error('unsupported transaction data type')
  }

  this._prefix = prefix
  this._type = type
  this._data = data
}

TxData.prototype.type = function() {
  return this._type
}

TxData.prototype.data = function() {
  return this._data
}

TxData.prototype.toJSON = function () {
  return {
    type: this.type(),
    data: this.data()
  }
}

TxData.prototype.serialize = function() {
  var typeBuf = new Buffer(1)
  typeBuf.writeUInt8(this.type(), 0)
  var prefixBuf = new Buffer(this._prefix)
  var dataBuf = Buffer.isBuffer(this._data) ? this._data : new Buffer(TxData.ENCODING)

  return Buffer.concat([
    prefixBuf,
    typeBuf,
    dataBuf
  ], prefixBuf.length + typeBuf.length + dataBuf.length)
}

TxData.deserialize = function(buf, prefix) {
  assert(
    typeof buf !== 'undefined' &&
    typeof prefix !== 'undefined',
    'buf and prefix are required'
  )

  var prefixBuf = new Buffer(prefix)
  var prefixLength = prefixBuf.length
  if (!bufferEqual(buf.slice(0, prefixLength), prefixBuf)) return

  var type = buf[prefixLength]
  var data = buf.slice(prefixLength + 1)
  try {
    return new TxData(prefix, type, data)
  } catch (err) {}
}

TxData.fromTx = function(tx, prefix) {
  var data = utils.getOpReturnData(tx)
  return data && TxData.deserialize(data, prefix)
}

module.exports = TxData
