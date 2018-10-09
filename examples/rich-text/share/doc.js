'use strict'

const agent = require('../agent')
const AgentSocket = require('../agent/socket')

class DocAgent {
	constructor (docId, backend){
		this.roomId = docId
		this.midwayRoomId = docId + ':midway'
		this.cmdStr = `mome/clent/richtext/sync/${docId}`
		
		this.backend = backend	

		this.midwayRoom = agent.getRoom(this.midwayRoomId)
		this.docSocket = this._createDocAgent(this.roomId, backend)
		this._bind()
	}

	agent (clientStream){
		const backend = this.backend
		const cmdStr = this.cmdStr
		const roomId = this.roomId
		const midwayRoom = this.midwayRoom

		const midwayStream = new AgentSocket()
	  midwayStream._open()
	  
	  const midwayAgent = backend.listen(midwayStream.stream)
	  midwayRoom.addAgent(midwayAgent)

	  midwayStream.onmessage = ({ data }) => {
	    try { data = JSON.parse(data) }
	    catch(e){ return }

	    // for test cluster
	    data._ser_pid = process.pid
	    clientStream.write(data)
	  }

	  clientStream.on('data', data => {
      if (data.a == 's' || data.a == 'f') {
        return midwayStream.send(JSON.stringify(data))
      }

      data.from = 'mqtt'
      data.fromClient = midwayAgent.clientId
      agent.message(roomId, cmdStr, data)
    })
	}

	_bind (){
		agent.client.subscribe(this.cmdStr)

		agent.client.on('message', (topic, msg) => {
			if (topic != this.cmdStr) return

			msg = msg.toString()
	    try { msg = JSON.parse(msg) }
	    catch(e) {  }

	    if (!msg.message) return
	    this.docSocket.send(JSON.stringify(msg.message))
		})
	}

	_createDocAgent (roomId, backend){
		const docAgentSocket = new AgentSocket()
		docAgentSocket._open()

		backend.listen(docAgentSocket.stream)

		// sub
		docAgentSocket.onmessage = ({ data }) => {
		  try { data = JSON.parse(data) }
		  catch(e){ return }

		  // reply after send op 
		  this.midwayRoom.wsPool.forEach(agent => {
		    if (agent.clientId == data.fromClient) {
		      data.src = data.fromClient
		      agent.stream.write(data)
		    }
		  })
		}

		return docAgentSocket
	}
}

module.exports = DocAgent

