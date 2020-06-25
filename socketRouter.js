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

      /**
       * Event to allow users to login.
       * 
       * Required inputs:
       * @param {string} Username - A username.
       * @param {string} Password - A password.
       * 
       * Resulting emits:
       * 'authenticateResponse'
       * Emit back to the requester.
       * @param {boolean} success - Whether the request was successful.
       * 
       * 'changeGetAllusers'
       * Emit to everyone.
       */
      socket.on('authenticate', function(data){controller.socketAuthenticate(io.sockets, socket, data);});

      /**
       * Event to allow a logged in user to send a message to another user.
       * 
       * Required inputs:
       * @param {string} Message - Text message or base 64 image file.
       * @param {string} contentType - Enum "TextMessage", "ImageFileBase64", "WaveMessage". The type of the message.
       * @param {string} Recipient - The username of the user to send the message to.
       * 
       * Resulting emits:
       * 'newMessage'
       * Emit to the recipient.
       * @param {string} sender - The username of the user who sent the message.
       * @param {string} message - The message. Either a text message, a wave message or a base 64 image file.
       * @param {string} type - Enum "TextMessage", "ImageFileBase64", "WaveMessage". The type of message.
       * 
       * 'messageStatus'
       * Emit back to the requester.
       * @param {string} recipient - The username of the user to send the message to.
       * @param {string} conversationID - The Conversation ID.
       * @param {object} status - The status object of the conversation.
       */
      socket.on('newMessage', function(data){controller.socketSendMessage(socket, data);});

      //socket.to(<socketid>).emit('hey', 'I just met you');

      // socket.on
      // (
      //   'newMessageGroupUsers',
      //   function(data)
      //   {
      //     controller.socketSendMessageGroupUsers(socket, data);
      //   }
      // );

      /**
       * Event to create a group chat.
       * 
       * Required inputs:
       * @param {string} ConversationName - A name to give to the conversation.
       * 
       * Resulting emits:
       * 'newRoomAcknowledgement'
       * Emit back to the requester.
       * @param {boolean} success - A boolean to indicate whether the request succeeded or failed.
       * @param {string} msg - A log message to indicate if the request succeeded or explain how the request failed.
       * @param {string} conversationID - The new Conversation ID of the room.
       */
      socket.on('createGroupChat', function(data){controller.socketCreateGroupChat(socket, data);});

      /**
       * Event to add users to a group chat that was created.
       * 
       * Required inputs:
       * @param {string} ConversationID - The Conversation ID of the group chat.
       * @param {string} UsersToAdd - Comma separated string of usernames to add to the group chat.
       * 
       * Resulting emits:
       * 'addUsersToChatAcknowledgement'
       * Emit back to the requester.
       * @param {boolean} success - A boolean to indicate whether the request succeeded or failed.
       * @param {string} msg - A log message to indicate if the request succeeded or explain how the request failed.
       */
      socket.on('addUsersToChat', function(data){controller.socketAddUsersToChat(socket, data);});

      /**
       * Event to send a message to a group chat.
       * 
       * Required inputs:
       * @param {string} ConversationID - The conversation ID of the group chat to send the message to.
       * @param {string} ContentType - Enum "TextMessage", "ImageFileBase64", "WaveMessage". The type of the message.
       * @param {string} Message - The text message or the image file.
       * 
       * Resulting emits:
       * 'newMessage'
       * Emit to all the users in the conversation except for the sender.
       * @param {string} sender - The user who sent the message.
       * @param {string} message - The message. Either a text message, a wave message or a base 64 image file.
       * @param {string} contentType - Enum "TextMessage", "ImageFileBase64", "WaveMessage". The type of the message.
       * @param {string} conversationID - The conversation ID of the group chat.
       * 
       * 'messageStatus'
       * Emit to all the users in the conversation.
       * @param {string} conversationID - The conversation ID of the group chat.
       * @param {object} status - The status object of the group chat.
       * 
       * 'err'
       * Emit back to the requester.
       * An error message in case there was an error.
       */
      socket.on('newMessageGroup', function(data){controller.socketSendMessageGroup(socket, data);});

      /**
       * An event to fetch the messages of a conversation.
       * 
       * Required inputs:
       * @param {string} ConversationID - The conversation ID of the chat to fetch the messages of.
       * 
       * Resulting emits:
       * 'messages'
       * Emit back to the requester.
       * @param {string} conversationID - The conversation ID of the chat to fetch the messages of.
       * @param {object} messages - An array of message objects.
       * 
       * 'messageStatus'
       * Emit to all users of the group chat.
       * @param {string} conversationID - The conversation ID of the chat to fetch the messages of.
       * @param {object} status - The status object of the conversation.
       */
      socket.on('fetchMessages', function(data){controller.socketFetchMessages(socket, data);});

      /**
       * An event to send a seen to a group chat.
       * 
       * Required inputs:
       * @param {string} ConversationID - The conversation ID to send a seen to.
       * 
       * Resulting emits:
       * 'messageStatus'
       * Emit to all users of the group chat.
       * @param {string} conversationID - The conversation ID of the group chat.
       * @param {object} status - The status object of the group chat.
       */
      socket.on('seen', function(data){controller.socketSeen(socket, data);});

      /**
       * An event to start a video call.
       * 
       * Required inputs:
       * @param {string} ConversationID - The conversation ID of the group chat.
       * 
       * Resulting emits:
       * 'ring'
       * Emit to all users of the group chat except the sender.
       * @param {string} ConversationID - The conversationID of the group chat.
       * @param {date} videoCallStartTime - The start time of the video call.
       * 
       * 'openviduToken'
       * Emit back to the requester.
       * @param {string} token - The openvidu token that should be used to connect to the openvidu server.
       */
      socket.on('callAndRing', function(data){controller.socketCallAndRing(socket, data, OV);});

      /**
       * An event to leave a video call.
       * 
       * Required inputs:
       * @param {string} ConversationID - The conversation ID of the video call.
       * @param {string} token - The openvidu token
       * 
       * Resulting emits:
       * 'videoCallEnd'
       * Emit to all the users of the group chat.
       * Emitted all users leave the call.
       * @param {string} conversationID - The conversation ID of the video call.
       * @param {date} videoCallEndTime - The end time of the video call.
       * @param {int} videoCallDuration - The duration of the video call.
       */
      socket.on('leaveCall', function(data){controller.socketLeaveCall(socket, data, OV);});
    
      // socket.on('newImage', function(data){controller.socketNewImage(socket, data);});
    
      /**
       * Route to fetch friends and conversations of the user.
       * 
       * No required inputs.
       * 
       * Resulting emits:
       * 'getFriendsAndConversations'
       * Emit back to the requester.
       * @param {boolean} success - Indicates whether the request was successful.
       * @param {string} msg - Reason of failure if exists.
       * @param {array} friends - An array of the usernames of the friends of the user.
       * @param {array} conversations - An array of the conversation IDs of the conversations of the user.
       */
      socket.on('getFriendsAndConversations', function(data){controller.socketGetFriendsAndConversations(socket, data);});
    
      /**
       * Route to add a friend to a user.
       * 
       * Required inputs:
       * @param {string} FriendUsername - The username of the friend to be added.
       * 
       * Resulting emits:
       * 'addFriend'
       * Emit back to the requester.
       * @param {boolean} success - Indicates whether the request was successful.
       * @param {string} msg - The result of the request.
       */
      socket.on('addFriend', function(data){controller.socketAddFriend(socket, data);});
    }
  );
}