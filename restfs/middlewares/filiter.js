"use strict"

function ignoreFavicon(req, res, next) {
  if(req.originalUrl === '/favicon.ico') {
    res.set('Content-Type', 'image/x-icon')
    return res.end()
  }
  return next()
}

export { ignoreFavicon }
