"use strict"

const debug = require('debug')('fuse')
const fuse = require('fuse-bindings')
const file_metadata_ops = require('../secure_db/operations/file_metadata_ops')
const files_ops = require('../secure_db/operations/files_ops')


let ENOENT = new Error('ENOENT')
ENOENT.code = 'ENOENT'

exports.getMainContext = function(root, db, io, options) {

  if(!root || !db || !io) return null

  let fm_ops = file_metadata_ops(db.fileMetadata) // file metadata operations
  let f_ops = files_ops(db.files) // files operation

  // ops is the context of fuse
  let ops = {}

  // ops.options = ['direct_io', 'dev', 'debug']
  ops.options = options.options || []

  ops.readdir = function(path, cb) {

  }

  return ops

}
