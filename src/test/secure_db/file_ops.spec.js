"use strict"

const test = require('tape')
const util = require('util')
const fs = require('fs-extra')
const octal = require('octal')
const Promise = require('bluebird')

const levelup = require('levelup')

const file_ops = require('../../secure_db/operations/files_ops')

const db_path = '/tmp/leveldb/testing/file_ops'
