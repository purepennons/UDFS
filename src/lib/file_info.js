"use strict"

class FileInfo {

  // define the metadata of basic file
  constructor(fileInfo) {
    if(!fileInfo) throw new Error('Without a file information.')

    /**
    * chunk_list is an array, each element is a json object
    * properties:
    * 	- object_id: the id to get the chunk file from object storage
    * 	- host: object storage host
    * 	- chunk_id: auto increment, it means the chunk order
    * 	- chunk_size: size of chunk
    * 	- position: the start position of the all file
    */
    this.chunk_list = fileInfo.chunk_list
    this.num_of_chunk = fileInfo.num_of_chunk // = length of chunk list
    this.total_size = fileInfo.total_size // Sum of chunks size = stat.size of file metadata

  }

}

module.exports = function(fileInfo) {
  return new FileInfo(fileInfo)
}
