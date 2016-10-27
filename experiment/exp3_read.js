"use strict"

const shell = require('shelljs')
const fs = require('fs-extra')
const path = require('path')

const clear_cache = 'echo 3 | tee /proc/sys/vm/drop_caches'

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

let outer_list = fs.readdirSync(outer_path)
                 .map(file => path.join(outer_path, file))
let assign_list = fs.readdirSync(assign_path)
                 .map(file => path.join(assign_path, file))

let file_list = outer_list.concat(assign_list)

for(let i=0;i<file_list.length;i++) {
  console.log(file_list[i])
  shell.exec(clear_cache).stdout
  shell.exec(`dd if=${file_list[i]} of=/dev/null bs=64k`)
}
