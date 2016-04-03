FROM centos:7
MAINTAINER Chiahao Lin <chiahao.node@gmail.com>

RUN yum update -y

RUN yum groupinstall -y 'Development Tools'

RUN yum install -y git gcc curl wget tar vim make libstdc++-devel gcc-c++ fuse fuse-devel curl-devel libxml2-devel mailcap

RUN curl --silent --location https://rpm.nodesource.com/setup_4.x | bash -
RUN yum -y install nodejs

RUN npm install -g npm@latest
