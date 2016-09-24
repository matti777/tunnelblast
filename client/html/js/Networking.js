// Define namespace
var APP = APP || {};

var PingInterval = 2000;

APP.Networking = function() {
  var self = this;

  this.sendPing = function() {
    this.socket.emit('client-ping', {clientTime: moment().utc().valueOf()});
  };

  this.socket = io('http://localhost:3000');

  this.socket.on('connect', function() {
    console.log('Connected to server');
  });

  this.socket.on('connect_error', function(err) {
    console.log('Connect error', err);
  });

  this.socket.on('reconnect_error', function(err) {
    console.log('Reconnection error', err);
  });

  this.socket.on('server-pong', function(msg) {
    console.log('Got server-pong', msg);
    setTimeout(self.sendPing.bind(self), PingInterval);
  });

  this.socket.on('user-disconnected', function(msg) {
    console.log('User disconnected', msg);
  });

  setTimeout(this.sendPing.bind(this), PingInterval);
};

APP.Networking.constructor = APP.Networking;
