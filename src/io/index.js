"use strict"

const req = require('./requests')

class IO {
  constructor(db) {
    if(!db) throw new Error('Without a leveldb instance for IO class.')
    this.db = db
  }

  // need to impelement all io methods for fuse operations
  // read(file_id) {
  //   // retuan a readStream
  //
  // }
}

module.exports = IO
