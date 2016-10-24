// Define namespace
var APP = APP || {};

var PingInterval = 5000; // Interval for sending client-ping, in ms
var UpdateInterval = 500; // Interval for sending client-update, in ms

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
    // Check if we can avoid sending an unnecessary state update;
    // this is the case in case the paddle speed was zero last time and
    // the position has not changed.
    if (this.prevPaddlePosition && this.prevPaddleVelocity) {
      if ((this.prevPaddleVelocity.almostZero()) &&
        (this.prevPaddlePosition.almostEquals(position))) {
        // console.log('Skipping update..');
        return;
      }
    }

    this.paddlePosition = position;
    this.paddleVelocity = velocity;
  };

  this.updateBallState = function(position, velocity, angularVelocity) {
    this.ballPosition = position;
    this.ballVelocity = velocity;
    this.ballAngularVelocity = angularVelocity;
  };

  // Sends any updates to the server unless an update request is pending
  this.sendUpdate = function() {
    if (this.updatePending) {
      console.log('Update congested!');
      return;
    }

    var msg = {};

    if (this.paddlePosition && this.paddleVelocity) {
      msg.paddlePosition = this.paddlePosition;
      msg.paddleVelocity = this.paddleVelocity;

      this.prevPaddlePosition = this.paddlePosition;
      this.prevPaddleVelocity = this.paddleVelocity;

      delete this.paddlePosition;
      delete this.paddleVelocity;
    }

    if (this.ballPosition && this.ballVelocity && this.ballAngularVelocity) {
      msg.ballPosition = this.ballPosition;
      msg.ballVelocity = this.ballVelocity;
      msg.ballAngularVelocity = this.ballAngularVelocity;

      delete this.ballPosition;
      delete this.ballVelocity;
      delete this.ballAngularVelocity;
    }

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

  self.reset = function() {
    delete this.paddlePosition;
    delete this.paddleVelocity;
    delete this.prevPaddlePosition;
    delete this.prevPaddleVelocity;
    delete this.ballPosition;
    delete this.ballVelocity;
    delete this.ballAngularVelocity;
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

    self.reset();

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
