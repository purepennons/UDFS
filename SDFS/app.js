"use strict"

import fs from 'fs'
import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import fuse from 'fuse-bindings'

import SDFS from './fuse/index.js'
import { ignoreFavicon } from './middlewares/filiter'

const config = require('./config/config.json')

// routers
import sdfs from './routes/sdfs'

let app = express()

// middleware
app.use( bodyParser.json() )
app.use( bodyParser.urlencoded({ extended: true }) )
app.use ( ignoreFavicon )

// routers
app.use('/sdfs', sdfs)

app.use( (req, res, next) => {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use( (err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message,
    data: (err.data)? [err.data]: []
  })
})

// boot
let port = process.argv[2] || 3000
const root = './mnt'

global.sdfs = new SDFS({
  root: root,
  read_dest: 'http://localhost:3333/',
  write_dest: 'http://localhost:3333/',
  fuse_ops: {
    options: ['direct_io']
  }
})

// app.listen( port, (err) => {
//   console.log('Server is listening at %s port', port)
// })

global.sdfs.mount()
.then( () => {
  console.log('SDFS is mounted at %s', root)
  app.listen( port, (err) => {
    if(err) {
      global.sdfs.unmount().then().catch()
    }
    console.log('Server is listening at %s port', port)
  })
})
.catch( err => {
  console.error('FUSE mounts failed.')
  process.exit()
})

process.on('SIGINT', function () {
  global.sdfs.unmount()
  .then( () => {
    process.exit()
  })
  .catch( err => {
    console.error('unmount fuse error', err)
    process.exit()
  })
})
