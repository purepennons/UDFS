"use strict"

const _ = require('lodash')

exports.parseFlag = function(flag) {
  switch(flag) {
    case 0:
      return 'r'
    case 1:
      return 'w'
    case 2:
      return 'r+'
  }
}

function genUniqueKeyFromMap(m, start=0, range=65535) {
  if(!m) throw new Error('Without a map param')
  if(start+1 <= 65536 && !m.has(start+1)) return start + 1

  // need to generate a random number for file descriptor
  start = _.random(1, start-1)

  return genUniqueKeyFromMap(m, start, range)
}
exports.genUniqueKeyFromMap = genUniqueKeyFromMap
