"use strict"

import fs from 'fs'
import path from 'path'

function typeValidator(req, res, next) {
  fs.stat(req.file_path, (err, st) => {
    if(err) {
      err.status = 404
      return next(err)
    }

    if(st.isDirectory()) {
      req.type = 'directory'
    } else {
      req.type = 'file'
    }

    req.filename = path.basename(req.file_path)
    req.stat = st

    console.log('filename', req.filename)
    console.log('type: ', req.type)
    console.log('stat', req.stat)

    // set response header
    // in order to check response type, set header: 'X-File-Type'
    res.set('X-File-Type', req.type)

    return next()
  })
}

export { typeValidator }
