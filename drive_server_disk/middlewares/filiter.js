"use strict"

const debug = require('debug')('middlewares')

exports.ignoreFavicon = function(req, res, next) {
  if(req.originalUrl === '/favicon.ico') {
    res.set('Content-Type', 'image/x-icon')
    return res.end()
  }
  return next()
}
