"use strict"
const debug = require('debug')('fuse-io')
const Promise = require('bluebird')
const R = require('./requests')
// IO requests must pass to middleware before handling the requests

class IO {
  constructor(db) {
    if(!db) throw new Error('Without a leveldb instance for IO class.')
    this.db = db
  }

  // @param {object} fuse_params - fuse_params are equal to the params of operations of FUSE

  // need to impelement all io methods for fuse operations
  read(fuse_params) {
    // retuan a readStream
    return new Promise((resolve, reject) => {
      R.File.get('http://localhost:3000', '70642310-3134-11e6-9e2f-3ffeaedf456b', 'e60aa7c4-732e-406f-8697-f0311803f237', fuse_params.offset, null)
      .then(rs => {
        // pass middleware here. e.g. resolve(mid2(mid1(rs))) or resolve(rs.pipe(mid1).pipe(mid2))
        return resolve(rs)
      })
      .catch(err => reject(err))
    })
  }

  /*
   * @param {object} source - source is a readable stream from write operation of FUSE
   */
  write(source, fuse_params) {
    // source need to pipe to a writestream
  }
}

module.exports = IO
