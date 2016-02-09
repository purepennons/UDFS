"use strict"

import path from 'path'
import express from 'express'
import Promise from 'bluebird'

const router = express.Router()
const fs = Promise.promisifyAll(require('fs'))

router.get('/', (req, res, next) => {
  // field: ['metadata', 'stat', 'type', 'path', 'mount_path', 'content', 'filename', 'size', 'list_only']
  let field = req.query.field
  // no field => always return stat, path, mount_path and type
  if(!field) {
    return res.status(200).json({
      status: 'success',
      message: '',
      data: [
        {
          name: req.filename,
          path: req.file_path,
          mount_path: req.file_path,
          type: req.type,
          stat: req.stat
        }
      ]
    })
  }

  if(req.type === 'file') {
    // return the file
  } else {
    // return the list of the directory
    async function readdir() {
      try {
        let files = await fs.readdirAsync(req.file_path)

        // field with 'list_only' will only return the array of filenames
        if(field.indexOf('list_only') > -1) {
          console.log(field.indexOf('list_only') );
          return res.status(200).json({
            status: 'success',
            message: '',
            data: files
          })
        }

        // return metadata for each file
        let results = await Promise.map(files, (file, index, length) => {
          return new Promise( (resolve, reject) => {
            fs.statAsync( path.join(req.file_path, file) )
            .then( st => {
              return resolve({
                filename: file,
                type: (st.isDirectory())? 'directory': 'file',
                path: req.file_path,
                mount_path: req.file_path,
                size: st.size,
                stat: st
              })
            })
            .catch( err => {
              return reject(err)
            })
          })
        })

        return res.status(200).json({
          status: 'success',
          message: '',
          data: results
        })

      } catch( catchError ) {
        throw catchError
      }
    }

    readdir().then().catch( catchError => {
      catchError.status = 500
      return next(catchError)
    })
  }

})

export default router
