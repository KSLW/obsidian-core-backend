
var Identity = require('@tradle/identity').Identity
var constants = require('@tradle/constants')
var TYPE = constants.TYPE

module.exports = {
  verify: function (verifier, obj, cb, next) {
    if (obj.parsed.data[TYPE] !== Identity.TYPE) {
      return next(verifier, obj, cb)
    }

    try {
      Identity.fromJSON(obj.parsed.data)
    } catch (err) {
      console.warn('Failed to parse identity object', obj)
      // throw err
      return cb(err)
    }

    next(verifier, obj, cb)
  }
}
