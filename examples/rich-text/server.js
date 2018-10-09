
var http = require('http');
var express = require('express');
var ShareDB = require('./sharedb');

var richText = require('rich-text');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');

ShareDB.types.register(richText.type);
var backend = new ShareDB();

// Create a web server to serve files and listen to WebSocket connections
const app = express()
app.use(express.static('static'))
app.use(express.static('node_modules/quill/dist'))

// Connect any incoming WebSocket connection to ShareDB
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })


////////////////////////////////////////////////////////////////////////////////////////////////////////

const agent = require('./agent')
const AgentSocket = require('./agent/socket')

const roomId = 'examples'
const docId = 'richtext'
const cmdStr = `memo/sharedb/op/${roomId}`

const SharedbAgent = require('./share')
const sharedbAgent = new SharedbAgent(backend)



// const globalAgentStream = new AgentSocket()
// globalAgentStream._open()

// const midwayRoom = agent.getRoom(roomId + ':midway')
// const globalAgent = backend.listen(globalAgentStream.stream)

// agent.client.subscribe(cmdStr)

// agent.client.on('message', (topic, msg) => {
//   if (topic == cmdStr) {
//     msg = msg.toString()
//     try { msg = JSON.parse(msg) }
//     catch(e) {  }

//     globalAgentStream.send(JSON.stringify(msg.message))
//   }
// })


// globalAgentStream.onmessage = ({ data }) => {
//   try { data = JSON.parse(data) }
//   catch(e){ return }

//   // op res
//   midwayRoom.wsPool.forEach(stream => {
//     if (stream.clientId == data.fromClient) {
//       data.src = data.fromClient
//       stream.stream.write(data)
//     }
//   })
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////

wss.on('connection', (ws, ...args) => {  
  const uri = ws.upgradeReq.url
  const pathParams = uri.split('/')
  const userId = pathParams[4]
  const recordId = pathParams[6]
  const clientType = pathParams[2]

  
  ////////////////////////////////////////////////////////////////////////////////////////////////////////
  const clientStream = new WebSocketJSONStream(ws)
  const docAgent = sharedbAgent.get(roomId)

  createDoc(roomId, docId, () => {
    docAgent.agent(clientStream)
  })

  // const midwayStream = new AgentSocket()
  // midwayStream._open()
  

  // let midwayAgent
  // midwayRoom.addStream(midwayStream)

  // midwayStream.onmessage = ({ data }) => {
  //   try { data = JSON.parse(data) }
  //   catch(e){ return }

  //   // for test cluster
  //   data._ser_pid = process.pid
  //   clientStream.write(data)
  // }

  // createDoc(roomId, docId, () => {

  //   midwayAgent = backend.listen(midwayStream.stream)
  //   midwayStream.clientId = midwayAgent.clientId

  //   clientStream.on('data', data => {
  //     if (data.a == 's' || data.a == 'f') {
  //       return midwayStream.send(JSON.stringify(data))
  //     }

  //     data.from = 'mqtt'
  //     data.fromClient = midwayAgent.clientId
  //     agent.message(roomId, cmdStr, data)
  //   })
  // })
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

})

server.listen(50003)
console.log('Listening on http://localhost:50003')


// Create initial document then fire callback
function createDoc(roomId, docId, callback) {
  var connection = backend.connect()
  var doc = connection.get(roomId, docId)

  doc.fetch(function(err) {
    if (err) throw err
    if (doc.type === null) {
      doc.create([{insert: 'Hi'}], 'rich-text', callback)
      return
    }
    callback()
  });
}

