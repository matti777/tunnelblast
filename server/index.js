//var app = require('express')();
var io = require('socket.io')(3000);
var moment = require('moment');

io.on('connection', function(socket){
  console.log('a user connected', socket.id);

  socket.on('client-ping', function(msg, callback) {
    console.log('Received client-ping', socket.id, msg);

    callback({serverTime: moment().utc().valueOf()});
    //socket.emit('server-pong', {serverTime: moment().utc().valueOf()});
  });

  socket.on('disconnect', function() {
    console.log('user disconnected', socket.id);

    // TODO Notify others waiting/playing for a game etc.
    io.emit('user-disconnected', {socketId: socket.id});
  });
});
