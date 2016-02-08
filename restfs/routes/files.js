"use strict"

import express from 'express'
import bluebird from 'bluebird'

const router = express.Router()
const fs = bluebird.promisifyAll(require('fs'))

router.get('/', (req, res, next) => {
  // field: ['metadata', 'stat', 'type', 'path', 'mount_path', 'content', 'list']
  let field = req.query.field

  // no field => always return stat, path, mount_path and type
  if(!field) {
    return res.status(200).json({
      name: req.filename,
      path: req.file_path,
      mount_path: req.file_path,
      type: req.type,
      stat: req.stat
    })
  }

  if(req.type === 'file') {
    // return the file
  } else {
    // return the list of the directory
    async function readdir() {
      let files = await fs.readdirAsync(req.file_path)
      console.log(files)
    }

    readdir().then().catch( catchError => {
      catchError.status = 500
      return next(catchError)
    })
  }


  res.send('hello world')
  return res.end
})

export default router
