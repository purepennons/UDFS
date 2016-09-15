"use strict"

const debug = require('debug')('fuse')
const fuse = require('fuse-bindings')
const IO = require('../io/index')
const getContext = require('./context').getMainContext
const cmd_server = require('../cmd_server/app')
const Bluebird = require('bluebird')

// promisify
fuse.mountAsync = Bluebird.promisify(fuse.mount)
fuse.unmountAsync = Bluebird.promisify(fuse.unmount)

class UserspaceFS {

  constructor(mnt, db, ops={}) {
    if(!mnt || !db) throw new Error('Without a mountpoint or leveldb instance.')
    this.root = mnt
    this.db = db

    this.fuse_ops = ops.fuse_ops || {}
    this.cmd_ops = ops.cmd_ops || {}

    // IO operations must be injected the db instance
    this.io = new IO(this.db)

  }

  // mount fuse
  async mount() {
    try {
      let fuseContext = this.getFuseContext()
      if(!fuseContext) throw new Error('Without the fuse context.')

      // mount
      await fuse.mountAsync(this.root, fuseContext)

      // boot the cmd-server
      let app = await cmd_server(fuseContext, {port: this.cmd_ops.port || 8088})

      return {
        fuseContext: fuseContext,
        root: fuseContext.root,
        db: fuseContext.db,
        io: fuseContext.io
      }

    } catch(err) {
      throw err
    }
  }

  async unmount() {
    try {
      await unmountAsync(this.root)
      return
    } catch(err) {
      throw err
    }
  }

  // must pass the fuse context to the mount method
  getFuseContext() {
    return getContext(this.root, this.db, this.io, this.fuse_ops)
  }
}

module.exports = UserspaceFS
