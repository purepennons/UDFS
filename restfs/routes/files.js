"use strict"

import path from 'path'
import pump from 'pump'
import mkdirp from 'mkdirp'
import express from 'express'
import Promise from 'bluebird'

const router = express.Router()
const fs = Promise.promisifyAll(require('fs'))

router.get('/', (req, res, next) => {
  // field: ['metadata', 'stat', 'type', 'path', 'mount_path', 'content', 'filename', 'size', 'list_only']
  let field = req.query.field
  // no field => always return stat, path, mount_path and type

  let result = {
    name: req.filename,
    path: req.file_path,
    mount_path: req.file_path,
    type: req.type,
    stat: req.stat
  }

  if(!field) {
    return res.status(200).json({
      status: 'success',
      message: '',
      data: [result]
    })
  }

  if(req.type === 'file') {
    async function getContent() {
      try {
        // return the file
        // only return the content when 'content' field is in the field prop.
        if(field.indexOf('content') > -1) {
          res.set('Content-Length', req.stat.size)
          // if assign the range, it will only return the part of the content of the file.
          /**
           * TODO: partial return
           */
          pump(fs.createReadStream(req.file_path), res)
        } else {
          // filter fields
          return res.status(200).json({
            status: 'success',
            message: '',
            data: [result]
          })
        }
      } catch(err) {
        throw err
      }
    }

    getContent().catch( catchError => {
      catchError.status = 500
      return next(catchError)
    })

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

    readdir().catch( catchError => {
      catchError.status = 500
      return next(catchError)
    })
  }

})

router.post('/', (req, res, next) => {

})

export default router
