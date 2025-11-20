
var util = require('util')
var typeforce = require('typeforce')
var Externr = require('externr')
var Transform = require('stream').Transform
var debug = require('debug')('verifier')
var safe = require('safecb')

module.exports = Verifier
module.exports.plugins = require('./plugins')
util.inherits(Verifier, Transform)

function Verifier (options) {
  typeforce({
    lookup: 'Function'
  }, options)

  Transform.call(this, {
    objectMode: true
  })

  this._externs = Externr({
    wrap: [ 'verify' ]
  })

  this.lookup = options.lookup
  this.use = this._externs.$register.bind(this._externs)
}

Verifier.prototype._transform = function (chainedObj, enc, done) {
  var self = this
  this.verify(chainedObj, function (err) {
    if (err) {
      debug('failed to verify', chainedObj.key, err)
    } else {
      self.push(chainedObj)
    }

    done()
  })
}

Verifier.prototype.verify = function (obj, cb) {
  this._externs.verify(this, [ this, obj, safe(cb) ], function (verifier, obj, cb) {
    cb(null, true)
  })
}
