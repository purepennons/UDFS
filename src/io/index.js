"use strict"

class IO {
  constructor(db) {
    if(!db) throw new Error('Without a leveldb instance for IO class.')
    this.db = db
  }

  // need to impelement all io methods for fuse operations
}

module.exports = IO
