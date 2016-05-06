"use strict"

const router = require('express').Router()
const lib = require('../lib/lib')

// modules of api routers
const v1_files = require('../drive/files/v1/index')
const v1_fs = require('../drive/fs/v1/index')

// version v1
const v1 = lib.versionWrapper('v1')

// file operations
router.get(v1('/:fs_id/:object_id'), v1_files.getFile)
router.post(v1('/:fs_id/:object_id'), v1_files.createFile)
router.put(v1('/:fs_id/:object_id'), v1_files.updateFile)
router.delete(v1('/:fs_id/:object_id'), v1_files.deleteFile)
router.head(v1('/:fs_id/:object_id'), v1_files.getHead)

// file system operations
router.get(v1('/:fs_id'), v1_fs.getFS)
router.post(v1('/:fs_id'), v1_fs.createFS)
router.put(v1('/:fs_id'), v1_fs.updateFS)
router.delete(v1('/:fs_id'), v1_fs.deleteFS)

module.exports = router
