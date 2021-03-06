"use strict"

/**
 * this program is for requiring all modules in the directory.
 */

const fs = require('fs-extra')
const path = require('path')

let lib = {}
let files = fs.readdirSync(__dirname)

const regx = /(.+?)(\.[^.]*$|$)/
files.forEach(file => {
  if(file !== 'index.js' && path.extname(file) === '.js') {
    // regx.exec(file)[1] means that get the filename without extension
    lib[regx.exec(file)[1]] = require(path.join(__dirname, file))
  }
})

// let lib = {
//   createFile: require('./createFile.js'),
//   deleteFile: require('./deleteFile.js'),
//   getFile: require('./getFile.js'),
//   getHead: require('./getHead.js'),
//   updateFile: require('./updateFile.js')
// }

module.exports = lib
