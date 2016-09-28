"use strict"

const log4js = require('log4js')
const config = require('../config/log.config.json')

log4js.configure(config)

let log = {}

log.handlers = log4js.getLogger('handlers')
log.io = log4js.getLogger('io')
log.cpu = log4js.getLogger('cpu')
log.memory = log4js.getLogger('memory')

module.exports = log
