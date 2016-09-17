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

    /*
     * TODO: Storage 可以透過 CMD SERVER 新增，暫時寫死
     */
    let storage_ops = general_ops(this.storageMetadata) // storage operations
    storage_ops.putAsync('storage-1234567890', {
      fs_id: '70642310-3134-11e6-9e2f-3ffeaedf456b',
      protocol: 'http',
      host: 'localhost',
      port: 3000,
      hostname: 'http://localhost:3000',
      auth: {},
      otherInfo: {}
    }).catch(err => debug('storage put error', err.stack))
  }
}

module.exports = SecureDB
