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

  this.findGame = function() {
    this.socket.emit('find-game', {nickname: APP.Model.myName}, function(data) {
      console.log('find-game response callback: ', data);
    });
  };

  this.quitGame = function() {
    this.socket.emit('quit-game', {}, function(data) {
      console.log('quit-game response callback: ', data);
    });
  };

  this.socket.on('game-starting', function(msg) {
    console.log('Game starting!', msg);
  });

  this.socket.on('player-disconnected', function(msg) {
    console.log('Opponent disconnected', msg);
    callback(self.messages.opponentDisconnected);
  });

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

  // Send initial ping immediately
  this.sendPing();
};

APP.Networking.constructor = APP.Networking;
