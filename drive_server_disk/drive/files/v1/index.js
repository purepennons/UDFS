"use strict"

const fs = require('fs-extra')
const path = require('path')

let lib = {}
let files = fs.readdirSync('.')

const regx = /(.+?)(\.[^.]*$|$)/
files.forEach(file => {
  if(file !== 'index.js' && path.extname(file) === '.js') {
    // regx.exec(file)[1] means that get the filename without extension
    lib[regx.exec(file)[1]] = require('./' + file)
  }
})

module.exports = lib
