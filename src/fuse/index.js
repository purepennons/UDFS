"use strict"

const debug = require('debug')('fuse')
const fuse = require('fuse-bindings')
const IO = require('../io/index')
const getContext = require('./context').getMainContext

class UserspaceFS {

  constructor(mnt, db, ops={}) {
    if(!mnt || !db) throw new Error('Without a mountpoint or leveldb instance.')
    this.root = mnt
    this.db = db

    this.fuse_ops = ops.fuse_ops || {}

    // IO operations must be injected the db instance
    this.io = new IO(this.db)

  }

  // mount fuse
  mount() {
    return new Promise( (resolve, reject) => {
      let fuseContext = this.getFuseContext()
      if(!fuseContext) return reject( new Error('Without the fuse context.') )

      // mount
      fuse.mount(this.root, fuseContext, err => {
        if(err) return reject(err)
        return resolve(fuseContext)
      })

    })
  }

  unmount() {
    return new Promise( (resolve, reject) => {
      fuse.unmount(this.root, err => {
        if(err) return reject(err)
        return resolve()
      })
    })
  }

  // must pass the fuse context to the mount method
  getFuseContext() {
    return getContext(this.root, this.db, this.io, this.fuse_ops)
  }
}

module.exports = UserspaceFS
