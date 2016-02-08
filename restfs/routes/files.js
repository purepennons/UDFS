"use strict"

import express from 'express'

const router = express.Router()

router.get('/', (req, res, next) => {
  console.log(req.originalUrl)
  res.send('hello world')
  return res.end
})

export default router
