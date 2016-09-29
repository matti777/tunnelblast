// Define namespace
var APP = APP || {};

var PingInterval = 5000;

APP.Networking = function(callback) {
  this.socket = io('http://localhost:3000');
  var self = this;

  this.messages = {
    disconnected: 1,
    connected: 2,
    latency: 3,
    opponentDisconnected: 4
  };

  this.sendPing = function() {
    var then = moment().utc().valueOf();
    this.socket.emit('client-ping', {clientTime: then},
      function (data) {
        console.log('client-ping response data', data);
        var now = moment().utc().valueOf();
        var ping = now - then;
        callback(self.messages.latency, ping);

        setTimeout(self.sendPing.bind(self), PingInterval);
      });
  };

  this.socket.on('connect', function() {
    console.log('Connected to server');
    callback(self.messages.connected);
  });

  this.socket.on('connect_error', function(err) {
    console.log('Connect error', err);
    callback(self.messages.disconnected);
  });

  this.socket.on('reconnect_error', function(err) {
    console.log('Reconnection error', err);
    callback(self.messages.disconnected);
  });

  this.socket.on('user-disconnected', function(msg) {
    console.log('User disconnected', msg);
    callback(self.messages.opponentDisconnected);
  });

  // Send initial ping immediately
  this.sendPing();
};

APP.Networking.constructor = APP.Networking;
