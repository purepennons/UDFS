const shell = require('shelljs')
const fs = require('fs-extra')
const path = require('path')

// args: bs, count, time, filename, path
// shjs seq_rw.js 64k 1600 10 10mb ./exp-1

let args = process.argv
let bs = args[3]
let count = args[4]
let time = args[5]
let filename = args[6]
let p = args[7]

console.log(args)

// setup
const base_path = path.resolve(p)

for(let i=0; i<time; i++) {
  let file = path.join(base_path, `/${filename}-${i}`)
  console.log(file)
  shell.exec(`truncate ${file} --size 0`)
}
