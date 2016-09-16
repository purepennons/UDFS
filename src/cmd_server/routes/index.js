"use strict"

const router = require('express').Router()
const lib = require('../lib/lib')

// modules of api routers
const v1_fs = require('./fs/v1/index')
const v1_storage = require('./storage/v1/index')

// version v1 router.get(v1('/:fs_id'), [], v1_fs.getFS)
const v1 = lib.versionWrapper('v1')

// file system operations
router.get(v1('/fs/:fs_id'), [], v1_fs.getFS)

// storage
router.get(v1('/storages'), [], v1_storage.getStorageList)
router.get(v1('/storages/:storage_id'), [], v1_storage.getStorage)

module.exports = router
