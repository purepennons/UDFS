"use strict"

const levelup = require('levelup')
const path = require('path')
const config = require('./config/config.json')

// initial
try {

  // db setting
  let db_path = config.db.path || './data/db'
  let db_options = config.db.options || {
    "createIfMissing": true,
    "errorIfExists": false,
    "compression": true,
    "cacheSize": 8*1024*1024
  }

  // connect to leveldb
  let db = levelup(path.resolve(db_path))

} catch(err) {
  console.error('Initialization failed', err)

  // cleanup

  process.exit(1)
}
