"use strict"

const lib = require('../lib/lib')

/*
 * TODO: need to implement _computeSize
 */

class Files {

  // define the metadata of basic file
  constructor(files) {
    if(!files) throw new Error('Without a file information.')

    this.chunk_arr = files.chunk_arr || []
    this.num_of_chunk = files.num_of_chunk || 0 // = length of chunk list
    this.total_size = files.total_size || 0// Sum of chunks size = stat.size of file metadata

  }

  push(chunk, size) {
    if(chunk) {
      chunk = lib.chunkWrapper(chunk, {}) // format the chunk of input
      this.chunk_arr.push(chunk)
      this.num_of_chunk = this.chunk_arr.length
      if(size) {
        this.total_size = size
      } else {
        this.total_size = this._computeSize()
      }
    }
  }

  _computeSize() {
    return this.total_size
  }

}

module.exports = function(files) {
  return new Files(files)
}
