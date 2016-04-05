"use strict"

const levelup = require('levelup')
const path = require('path')

class SecureDB {
  constructor(location, options) {
    if(!location) throw new Error('Without the db location.')
    this.location = location
    this.options = options || {
      "createIfMissing": true,
      "errorIfExists": false,
      "compression": true,
      "cacheSize": 8*1024*1024
    }

    this.db = levelup(path.resolve(this.location))
  }
}

module.exports = SecureDB
