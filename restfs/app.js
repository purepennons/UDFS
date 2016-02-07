"use strict"

import fs from 'fs'
import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import file_router from './routes/files'

// routers

let app = express()

// middleware
app.use( bodyParser.json() )
app.use( bodyParser.urlencoded({ extended: true }) )

// routers
app.use( '*', file_router )

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
global.root = process.argv[3] || '/'
global.root = fs.realpathSync(global.root)

app.listen( port, () => {
  console.log('Server is listening at %s port', port)
  console.log('root: ', global.root)
})
