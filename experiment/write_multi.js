const shell = require('shelljs')
const fs = require('fs-extra')
const path = require('path')

const clear_cache = 'echo 3 | tee /proc/sys/vm/drop_caches'

// args: bs, count, time, filename, path, rate
// shjs seq_rw.js 64k 1600 10 10mb ./exp-1 10
let args = process.argv
let bs = args[3]
let count = args[4]
let time = args[5]
let filename = args[6]
let p = args[7]
let rate = args[8]

console.log(args)

// setup
const base_path = path.resolve(p)
shell.rm('-rf', base_path)
shell.mkdir(base_path)

// write
for(let i=0; i<time; i++) {
  let folder = path.join(base_path, `/${i}`)
  shell.mkdir(folder)

  for(let j=0;j <rate;j++) {
    let file = path.join(folder, `/${filename}-${j}`)
    console.log(file)
    shell.exec(clear_cache).stdout
    shell.exec(`dd if=/dev/zero of=${file} bs=${bs} count=${count} conv=fdatasync`)
  }
}

// read
/*for(let i=0; i<time; i++) {
  let file = path.join(base_path, `/${filename}-${i}`)
  console.log(file)
  shell.exec(clear_cache).stdout
  shell.exec(`dd if=${file} of=/dev/null bs=${bs}`)
}*/
