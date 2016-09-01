"use strict"

const fs = require('fs-extra')
const path = require('path')
const debug = require('debug')('app.js')
const express = require('express')
const bodyParser = require('body-parser')

const filiter = require('./middlewares/filiter')
const config = require('./config/config.json')

// routers
let routers = require('./routes/index')

let app = express()

// middleware
app.use( bodyParser.json() )
app.use( bodyParser.urlencoded({ extended: true }) )
app.use ( filiter.ignoreFavicon )

// routers
app.use('/', [], routers)

app.use( (req, res, next) => {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use( (err, req, res, next) => {
  debug(err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message,
    data: (err.data)? [err.data]: []
  })
})

// boot
app.listen( config.port, () => {
  debug('Server is listening at %s port', config.port)
  debug('root: ', config.root)
})

module.exports = app
