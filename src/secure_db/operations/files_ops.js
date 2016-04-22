"use strict"

const debug = require('debug')('files_ops')
const once = require('once')
const octal = require('octal')
const path = require('path')
const concat = require('concat-stream')

const errno = require('../../lib/errno')

module.exports = function(db) {
  let ops = {}

  ops.get = function(key, cb) {
  }

  /**
   * cb(err, key)
   */
  ops.writable = function(key, cb) {
  }

  /**
   * cb(err, key)
   */
  ops.put = function(key, data, cb) {
  }

  ops.del = function(key, cb) {

  }

  return ops
}
