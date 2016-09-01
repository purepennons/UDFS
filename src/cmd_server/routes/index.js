"use strict"

const router = require('express').Router()
const lib = require('../lib/lib')

// modules of api routers
const v1_fs = require('./fs/v1/index')

// version v1router.get(v1('/:fs_id'), [], v1_fs.getFS)
const v1 = lib.versionWrapper('v1')

// file system operations
router.get(v1('/:fs_id'), [], v1_fs.getFS)

module.exports = router
