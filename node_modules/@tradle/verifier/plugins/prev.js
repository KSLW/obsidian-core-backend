
var constants = require('@tradle/constants')
var PREV_HASH = constants.PREV_HASH

module.exports = {
  verify: function (verifier, obj, cb, next) {
    var data = obj.parsed.data

    if (!(PREV_HASH in data)) return next(verifier, obj, cb)

    return verifier.lookup(data[PREV_HASH], function (err, prev) {
      if (err) return cb(err)

      // TODO: check if prev owner's pub key verifies new sig

//       if ((obj.from && !prev.from) || (!obj.from && prev.from)) return cb(new Error('...'))
//       if (obj.from) {
//         // check obj.from and prev.from are the same person
//       }

      next(verifier, obj, cb)
    })
  }
}
