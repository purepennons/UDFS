"use strict"

const shell = require('shelljs')
const fs = require('fs-extra')
const path = require('path')

// args: base_path, assign_path
// shjs generate_dummy_files.js  ./exp3 /storage_ssd_e2
let args = process.argv
let p = args[3]
let assign = args[4]

console.log(args)

// setup
const base_path = path.resolve(p)
const outer_path = path.resolve( path.join(base_path, "/outer") )
const assign_path = path.resolve( path.join(base_path, assign) )
const filename = "file"

shell.rm('-rf', base_path)
shell.rm('-rf', outer_path)
shell.rm('-rf', assign_path)
shell.mkdir(base_path)
shell.mkdir(outer_path)
shell.mkdir(assign_path)

for(let i=0;i< 1000;i++) {
  if(i < 250) {
    // not a image & outer
    let file1 = path.join(outer_path, `/${filename}-${i}.dat`)
    console.log(file1)
    shell.exec(`dd if=/dev/urandom of=${file1} bs=1M count=1`)
  } else if(i < 500) {
    // a image & outer
    let file2 = path.join(outer_path, `/${filename}-${i}.jpg`)
    console.log(file2)
    shell.exec(`dd if=/dev/urandom of=${file2} bs=1M count=1`)
  } else if(i < 750) {
    // not a image & assign
    let file3 = path.join(assign_path, `/${filename}-${i}.dat`)
    console.log(file3)
    shell.exec(`dd if=/dev/urandom of=${file3} bs=1M count=1`)
  } else {
    // a image & assign
    let file4 = path.join(assign_path, `/${filename}-${i}.jpg`)
    console.log(file4)
    shell.exec(`dd if=/dev/urandom of=${file4} bs=1M count=1`)
  }
}
