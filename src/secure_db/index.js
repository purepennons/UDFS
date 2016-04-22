"use strict"

const levelup = require('levelup')
const sub = require('subleveldown')
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

    // db level defined
    this.db = levelup(path.resolve(this.location))
    this.storageMetadata = sub(this.db, 'storageMetadata')
    this.fileMetadata = sub(this.db, 'fileMetadata')
    this.files = sub(this.db, 'files')
  }
}

module.exports = SecureDB
