"use strict"

module.exports = function deleteFS(req, res, next) {
  return res.end('delete a file system and all of the files')
}
