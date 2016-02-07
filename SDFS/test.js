"use strict"
let fs = require('fs')
let str = fs.readFileSync('./mnt/test')
console.log(str);

// let fd = fs.openSync('./mnt/test', 'r')
// console.log('fd', fd)
// let stats = fs.fstatSync(fd)
// console.log(stats)


let w = fs.writeFileSync('./mnt/test', 'abc')
