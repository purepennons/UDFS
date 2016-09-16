"use strict"

const fs = require('fs-extra')
const path = require('path')
const debug = require('debug')('app.js')
const express = require('express')
const bodyParser = require('body-parser')

const filiter = require('./middlewares/filiter')

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

module.exports = function(fuseContext, options) {
  return new Promise((resolve, reject) => {
    fuseContext = fuseContext || undefined
    options = options || {}
    let port = options.port || 8088

    // set fuseContext as a global value for routes
    app.set('fuseContext', fuseContext)

    // boot the cmd server
    app.listen( port, err => {
      if(err) return reject(err)
      debug('Server is listening at %s port', port)
      
      fuseContext.events.emit('onCMDBoot', 'Chiahao Lin')

      return resolve(this)
    })

  })
}
