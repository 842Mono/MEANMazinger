let controller = require('./controller');

module.exports = function(io, OV)
{
  io.sockets.on
  (
    'connection',
    function(socket)
    {
      controller.connectIncrementCountTotalSockets();

      socket.on('disconnect', function(data){controller.socketDisconnect(io.sockets, socket, data);});

      socket.on('authenticate', function(data){controller.socketAuthenticate(io.sockets, socket, data);});

      socket.on('newMessage', function(data){controller.socketSendMessage(socket, data);});

      socket.on('newWaveMessage', function(data){controller.socketNewWaveMessage(socket, data);});

      //socket.to(<socketid>).emit('hey', 'I just met you');

      // socket.on
      // (
      //   'newMessageGroupUsers',
      //   function(data)
      //   {
      //     controller.socketSendMessageGroupUsers(socket, data);
      //   }
      // );

      socket.on('createGroupChat', function(data){controller.socketCreateGroupChat(socket, data);});

      socket.on('addUsersToChat', function(data){controller.socketAddUsersToChat(socket, data);});

      socket.on('newMessageGroup', function(data){controller.socketSendMessageGroup(socket, data);});

      socket.on('newWaveMessageGroup', function(data){controller.socketNewWaveMessageGroup(socket, data);});

      socket.on('callAndRing', function(data){controller.socketCallAndRing(socket, data, OV);});

      socket.on('leaveCall', function(data){controller.socketLeaveCall(socket, data, OV);});
    
      socket.on('newImage', function(data){controller.socketNewImage(socket, data);});
    }
  );
}