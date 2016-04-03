const levelup = require('levelup')
const path = require('path')
const config = require('./config/config.json')

// initial
try {
  // connect to leveldb

  let db_path = config.db.path || './data/db'

  let db_options = config.db.options || {
    "createIfMissing": true,
    "errorIfExists": false,
    "compression": true,
    "cacheSize": 8*1024*1024
  }

  global.db = levelup('/src/src/data/db')

} catch(err) {
  console.error('Initialization failed', err)

  // cleanup
  global.db.close()
  process.exit(1)
}

global.db.close()
