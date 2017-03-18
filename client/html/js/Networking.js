// Define namespace
var APP = APP || {};

var PingInterval = 2000; // Interval for sending client-ping, in ms
var UpdateInterval = 42; // Interval for sending client-update, in ms

// Server address
//var GameServerAddress = 'http://localhost:3001';
var GameServerAddress = 'http://104.199.110.201:3001';

// Game's networking version; integer, always update when breaking compatibility.
var GameNetworkingVersion = 1;

APP.Networking = function(callback) {
  var self = this;

  self.socket = io(GameServerAddress);

  self.messages = {
    disconnected: 1,
    connected: 2,
    latency: 3,
    opponentDisconnected: 4,
    gameStarting: 5,
    quitGame: 6,
    serverUpdate: 7
  };

  /** Set to true when sending game updates over network. */
  self.sendingUpdates = false;

  /**
   * Sends a ping message to server to measure network latency while
   * a game is not ongoing and no update packets are being sent.
   */
  self.sendPing = function() {
    console.log('Sending PING to server..');
    var then = moment().utc().valueOf();

    self.socket.emit('client-ping', {clientTime: then},
      function (data) {
       // console.log('client-ping response data', data);
        var now = moment().utc().valueOf();
        callback(self.messages.latency, (now - then));
        console.log('Received server PONG - latency: ' + (now - then) + 'ms');

        // Only ping when not sending game updates
        if (!self.sendingUpdates) {
          setTimeout(self.sendPing.bind(self), PingInterval);
        }
      });
  };

  /**
   * Resets the networking state.
   */
  self.reset = function() {
    console.log('Clearing all network updates.');

    delete self.latestPaddleUpdateTime;
    delete self.ballUpdate;
    delete self.scoreUpdate;
    delete self.winUpdate;
  };

  /**
   * As the game host, indicate that one of the players scored.
   *
   * @param hostScored true if the game host scored; false if the other player
   * did.
   */
  self.updateScoreState = function(hostScored) {
    assert(APP.Model.multiplayer.youAreHost, 'Only host can send scores');

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

  /**
   * As the Game host, indicate that one of the players has won the game.
   *
   * @param hostWon true if the game host won; false if the other player won.
   */
  self.updateWinState = function(hostWon) {
    assert(APP.Model.multiplayer.youAreHost);

    var winUpdate = self.winUpdate || {};

    if (hostWon) {
      winUpdate.hostWon = true;
    } else {
      winUpdate.otherPlayerWon = true;
    }

    self.winUpdate = winUpdate;
  };

  /**
   * Trigger the paddle state update; do this by simply setting a flag to
   * improve performance in case this would be done several times without
   * actually sending it in between (as is probable); do the actual velocity
   * calculations when the update is actually being sent.
   */
  // self.updatePaddleState = function() {
  //   self.paddleUpdate = true;
  // };

  /* old:
  self.updatePaddleState = function() {
    assert(myPaddle, "myPaddle global object not defined!");

    var velocity = {x: 0, y: 0};

    if (self.latestPaddleUpdateTime) {
      velocity = myPaddle.getVelocitySince(self.latestPaddleUpdateTime);
    }

    self.paddleUpdate = {
      position: myPaddle.physicsBody.position,
      velocity: velocity
    };
  };
*/
  /* old:
  self.updatePaddleState = function(position, velocity) {
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
  */

  self.updateBallState = function(position, velocity, speedMultiplier,
                                  angularVelocity) {
    assert(position && velocity && angularVelocity);

    self.ballUpdate = {
      position: position,
      velocity: velocity,
      speedMultiplier:
      speedMultiplier,
      angularVelocity: angularVelocity
    };

    // Send ball updates immediately to minimize twitching
    // self.sendUpdate();
  };

  /**
   * Sends any updates to the server. After the server ACKs this update,
   * immediately send the next one if sendingUpdates is still true.
   */
  self.sendUpdate = function() {
    // if (self.updatePending) {
    //   console.log('Update congested!');
    //   return;
    // }

    var msg = {};
    var then = moment().utc().valueOf();

    // Always send a paddle update
    msg.paddle = {
      position: myPaddle.getLatestPosition(),
      velocity: myPaddle.getVelocitySince(self.latestPaddleUpdateTime)
    };
    // self.prevPaddleUpdate = msg.paddle;
    // delete self.paddleUpdate;

    // Mark the time when paddle update was sent
    self.latestPaddleUpdateTime = then;

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

    assert(Object.keys(msg).length > 0, 'Should always have something to send');

      // self.updatePending = true;

    self.socket.emit('client-update', msg, function() {
      // self.updatePending = false;
      var now = moment().utc().valueOf();
      callback(self.messages.latency, (now - then));

      if (self.sendingUpdates) {
        // Send next update immediately
        self.sendUpdate();
      }
    });
  };

  /**
   * Requests server to find a game or wait for one.
   */
  self.findGame = function() {
    console.log('Finding a game..');
    var msg = {nickname: APP.Model.myName, version: GameNetworkingVersion};
    self.socket.emit('find-game', msg, function(data) {
      console.log('find-game response callback: ', data);
    });
  };

  /**
   * Tells the server that we are quitting the current game / canceling
   * our wait in the waiting for game -queue.
   */
  self.quitGame = function() {
    self.socket.emit('quit-game', {}, function(msg) {
      console.log('quit-game response callback: ', msg);
      callback(self.messages.quitGame);

      // Stop sending updates to server
      self.sendingUpdates = false;
      console.log('Stopping sending network updates.');

      // Resume pinging the server
      self.sendPing();

      // if (self.sendUpdateTimer) {
      //   clearInterval(self.sendUpdateTimer);
      //   delete self.sendUpdateTimer;
      // }
    });
  };

  /**
   * Received a message that a new game is starting.
   */
  self.socket.on('game-starting', function(msg) {
    console.log('Game starting!', msg);

    // MUST call this as the first thing as it performs initializations
    callback(self.messages.gameStarting, msg);

    self.reset();

    // Start sending updates to server
    console.log('Starting to send network updates');
    self.sendingUpdates = true;
    self.sendUpdate();

    // self.sendUpdateTimer =
    //   setInterval(self.sendUpdate.bind(self), UpdateInterval);
  });

  /**
   * Received a game update from the server.
   */
  self.socket.on('server-update', function(msg, serverCallback) {
    // ACK the message asap to allow server to send more
    serverCallback();

    // console.log('Got server-update', msg);
    callback(self.messages.serverUpdate,  msg);
  });

  self.socket.on('player-disconnected', function(msg) {
    console.log('Opponent disconnected', msg);
    callback(self.messages.opponentDisconnected);
  });

  self.socket.on('connect', function() {
    console.log('Connected to server');
    callback(self.messages.connected);
  });

  self.socket.on('connect_error', function(err) {
    console.log('Connect error', err);
    callback(self.messages.disconnected);
  });

  self.socket.on('reconnect_error', function(err) {
    console.log('Reconnection error', err);
    callback(self.messages.disconnected);
  });

  // Send initial ping immediately
  self.sendPing();
};

APP.Networking.constructor = APP.Networking;
