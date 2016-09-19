"use strict"

const debug = require('debug')('fuse-io#middleware#index')
const pipeP = require('pipep')

const m_policy = require('./policy/index')

const enable_list = require('../../config/enable_middlewares.json')

let middlewares = {}

// will return a promise function which params are db, key, io_params, fuse_params and storage_list
middlewares.policy = pipeP.apply(null, enable_list.policy.map(mid => m_policy[mid]))

// exports all middlewares
module.exports = middlewares
