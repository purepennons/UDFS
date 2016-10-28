"use strict"

const fs = require('fs-extra')
const path = require('path')
const Buffer = require('buffer').Buffer
// args: buf_size,
// shjs buffer_concat_testing.js buf_size num_of_buffer
let args = process.argv
let buf_size = args[2]
let num_of_buffer = args[3]

console.log(args)

const dummy_buf = Buffer.alloc( parseInt(buf_size), 'A' )

let buf_arr = []
for(let i=0;i<num_of_buffer;i++) {
  let copy = new Buffer(buf_size)
  dummy_buf.copy(copy)
  buf_arr.push(copy)
}

Buffer.concat(buf_arr, buf_size*num_of_buffer)
