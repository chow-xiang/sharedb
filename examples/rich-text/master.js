'use strict'

// 控制主流程 cluster 模式下 mq 有问题，需要进程通信

const cluster = require('cluster')
const fs = require('fs')

cluster.setupMaster({exec: './server.js'})
cluster.on('fork', onFork)
cluster.on('exit', onExit)

cluster.fork({ IN_CLUSTER: true })
cluster.fork({ IN_CLUSTER: true })


// fork回调事件
function onFork (worker) {
	
}
function onExit(worker){
	// console.log(worker.exitedAfterDisconnect)
	// 判断是不是disconnect调用退出的
}

