"use strict"

const fs = require('fs-extra')
const path = require('path')
const debug = require('debug')('app.js')
const express = require('express')
const bodyParser = require('body-parser')

const filiter = require('./middlewares/filiter')

const config = require('./config/config.json')

// routers
let storage_router = require('./routes/storage')

let app = express()

// middleware
app.use( bodyParser.json() )
app.use( bodyParser.urlencoded({ extended: true }) )
app.use ( filiter.ignoreFavicon )

// routers
app.use('/storage', [], storage_router)

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

// init
async function init() {
  app.listen( config.port, () => {
    debug('Server is listening at %s port', config.port)
    debug('root: ', config.root)
  })
}

// exit handler
function cleanup() {
  return
}

function exitHandler(options={}, err) {

  async function exitGen() {
    if(err) console.error('uncaughtException', err.stack)
    if(options.clean) await cleanup()
    if(options.exit) process.exit()
    return
  }

  exitGen().catch(err => console.error(err))
}

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {clean: true, exit: true}))

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {clean: true, exit: true}))

// process close
process.on('exit', exitHandler.bind(null, {clean: true}))

// boot
init().catch(err => console.error(err))

// module.exports = app
