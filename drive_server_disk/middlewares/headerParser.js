"use strict"

const debug = require('debug')('headerParser')
const rangeParser = require('range-parser')
const config = require('../config/config.json')

// set max size of the file to 1 TB
const MAX_FILE_SIZE = config.MAX_FILE_SIZE

exports.rangeParse = function(req, res, next) {
  // range parsing
  let range = req.headers['range']

  try {
    range = rangeParser(MAX_FILE_SIZE, range)
    debug('range', range)
  } catch(err) {
    range = null
  }

  if(!range) {
    let err = new Error('Range header must be assigned')
    err.status = 400
    return next(err)
  }

  // 單位錯誤或格式錯誤
  if(range === -1 || range.type !== 'bytes') {
    let err = new Error('Bad unit or format of range')
    err.status = 416
    return next(err)
  }

  // range 範圍錯誤
  if(range === -2) {
    let err = new Error('unsatisfiable range')
    err.status = 416
    return next(err)
  }

  req.range = range
  return next()
}
