"use strict"

module.exports = function getFS(req, res, next) {
  return res.end('get file system status')
}
