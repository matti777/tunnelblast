// Define namespace
var APP = APP || {};

var PingInterval = 5000; // Interval for sending client-ping, in ms
var UpdateInterval = 500; // Interval for sending client-update, in ms

// Server address
var GameServerAddress = 'http://localhost:3000';

// Game's networking version; integer, always update when breaking compatibility.
var GameNetworkingVersion = 1;

APP.Networking = function(callback) {
  this.socket = io(GameServerAddress);
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
        callback(self.messages.latency, (now - then));

        setTimeout(self.sendPing.bind(self), PingInterval);
      });
  };

  self.reset = function() {
    delete self.paddleUpdate;
    delete self.prevPaddleUpdate;
    delete self.ballUpdate;
    delete self.score;
  };

  this.updateScoreState = function(hostScored, newHostScore, newOtherPlayerScore) {
    assert(APP.Model.multiplayer.youAreHost);

    var scoreUpdate = self.scoreUpdate || {};

    if (hostScored) {
      scoreUpdate.hostScored = true;
    } else {
      scoreUpdate.otherPlayerScored = true;
    }
    scoreUpdate.newHostScore = APP.Model.score.me;
    scoreUpdate.newOtherPlayerScore = APP.Model.score.opponent;

    self.scoreUpdate = scoreUpdate;
  };

  this.updateWinState = function(hostWon) {
    assert(APP.Model.multiplayer.youAreHost);

    var winUpdate = self.winUpdate || {};

    if (hostWon) {
      winUpdate.hostWon = true;
    } else {
      winUpdate.otherPlayerWon = true;
    }

    self.winUpdate = winUpdate;
  };

  this.updatePaddleState = function(position, velocity) {
    assert(position && velocity);

    // Check if we can avoid sending an unnecessary state update;
    // this is the case in case the paddle speed was zero last time and
    // the position has not changed.
    if (self.prevPaddleUpdate) {
      if ((self.prevPaddleUpdate.velocity.almostZero()) &&
        (self.prevPaddleUpdate.position.almostEquals(position))) {
        // console.log('Skipping update..');
        return;
      }
    }

    self.paddleUpdate = {position, velocity};
  };

  this.updateBallState = function(position, velocity, speedMultiplier,
                                  angularVelocity) {
    assert(position && velocity && angularVelocity);

    self.ballUpdate = {position, velocity, speedMultiplier, angularVelocity};

    // Send ball updates immediately to minimize twitching
    self.sendUpdate();
  };

  // Sends any updates to the server unless an update request is pending
  this.sendUpdate = function() {
    if (self.updatePending) {
      console.log('Update congested!');
      return;
    }

    var msg = {};

    if (self.paddleUpdate) {
      msg.paddle = self.paddleUpdate;
      self.prevPaddleUpdate = self.paddleUpdate;
      delete self.paddleUpdate;
    }

    if (self.ballUpdate) {
      // console.log('Sending ball update: ', self.ballUpdate);
      msg.ball = self.ballUpdate;
      delete self.ballUpdate;
    }

    if (self.scoreUpdate) {
      msg.score = self.scoreUpdate;
      delete self.scoreUpdate;
    }

    if (self.winUpdate) {
      msg.win = self.winUpdate;
      delete self.winUpdate;
    }

    if (Object.keys(msg).length > 0) {
      self.updatePending = true;

      var then = moment().utc().valueOf();
      this.socket.emit('client-update', msg, function() {
        self.updatePending = false;
        var now = moment().utc().valueOf();
        callback(self.messages.latency, (now - then));
      });
    }
  };

  this.findGame = function() {
    console.log('Finding a game..');
    var msg = {nickname: APP.Model.myName, version: GameNetworkingVersion};
    this.socket.emit('find-game', msg, function(data) {
      console.log('find-game response callback: ', data);
    });
  };

  this.quitGame = function() {
    this.socket.emit('quit-game', {}, function(msg) {
      console.log('quit-game response callback: ', msg);
      callback(self.messages.quitGame);

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
