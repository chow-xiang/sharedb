'use strict'

const Events = require('events')

class Room extends Events {
	constructor (name){
		super ()
		this.name = name
		this.wsPool = []
	}

	add (ws){
		const closeCb = () => {
			const index = this.wsPool.indexOf(ws)
			this.wsPool.splice(index, 1)
		}

		ws.on('close', closeCb)
		ws.on('error', closeCb)
		this.wsPool.push(ws)
	}

	addAgent (agent){
		const closeCb = () => {
			const index = this.wsPool.indexOf(stream)
			this.wsPool.splice(index, 1)
		}

		const stream = agent.stream
		stream.on('close', closeCb)
		stream.on('error', closeCb)

		this.wsPool.push(agent)
	}

	// 向房间内所有的 ws 发送信息
	message (msg){
		msg = typeof msg != 'string' ? 
					JSON.stringify(msg) : 
					msg
					
		this.wsPool.forEach(ws => ws.send(msg))
	}
}

module.exports = Room
