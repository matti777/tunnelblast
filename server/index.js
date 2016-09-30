//var app = require('express')();
var io = require('socket.io')(3000);
var moment = require('moment');

// Players currently waiting for a game; stored by their socked.id.
var waitingForGame = {};

// Games currently in progress. Each Game object is stored into this structure
// by both the players' socket.id for faster lookup.
var currentGames = {};

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

  socket.on('client-ping', function(msg, callback) {
    // console.log('Received client-ping', socket.id, msg);

    callback({serverTime: moment().utc().valueOf()});
  });

  socket.on('find-game', function(msg, callback) {
    if (!msg.nickname) {
      return callback({error: 'Invalid message data'});
    }

    // If there are any people already looking for a game, connect this one
    // with the first one and already create a game for them!
    var keys = Object.keys(waitingForGame);
    if (keys.length > 0) {
      var hostId = keys[0];
      var hostEntry = waitingForGame[hostId];
      delete waitingForGame[hostId];

      var game = {
        host: {nickname: hostEntry.nickname, socketId: hostId},
        otherPlayer: {nickname: msg.nickname, socketId: socket.id}
      };
      currentGames[game.host.socketId] = game;
      currentGames[game.otherPlayer.socketId] = game;
      callback({status: 'connected'});

      // Notify both players about the game about to start
      var hostSocket = io.sockets.connected[hostId];
      hostSocket.emit('game-starting', {youAreHost: true, game: game});
      socket.emit('game-starting', {youAreHost: false, game: game});
      console.log('New game starting: ', game);
    } else {
      // Otherwise just add a new looking for a game entry for this player
      var entry = {nickname: msg.nickname};
      waitingForGame[socket.id] = entry;
      callback({status: 'waiting'});
      console.log('Added new waiting for game entry', entry);
    }
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
