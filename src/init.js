"use strict"

const config = require('./config/config.json')
const SecureDB = require('./secure_db/index')
const UFS = require('./fuse/index')

let db = undefined
let ufs = undefined

// initial
async function init() {
  try {
    // db setting
    let db_location = config.db.location || './data/db'
    let db_options = config.db.options

    // connect to db
    // db.db is the instance of leveldb
    db = new SecureDB(db_location, db_options)

    // initial the file system
    let fs_options = config.fuse
    ufs = new UFS(fs_options.mnt, db, {
      fuse_ops: {
        options: fs_options.options
      }
    })

    // mount fs
    await ufs.mount()
    console.log(`File system is mounted at ${fs_options.mnt}`)

  } catch(err) {
    console.error('Initialization failed', err.stack)
    throw err
  }

  return
}

// exit handler
function cleanup() {
  if(ufs) ufs.unmount()
  return
}

function exitHandler(options={}, err) {

  async function exitGen() {
    if(err) console.error('uncaughtException', err.stack)
    if(options.clean) await cleanup()
    if(options.exit) process.exit()
    return
  }

  exitGen().catch(err => console.error(err))
}

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {clean: true, exit: true}))

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {clean: true, exit: true}))

// process close
process.on('exit', exitHandler.bind(null, {clean: true}))


// boot
init().catch(err => console.error(err))
