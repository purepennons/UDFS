"use strict"

const lib = require('../lib/lib')

class Chunk {

  // define the metadata of basic file
  constructor(chunk) {
    if(!chunk) throw new Error('Without a file information.')

    this.chunk_order = this.chunk_order || -1
    this.read = this.read || []
    this.write = this.write || []
    this.chunk_size = this.chunk_size || 0
    this.current_size = this.current_size || 0
  }

  r_push(obj) {
    if(obj) {
      obj = lib.objectWrapper(obj, {})  // format the object of input
      this.read.push(obj)
    }
  }

  w_push(obj) {
    if(obj) {
      obj = lib.objectWrapper(obj, {})  // format the object of input
      this.write.push(obj)
    }
  }

}

module.exports = function(chunk) {
  return new Chunk(chunk)
}
