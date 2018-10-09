var Duplex = require('stream').Duplex;
var inherits = require('util').inherits;

function AgentSocket() {
  this.readyState = 0;
  this.stream = new AgentStream(this);
}
module.exports = AgentSocket;

AgentSocket.prototype._open = function() {
  if (this.readyState !== 0) return;
  this.readyState = 1;
  this.onopen();
};
AgentSocket.prototype.close = function(reason) {
  if (this.readyState === 3) return;
  this.readyState = 3;
  // Signal data writing is complete. Emits the 'end' event
  this.stream.push(null);
  this.onclose(reason || 'closed');
};
AgentSocket.prototype.send = function(data) {
  // Data is an object
  this.stream.push(JSON.parse(data));
};
AgentSocket.prototype.onmessage = () => {};
AgentSocket.prototype.onclose = () => {};
AgentSocket.prototype.onerror = () => {};
AgentSocket.prototype.onopen = () => {};


function AgentStream(socket) {
  Duplex.call(this, {objectMode: true});

  this.socket = socket;

  this.on('error', function(error) {
    console.warn('ShareDB client message stream error', error);
    socket.close('stopped');
  });

  // The server ended the writable stream. Triggered by calling stream.end()
  // in agent.close()
  this.on('finish', function() {
    socket.close('stopped');
  });
}

inherits(AgentStream, Duplex);

AgentStream.prototype.isServer = true;

AgentStream.prototype._read = () => {};

AgentStream.prototype._write = function(chunk, encoding, callback) {
  var socket = this.socket;
  var data = typeof chunk == 'string' ? chunk : JSON.stringify(chunk)

  process.nextTick(() => {
    if (socket.readyState !== 1) return;
    socket.onmessage({ data });
    // this.emit('message', chunk)
    callback();
  });
};
