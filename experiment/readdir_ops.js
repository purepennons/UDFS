"use strict"

const shell = require('shelljs')
const fs = require('fs-extra')
const path = require('path')

// args: bs, count, time, filename, path
// shjs seq_rw.js 10 ./exp-1

let args = process.argv
let time = args[3]
let p = args[4]

console.log(args)

// setup
const base_path = path.resolve(p)

for(let i=0; i<time; i++) {
  shell.exec(`ls ${base_path}`)
}
