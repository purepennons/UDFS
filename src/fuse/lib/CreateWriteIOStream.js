"use strict"

const Readable = require('stream').Readable
const util = require('util')
util.inherits(CreateWriteIOStream, Readable)

function CreateWriteIOStream(fd, options) {
  Readable.call(this, options)

  this.fd = fd
  this.writable = true

  this.on('sourceData', chunk_buf => {
    // console.log('chunk_buf', chunk_buf)
    this.writable = this.push(chunk_buf)
    if(!this.writable) {
      this.emit('stop', null)
    }
  })

  this.once('sourceEnd', chunk_buf => {
    this.push(null)
  })
}

CreateWriteIOStream.prototype._read = function() {
  this.writable = true
  this.push('') // 確保即使 start event 沒送達，仍會觸發下次 `_read()`
  this.emit('start', null)
}

module.exports = CreateWriteIOStream
