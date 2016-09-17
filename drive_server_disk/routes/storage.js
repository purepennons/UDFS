"use strict"

const router = require('express').Router()
const lib = require('../lib/lib')
const headerParser = require('../middlewares/headerParser')

// modules of api routers
const v1_fs = require('../drive/fs/v1/index')
const v1_files_meta = require('../drive/files_meta/v1/index')
const v1_files = require('../drive/files/v1/index')

// version v1
const v1 = lib.versionWrapper('v1')

// file system operations
router.get(v1('/:fs_id'), [], v1_fs.getFS)
router.post(v1('/create'), [], v1_fs.createFS)
router.put(v1('/:fs_id'), [], v1_fs.updateFS)
router.delete(v1('/:fs_id'), [], v1_fs.deleteFS)

// metadata of file
router.get(v1('/:fs_id/meta/:meta_id'), [], v1_files_meta.getMeta)
router.post(v1('/:fs_id/meta/create'), [], v1_files_meta.createMeta)
router.put(v1('/:fs_id/meta/:meta_id'), [], v1_files_meta.updateMeta)
router.delete(v1('/:fs_id/meta/:meta_id'), [], v1_files_meta.deleteMeta)

// file operations
router.get(v1('/:fs_id/files/:object_id'), [headerParser.rangeParse], v1_files.getFile)
router.post(v1('/:fs_id/files/create'), [], v1_files.createFile)  // same as POST -> /meta/:meta_id
router.put(v1('/:fs_id/files/:object_id'), [headerParser.rangeParse], v1_files.updateFile)
router.delete(v1('/:fs_id/files/:object_id'), [], v1_files.deleteFile)


module.exports = router
