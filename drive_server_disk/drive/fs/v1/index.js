"use strict"

const fs = require('fs-extra')
const path = require('path')

let lib = {}
let files = fs.readdirSync('.')

files.forEach(file => {
  if(file !== 'index.js') {
    lib[file] = require('./' + file)
  }
})

module.exports = lib
