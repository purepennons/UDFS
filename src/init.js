"use strict"

const config = require('./config/config.json')
const SecureDB = require('./secure_db/index')
const UFS = require('./fuse/index')

// initial
try {

  // db setting
  let db_location = config.db.location || './data/db'
  let db_options = config.db.options

  // connect to db
  // db.db is the instance of leveldb
  let db = new SecureDB(db_location, db_options)

  // initial the file system
  let fs_options = config.fuse
  let ufs = new UFS(fs_options.mnt, db, {
    fuse_ops: {
      options: fs_options.options
    }
  })

  // just for cleanup
  global.ufs = ufs

  ufs.mount().then( () => {
    console.log('mount success')
  }).catch( err => {
    console.error('Mount the file system failed.', err.stack)
  })


} catch(err) {
  console.error('Initialization failed', err.stack)
  process.exit(1)
}

process.on('exit', () => {
  // cleanup
  global.ufs.unmount().then(()=> console.log('System exit.'))
})

process.on('SIGINT', () => {
  global.ufs.unmount().then( () => {
    process.exit(0)
    console.log('System exit.')
  })
})
