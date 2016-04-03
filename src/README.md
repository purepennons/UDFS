# SDFS
## Development
* Start a Docker container with fuse and node.js environment
```
docker run -itd --name sdfs  -v "$PWD:/src" -w "/src" -p 8888:8888 --privileged chiahao/fuse-node-centos:4.4.2
```
