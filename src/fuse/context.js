"use strict"

const debug = require('debug')('fuse')
const fuse = require('fuse-bindings')

let ENOENT = new Error('ENOENT')
ENOENT.code = 'ENOENT'

exports.getMainContext = function(root, db, io, options) {

  if(!root || !db || !io) return null

  // ops is the context of fuse
  let ops = {}

  // ops.options = ['direct_io', 'dev', 'debug']
  ops.options = options.options || []

  return ops

}
