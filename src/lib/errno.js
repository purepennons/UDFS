/**
 * Reference from [mafintosh/level-filesystem](https://github.com/mafintosh/level-filesystem/blob/master/paths.js)
 */

"use strict"

const errno = require('errno')

Object.keys(errno.code).forEach( code => {
	let e = errno.code[code]

	exports[code] = function(path) {
    let err = new Error(`${code}, ${e.description} ${(path ? ' \'' + path + '\'' : '')}`)
		err.errno = e.errno
		err.code = code
		err.path = path
		return err
	}
})
