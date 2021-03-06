'use strict'

const Room = require('./room')

const { 
	MEMO_SEND_ORDERS,
	MEMO_REFRESH_RECORDINGS,
	MEMO_CLIENT_STOP
} = require('./topics')

// const redisClient = require('../redis')

const mqtt = require('mqtt')
const { mq } = require('../../config')
const { domain, port, username, password } = mq

const mqttUri = `mqtt://${domain}:${port}`
const mqAuth = { username, password }

class MQAgent {
	constructor (){

		this.rooms = {}
		this.afterMsgs = []
		this.client = mqtt.connect(mqttUri, { ...mqAuth })

		// debugger
		this.client.on('connect', () => this._setUpDefaultEvents())
		this.client.on('message', (topic, msg) => this._handleMessageEvent(topic, msg))
	}


	_handleMessageEvent (topic, msg){
		msg = msg.toString()
		try { msg = JSON.parse(msg) }
		catch(e) {  }

		const { roomId, message } = msg
		if (!roomId) return

		const room = this.getRoom(roomId)
		if (topic == MEMO_SEND_ORDERS) this._handleSendOrders(room, topic, message) 
		if (topic == MEMO_CLIENT_STOP) this._handleCLientStop(room, topic, message)
		if (topic == MEMO_REFRESH_RECORDINGS) this._handleRefreshRecordings(room, topic, message)
	}

	// 订阅广播
	_setUpDefaultEvents (){
		// 一个客户端只能监听一次事件
		this.client.subscribe(MEMO_SEND_ORDERS)
		this.client.subscribe(MEMO_CLIENT_STOP)
		this.client.subscribe(MEMO_REFRESH_RECORDINGS)	
	}

	// 客户端传送指令, 同步到各端
	_handleSendOrders (room, topic, message){
		room.message(message.toString())
	}

	// 客户端结束录音指令 
	_handleCLientStop (room, topic, message){
		const { recordId } = message
		const msg = { event: 'record.state.stop', data: { recordId } }
		room.message(msg)
	}

	// 重新拉取 recording 的记录, 同步到各端
	async _handleRefreshRecordings (room, topic, message){
		// const { userId } = message
		// const userStates = await redisClient.getUser(userId)

		// const msg = { event: 'recording.list', data: { ...userStates } }
		// room.message(msg)
	}

	// 将 ws 添加到某一个房间
	add (roomId, ws){
		const room = this.getRoom(roomId)
		room.add(ws)
	}

	// 根据房间 id 查找房间
	getRoom (roomId){
		if (!roomId) return null
		if (this.rooms[roomId]) return this.rooms[roomId]

		const room = new Room(roomId)
	 	this.rooms[roomId] = room
	 	return room
	}

	// 
	message (roomId, cmdStr, message){
		const pushMsg = JSON.stringify({ roomId, message })
		this.client.publish(cmdStr, pushMsg, err => err && console.log(err.message))
	}
}

module.exports = new MQAgent()
