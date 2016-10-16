// Define namespace
var APP = APP || {};

var PingInterval = 5000; // Interval for sending client-ping, in ms
var UpdateInterval = 200; // Interval for sending client-update, in ms

APP.Networking = function(callback) {
  this.socket = io('http://localhost:3000');
  var self = this;

  this.messages = {
    disconnected: 1,
    connected: 2,
    latency: 3,
    opponentDisconnected: 4,
    gameStarting: 5,
    quitGame: 6,
    serverUpdate: 7
  };

  this.sendPing = function() {
    var then = moment().utc().valueOf();
    this.socket.emit('client-ping', {clientTime: then},
      function (data) {
       // console.log('client-ping response data', data);
        var now = moment().utc().valueOf();
        var ping = now - then;
        callback(self.messages.latency, ping);

        setTimeout(self.sendPing.bind(self), PingInterval);
      });
  };

  this.updatePaddleState = function(position, velocity) {
    this.paddlePosition = position;
    this.paddleVelocity = velocity;
  };

  // Sends any updates to the server unless an update request is pending
  this.sendUpdate = function() {
    // console.log('sendUpdate()');

    if (this.updatePending) {
      console.log('Update congested!');
      return;
    }

    var msg = {};

    if (this.paddlePosition && (this.paddlePosition !== null)) {
      msg.paddlePosition = this.paddlePosition;
      delete this.paddlePosition;
    }

    if (this.paddleVelocity && (this.paddleVelocity !== null)) {
      msg.paddleVelocity = this.paddleVelocity;
      delete this.paddleVelocity;
    }

    //TODO ball position

    //TODO scoring

    //TODO game winning

    if (Object.keys(msg).length > 0) {
      self.updatePending = true;
      console.log('sending msg: ', msg);

      this.socket.emit('client-update', msg, function() {
        self.updatePending = false;
        console.log('client-update ACKed by server');
      });
    }
  };

  this.findGame = function() {
    console.log('Finding a game..');
    this.socket.emit('find-game', {nickname: APP.Model.myName}, function(data) {
      console.log('find-game response callback: ', data);
    });
  };

  this.quitGame = function() {
    this.socket.emit('quit-game', {}, function(msg) {
      console.log('quit-game response callback: ', msg);
      callback(self.message.quitGame);

      // Stop sending updates to server
      if (this.sendUpdateTimer) {
        clearInterval(this.sendUpdateTimer);
        delete this.sendUpdateTimer;
      }
    });
  };

  this.socket.on('game-starting', function(msg) {
    console.log('Game starting!', msg);
    callback(self.messages.gameStarting, msg);

    // Start sending updates to server
    this.sendUpdateTimer =
      setInterval(self.sendUpdate.bind(self), UpdateInterval);
  });

  this.socket.on('server-update', function(msg, serverCallback) {
    // ACK the message asap
    serverCallback();

    // console.log('Got server-update', msg);
    callback(self.messages.serverUpdate,  msg);
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
