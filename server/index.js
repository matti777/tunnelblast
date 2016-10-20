//var app = require('express')();
var io = require('socket.io')(3000);
var moment = require('moment');

// Interval for sending updates to the cliets (in milliseconds)
var UpdateInterval = 500;

// Players currently waiting for a game; stored by their socked.id.
var waitingForGame = {};

// Games currently in progress. Each Game object is stored into this structure
// by both the players' socket.id for faster lookup.
var currentGames = {};

// Current players in all of the games, stored by their socket.id. The
// same Player objects are pointed to by the Game object in question.
var currentPlayers = {};

io.on('connection', function(socket){
  console.log('New connection from socket ID: ', socket.id);

  function handleDisconnect(socket) {
    if (waitingForGame[socket.id]) {
      console.log('Disconnecting waiting for game entry',
        waitingForGame[socket.id]);
      delete waitingForGame[socket.id];
    }

    var game = currentGames[socket.id];
    if (game) {
      console.log('Disconnecting game', game);
      delete currentGames[game.host.socketId];
      delete currentGames[game.otherPlayer.socketId];
      delete currentPlayers[game.host.socketId];
      delete currentPlayers[game.otherPlayer.socketId];

      clearInterval(game.updateTimer);
      var notifySocketId = (socket.id === game.host.socketId) ?
        game.otherPlayer.socketId : game.host.socketId;
      var notifySocket = io.sockets.connected[notifySocketId];
      if (notifySocket) {
        notifySocket.emit('player-disconnected');
      } else {
        console.log('Disconnect: could not find notifySocket!');
      }
    }
  };

  var sendUpdate = function sendUpdate(game) {
    // If the host has an update, send it to the other player unless congested
    var hostUpdate = game.host.stateUpdate;
    if (hostUpdate && !game.host.updatePending) {
      var otherSocket = io.sockets.connected[game.otherPlayer.socketId];
      game.otherPlayer.updatePending = true;

      otherSocket.emit('server-update', hostUpdate, function() {
        console.log('server-update: other player client ACK.');
        game.otherPlayer.updatePending = false;
        delete game.host.stateUpdate;
      });
    }

    // If the other player has an update, send it to the host unless congested
    var otherUpdate = game.otherPlayer.stateUpdate;
    if (otherUpdate && !game.otherPlayer.updatePending) {
      var hostSocket = io.sockets.connected[game.host.socketId];
      game.host.updatePending  = true;

      hostSocket.emit('server-update', otherUpdate, function() {
        console.log('server-update: host player client ACK.');
        game.host.updatePending = false;
        delete game.otherPlayer.stateUpdate;
      });
    }
  }

  socket.on('client-ping', function(msg, callback) {
    // console.log('Received client-ping', socket.id, msg);

    callback({serverTime: moment().utc().valueOf()});
  });

  socket.on('find-game', function(msg, callback) {
    if (!msg.nickname) {
      return callback({error: 'Invalid message data'});
    }

    if (waitingForGame[socket.id]) {
      console.log('find-game: this player already looking for a game!', socket.id);
      return callback({error: 'You are already looking for game'});
    }

    console.log('Received find-game from: ', socket.id);

    // If there are any people already looking for a game, connect this one
    // with the first one and already create a game for them!
    var keys = Object.keys(waitingForGame);
    if (keys.length > 0) {
      var hostId = keys[0];
      var hostEntry = waitingForGame[hostId];
      delete waitingForGame[hostId];

      var game = {
        host: {nickname: hostEntry.nickname, socketId: hostId, host: true},
        otherPlayer: {nickname: msg.nickname, socketId: socket.id, host: false}
      };
      currentGames[game.host.socketId] = game;
      currentGames[game.otherPlayer.socketId] = game;
      currentPlayers[hostId] = game.host;
      currentPlayers[socket.id] = game.otherPlayer;
      callback({status: 'connected'});

      game.updateTimer =
        setInterval(sendUpdate.bind(game, game), UpdateInterval);

      // Notify both players about the game about to start
      var hostSocket = io.sockets.connected[hostId];
      hostSocket.emit('game-starting',
        {youAreHost: true, opponent: game.otherPlayer});
      socket.emit('game-starting', {youAreHost: false, opponent: game.host});
      console.log('New game starting: ', game);
    } else {
      // Otherwise just add a new looking for a game entry for this player
      var entry = {nickname: msg.nickname};
      waitingForGame[socket.id] = entry;
      callback({status: 'waiting'});
      console.log('Added new waiting for game entry', entry);
    }
  });

  socket.on('client-update', function(msg, callback) {
    // 'ack' the original message asap
    callback();

    console.log('Received client-update: ', msg);

    // Find the corresponding Player object
    var player = currentPlayers[socket.id];
    if (!player) {
      console.log('ERROR: client-update: Player not found!');
      return
    }

    // Insert / update the pending state update; will be sent to the other
    // player at the next possible moment in the update tick
    var stateUpdate = player.stateUpdate || {};
    stateUpdate.paddlePosition = msg.paddlePosition;
    stateUpdate.paddleVelocity = msg.paddleVelocity;
    player.stateUpdate = stateUpdate;
  });

  socket.on('quit-game', function(msg, callback) {
    console.log('quit-game for socket id', socket.id);
    handleDisconnect(socket);
    callback({status: 'ok'});
  });

  socket.on('disconnect', function() {
    console.log('user disconnected', socket.id);
    handleDisconnect(socket);
  });
});

console.log('Running on port 3000..');
