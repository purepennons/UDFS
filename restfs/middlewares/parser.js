"use strict"

import path from 'path'

function pathParser(req, res, next) {
  let url = decodeURI( (req.originalUrl.split('?')[0]).replace(/%20/g, '\ ') ) 
  if(url[url.length-1] === '/') url = url.slice(0, url.length-1)
  req.file_path = path.join(global.root, url)
  console.log('req path: ', req.file_path)
  return next()
}

export { pathParser }
