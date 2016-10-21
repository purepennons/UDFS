"use strict"

const debug = require('debug')('fuse-io#middleware#policy#passthrough')

// do nothing, just return all storages
module.exports = async (ops) => {
  return ops
}
