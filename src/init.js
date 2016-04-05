"use strict"

const config = require('./config/config.json')
const SecureDB = require('./secure_db/index')

// initial
try {

  // db setting
  let db_location = config.db.location || './data/db'
  let db_options = config.db.options

  // connect to db
  // db.db is the instance of leveldb
  let db = new SecureDB(db_location, db_options)

} catch(err) {
  console.error('Initialization failed', err)

}

process.on('exit', ()=> {
  // cleanup
})
