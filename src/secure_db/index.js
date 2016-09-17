"use strict"

const debug = require('debug')('secure_db')
const levelup = require('levelup')
const sub = require('subleveldown')
const path = require('path')
const general_ops = require('./operations/general_ops')

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
