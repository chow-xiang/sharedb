
var http = require('http');
var express = require('express');
var ShareDB = require('./sharedb');
const Connection = require('./sharedb/client/connection')
// const StreamSocket = require('./sharedb/stream-socket')

var richText = require('rich-text');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');

ShareDB.types.register(richText.type);
var backend = new ShareDB();

const agent = require('./agent')
const { Duplex, Transform } = require('stream')

var AgentSocket = require('./json-stream')
var util = require('util')

// Create a web server to serve files and listen to WebSocket connections
const app = express()
app.use(express.static('static'))
app.use(express.static('node_modules/quill/dist'))

// Connect any incoming WebSocket connection to ShareDB
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })



/////////////////////////////////////////////////////////////////////////////////
const roomId = 'examples'
const cmdStr = 'mome/clent/richtext/sync'

const agentStream = new AgentSocket()
agentStream._open()

agent.add(roomId, agentStream.stream)

const agentCloseCb = () => {
  const room = agent.getRoom(roomId)
  const index = room.wsPool.indexOf(agentStream.stream)
  room.wsPool.splice(index, 1)
}

agentStream.stream.on('close', agentCloseCb)
agentStream.stream.on('error', agentCloseCb)


agentStream.onmessage = ({ data }) => {
  // 必要的
  try { data = JSON.parse(data) }
  catch(e){ return }

  data.from = 'mqtt'
  const room = agent.getRoom(roomId + ':midway')
  room.message(data)
}

//////////////////////////////////////////////////////////////////////////////////////



wss.on('connection', (ws, ...args) => {  
  const uri = ws.upgradeReq.url
  const pathParams = uri.split('/')
  const userId = pathParams[4]
  const recordId = pathParams[6]
  const clientType = pathParams[2]

  const clientStream = new WebSocketJSONStream(ws)

  // mqtt
  // 因为每次 op 都会被推两次，所以，agentStream 倾向于是个全局的
  // 通过 agentStream 接受并传给 sharedb 计算

  let midwayAgent
  const midwayStream = new AgentSocket()
  midwayStream._open()

  midwayStream.onmessage = ({ data }) => {
    try { data = JSON.parse(data) }
    catch(e){ return }
    clientStream.write(data)
  }

  const room = agent.getRoom(roomId + ':midway')
  room.addStream(midwayStream)

  // client req
  clientStream.on('data', data => {
    // sub order
    if (data.a == 's' || data.a == 'f') {
      return midwayStream.send(JSON.stringify(data))
    }

    data.fromClient = midwayAgent.clientId
    agent.message(roomId, cmdStr, data)
  })

  createDoc(() => {
    midwayAgent = backend.listen(midwayStream.stream)
  })
})

server.listen(50003)
console.log('Listening on http://localhost:50003')




// createDoc(startServer);

// Create initial document then fire callback
function createDoc(callback) {
  var connection = backend.connect()
  var doc = connection.get(roomId, 'richtext')

  doc.fetch(function(err) {
    if (err) throw err
    if (doc.type === null) {
      doc.create([{insert: 'Hi'}], 'rich-text', callback)
      return
    }
    callback()
  });
}


function createDoc2(stream) {
  const connection = backend.connect()
  const doc = connection.get('examples', 'richtext')

  const callback = () => {
    var agent = backend.listen(stream)
  }

  if (doc.type === null) {
    doc.create([{insert: 'Hi'}], 'rich-text', callback)
  }

  doc.fetch()
}






