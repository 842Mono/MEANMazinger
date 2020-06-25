let User = require('./Models/User');
let Messages = require('./Models/Messages');
let MessagesStatus = require('./Models/MessagesStatus');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
// var User = require('./Models/User');
var jwt = require('jsonwebtoken');
const config = require('./secret');


let connections = [];
let countTotalSockets = 0;

var OpenViduRole = require('openvidu-node-client').OpenViduRole;
let openviduMap = {};

let ControllerFunctions =
{
  authorise:passport.authenticate('jwt', {session:false}),
  register:function(req,res)
  {
    if(!req.body.Username || !req.body.Password)
      return res.json({success:false, msg:"Missing Required Inputs"});

    let partialUser = {Username:req.body.Username, Password:req.body.Password};

    if(req.body.FirstName)
      partialUser.FirstName = req.body.FirstName;
    if(req.body.MiddleName)
      partialUser.MiddleName = req.body.MiddleName;
    if(req.body.LastName)
      partialUser.LastName = req.body.LastName;
    if(req.body.DateOfBirth)
      partialUser.DateOfBirth = req.body.DateOfBirth;
    if(req.body.Email)
      partialUser.Email = req.body.Email;

    let newUser = new User(partialUser);
    //newUser.save
    User.createUser
    (
      newUser,
      function(err,savedUser)
      {
        if(err)
        {
          console.log(err);
          return res.json({success:false, msg:"Error Saving User."});
        }
        else
        {
          console.log(savedUser);
          return res.json({success:true, msg:"User Saved Successfully."});
        }
      }
    );
  },
  authenticate:function(req, res)
  {
    let usernameIn = req.body.Username;
    let passwordIn = req.body.Password;

    User.findOne
    (
      {Username:usernameIn},
      function(err, user)
      {
        if(err)
          throw err;
        if(!user)
        {
          res.status(401).json({ success: false, msg: 'User not found.' });
        }
        else
        {
          // Check if password matches
          user.comparePassword
          (
            passwordIn,
            function(err, isMatch)
            {
              if(err)
                console.log(err);
              if(isMatch)
              {
                // Create token if the password matched and no error was thrown
                const token = jwt.sign
                (
                  {un:user.Username},
                  config.secret,
                  {expiresIn: 10080} //in seconds
                );
                //make Online = true;
                res.status(200).json({ success: true, token: 'JWT ' + token });
              }
              else
              {
                res.status(401).json({ success: false, msg: 'Authentication failed. Passwords did not match.'});
              }
            }
          );
        }
      }
    );
  },
  getAllUsers(req,res)
  {
    let Username = req.user.Username;

    User.find
    (
      {},
      function(err,usersFound)
      {
        if(err)
          console.log(err);

        for(let i = 0; i < usersFound.length; ++i)
        {
          usersFound[i].Password = "";
        }

        let filteredUsers = usersFound.filter
        (
          function(userElement)
          {
            return userElement.Username != Username;
          }
        );

        res.json({success:true, Users:filteredUsers});
      }
    );
  },
  connectIncrementCountTotalSockets:function()
  {
    ++countTotalSockets;
    console.log("\n\nServerEvent: Connect!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
  },
  socketDisconnect:function(ioSockets, socket, data)
  {
    --countTotalSockets;

    let connection = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s == socket;
      }
    );
    if(connection.length > 0)
    {
      connections = connections.filter
      (
        function(connectionElement)
        {
          return connectionElement.s != socket;
        }
      );
      //console.log(connection[0].un);
      console.log("Emitting changeGetAllUsers!");
      User.update
      (
        { Username:connection[0].un },
        { $set: { Online:false }},
        function(){ioSockets.emit('changeGetAllUsers', {});}
      );
      // controller.socketUpdateOnline(connection[0].un, false, );
    }
    //else
    //  io.sockets.emit('changeGetAllUsers', {});

    console.log("\n\nServerEvent: Disconnect!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
  },
  // socketUpdateOnline:function(user,status,next)
  // {
  //   User.update
  //   (
  //     { Username:user },
  //     { $set: { Online:status }},
  //     next
  //   );
  // },
  initClearOnline:function()
  {
    User.update
    (
      {Online:true},
      { $set: { Online:false }},
      {multi: true},
      function(err,obj){ if(err) { console.error(err); } console.log(obj);}
    );
  },
  socketAuthenticate:function(ioSockets, socket, data)
  {
    let usernameIn = data.Username;
    let passwordIn = data.Password;

    let next = function({success, msg})
    {
      if(success)
      {
        connections.push({s:socket,un:data.Username});
        User.update
        (
          { Username:usernameIn },
          { $set: { Online:true }},
          function()
          {
            socket.emit('authenticateResponse', {success:true});
            ioSockets.emit('changeGetAllUsers', {});
            console.log("\n\nServerEvent: Authentication!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
          }
        );
        // controller.socketUpdateOnline(data.Username, true, );
      }
      else
      {
        socket.emit('authenticateResponse', {success:false});
        console.error(msg);
        socket.emit('err', msg);
      }
    }

    User.findOne
    (
      {Username:usernameIn},
      function(err, user)
      {
        if(err)
          throw err;
        if(!user)
        {
          next({ success: false, msg: 'User not found.' });
        }
        else
        {
          // Check if password matches
          user.comparePassword
          (
            passwordIn,
            function(err, isMatch)
            {
              if(err)
                console.log(err);
              if(isMatch)
              {
                next({ success: true, msg: 'Password matches!'});
              }
              else
              {
                next({ success: false, msg: 'Authentication failed. Passwords did not match.'});
              }
            }
          );
        }
      }
    );
  },
  socketSendMessage:function(socket, data)
  {
    let content = data.Message;
    let contentType = data.ContentType; // enum "TextMessage", "ImageFileBase64", "WaveMessage".
    let recepientUsername = data.Recipient; // fix spelling mistake to Recipient.

    let userSender = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let userRecepient = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.un == recepientUsername;
      }
    );

    let next = function({success, msg, newConversation})
    {
      if(success)
      {
        if(userRecepient.length > 0)
        {
          userRecepient[0].s.emit('newMessage',{sender:userSender[0].un, message:content, type:contentType});

          MessagesStatus.findOne
          (
            {ConversationID:newConversation._id},
            function(err, status)
            {
              if(err) {console.error(err);}
              status.DeliveredTo.push
              (
                {
                  Username:recepientUsername,
                  Date: new Date()
                }
              );

              status.save
              (
                function(err, savedStatus)
                {
                  if(err) {console.error(err);}
                  socket.emit('messageStatus', {recipient:recepientUsername, conversationID:newConversation._id, status:savedStatus});
                }
              )
            }
          );
          console.log("\n\nServerEvent: Active Message!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
        }
        else
        {
          socket.emit('messageStatus', {recepient:recepientUsername, status:"Sent"});
        }
      }
      else
      {
        console.log(msg);
        socket.emit('err', msg);
      }
    }
    
    // if(userRecepient.length > 0)
    // {
    let Username = userSender[0].un;
    let Message =
    {
      Timestamp:new Date(),
      Type:contentType,
      Content:content,
      Sender:Username
    };

    Messages.findOne
    (
      {$or:[{Username1:Username, Username2:recepientUsername},{Username1:recepientUsername, Username2:Username}]},
      function(err,conversation)
      {
        if(err)
          console.log(err);
        //if(Object.keys(conversation).length == 0)
        if(!conversation)
        {
          let newConversation = new Messages
          (
            {
              Username1:Username,
              Username2:recepientUsername,
              Messages:[Message]
            }
          );
          newConversation.save
          (
            function(err,savedConversation)
            {
              if(err)
              {
                console.log(err);
                next({success:false, msg:"Failed To Save New Conversation."});
              }
              else
              {
                let newMessagesStatus = new MessagesStatus
                (
                  {
                    ConversationID:savedConversation._id
                  }
                );

                newMessagesStatus.save
                (
                  function(err, savedMessagesStatus)
                  {
                    if(err) { console.error(err); }

                    next({success:true, msg:"New Conversation Saved Successfully.", newConversation:savedConversation});
                  }
                );
              }
            }
          );
        }
        else
        {
          conversation.Messages.push(Message);
          conversation.save
          (
            function(err,savedConversation)
            {
              if(err)
              {
                console.log(err);
                next({success:false, msg:"Failed To Save Message."});
              }
              else
                next({success:true, msg:"Message Saved Successfully.", newConversation:savedConversation});
              //
            }
          );
        }
      }
    );
    // }
    // else
    // {
    //   socket.emit("err", "Cannot find recepient.")
    // }
  },
  socketSendMessageGroup:function(socket, data)
  {
    let ConversationID = data.ConversationID;
    let contentType = data.ContentType; // enum "TextMessage", "ImageFileBase64", "WaveMessage".
    let content = data.Message;
    let userSender = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let sender = userSender[0].un;

    let Message =
    {
      Timestamp:new Date(),
      Type:contentType,
      Content:content,
      Sender:sender
    };

    Messages.findOne
    (
      {_id:ConversationID},
      function(err, conversation)
      {
        if(err)
        {
          console.error(err);
          socket.emit('err', "Error retrieving conversation.")
        }
        if(conversation)
        {
          conversation.Messages.push(Message);
          conversation.save
          (
            function(err,savedConversation)
            {
              if(err)
              {
                console.log(err);
                socket.emit('err', "Error saving conversation.");
              }
              else
              {
                let recepients = conversation.AssociatedUsers;
  
                let promisesArray = [];

                recepients.forEach(recepient =>
                {
                  let user = connections.filter
                  (
                    function(connectionElement)
                    {
                      return connectionElement.un == recepient;
                    }
                  );
                  if(user.length > 0 && user[0].un !== sender)
                  {
                    user[0].s.emit('newMessage',{sender:sender, message:content, contentType:contentType, conversationID:ConversationID});
                    console.log("\n\nServerEvent: Active Message!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");

                    let promise = new Promise(function(resolve)
                    {
                      MessagesStatus.findOne
                      (
                        {ConversationID:ConversationID},
                        function(err, status)
                        {
                          if(err) {console.error(err);}
  
                          let DeliveredToIndex = status.DeliveredTo.findIndex(deliveredToObject => deliveredToObject.Username === user[0].un);

                          if(DeliveredToIndex == -1)
                          {
                            status.DeliveredTo.push
                            (
                              {
                                Username:user[0].un,
                                Date:new Date()
                              }
                            );
                          }
                          else
                          {
                            status.DeliveredTo[DeliveredToIndex].Date = new Date();
                          }
  
                          status.save
                          (
                            function(err, status)
                            {
                              if(err) { console.error(err); }
  
                              resolve();
                            }
                          );
                        }
                      );
                    });
                    promisesArray.push(promise);
                  }
                });

                Promise.all(promisesArray).then
                (
                  function()
                  {
                    MessagesStatus.findOne
                    (
                      {ConversationID:ConversationID},
                      function(err, status)
                      {
                        if(err) {console.error(err);}

                        // socket.emit('messageStatus', {conversationID:ConversationID, status:status});

                        recepients.forEach(recepient =>
                        {
                          let user = connections.filter
                          (
                            function(connectionElement)
                            {
                              return connectionElement.un == recepient;
                            }
                          );
                          if(user.length > 0) // && user[0].un !== sender)
                          {
                            user[0].s.emit('messageStatus', {conversationID:ConversationID, status:status});
                          }
                        });
                      }
                    );
                  }
                );
              }
            }
          );
        }
        else
        {
          console.log("Cannot find conversation.");
          socket.emit('err', "Cannot find conversation");
        }
      }
    );
  },
  socketFetchMessages:function(socket, data)
  {
    let ConversationID = data.ConversationID;
    let requester = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let requesterUsername = requester[0].un;

    Messages.findOne
    (
      {_id:ConversationID},
      function(err, conversation)
      {
        if(err) { console.error(err); }

        MessagesStatus.findOne
        (
          {ConversationID:ConversationID},
          function(err, status)
          {
            if(err) { console.error(err); }

            let DeliveredToIndex = status.DeliveredTo.findIndex(deliveredToObject => deliveredToObject.Username === requesterUsername);

            if(DeliveredToIndex == -1)
            {
              status.DeliveredTo.push
              (
                {
                  Username:requesterUsername,
                  Date:new Date()
                }
              );
            }
            else
            {
              status.DeliveredTo[DeliveredToIndex].Date = new Date();
            }

            status.save
            (
              function(err, status)
              {
                if(err) { console.error(err); }

                socket.emit('messages', {conversationID:ConversationID, messages:conversation});

                conversation.AssociatedUsers.forEach(username =>
                {
                  let user = connections.filter
                  (
                    function(connectionElement)
                    {
                      return connectionElement.un == username;
                    }
                  );
                  if(user.length > 0) // && user[0].un !== requesterUsername)
                  {
                    user[0].s.emit('messageStatus', {conversationID:ConversationID, status:status});
                  }
                });
              }
            );
          }
        );
      }
    );
  },
  socketSeen:function(socket, data)
  {
    let ConversationID = data.ConversationID;
    let requester = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let requesterUsername = requester[0].un;

    MessagesStatus.findOne
    (
      {ConversationID:ConversationID},
      function(err, status)
      {
        if(err) { console.error(err); }

        let SeenByIndex = status.SeenBy.findIndex(MessageStatusObject => MessageStatusObject.Username === requesterUsername);

        if(SeenByIndex == -1)
        {
          status.SeenBy.push
          (
            {
              Username:requesterUsername,
              Date:new Date()
            }
          );
        }
        else
        {
          status.SeenBy[SeenByIndex].Date = new Date();
        }

        status.save
        (
          function(err, status)
          {
            if(err) { console.error(err); }

            Messages.findOne
            (
              {_id:ConversationID},
              function(err, conversation)
              {
                if(err) { console.error(err); }

                conversation.AssociatedUsers.forEach(username =>
                {
                  let user = connections.filter
                  (
                    function(connectionElement)
                    {
                      return connectionElement.un == username;
                    }
                  );
                  if(user.length > 0) // && user[0].un !== requesterUsername)
                  {
                    user[0].s.emit('messageStatus', {conversationID:ConversationID, status:status});
                  }
                });
              }
            );
          }
        );
      }
    );
  },

  addfriend:function(req,res)
  {
    let friendUsername = req.body.FriendUsername;
    // let username = req.user.Username;

    if(req.user.Friends.includes(friendUsername))
    {
      return res.json({success:false, msg:"Friend already exists."})
    }

    req.user.Friends.push(friendUsername);
    // req.user.Friends = [...new Set(req.user.Friends)];


    req.user.save
    (
      function(err, savedUser)
      {
        if(err)
        {
          console.error(err);
          return res.json({success:false, msg:"Error saving user."});
        }
        if(!savedUser)
        {
          return res.json({success:false, msg:"Error adding friend."});
        }
        else
        {
          return res.json({success:true, msg:"Friend added successfully."})
        }
      }
    );
  },
  socketAddFriend:function(socket, data)
  {
    let friendUsername = data.FriendUsername;

    let userSender = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let senderUsername = userSender[0].un;

    User.findOne //authenticated sockets should have access to users
    (
      {Username:senderUsername},
      function(err, User)
      {
        if(err)
        {
          socket.emit('addFriend', {success:false, msg:"Error retrieving user."});
        }
        else
        {
          if(User.Friends.includes(friendUsername))
          {
            socket.emit('addFriend', {success:false, msg:"Friend already exists."});
          }
          else
          {
            User.Friends.push(friendUsername);
            User.save
            (
              function(err, savedUser)
              {
                if(err)
                {
                  console.error(err);
                  socket.emit('addFriend', {success:false, msg:"Error saving user."});
                }
                else
                {
                  socket.emit('addFriend', {success:true, msg:"Friend added successfully."});
                }
              }
            );
          }
        }
      }
    );
  },
  getFriendsAndConversations:function(req,res)
  {
    return res.json({friends:req.user.Friends, conversations:req.user.ConversationIDs});
  },
  socketGetFriendsAndConversations:function(socket, data)
  {
    let userSender = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let senderUsername = userSender[0].un;

    User.findOne //authenticated sockets should have access to users
    (
      {Username:senderUsername},
      function(err, User)
      {
        if(err)
        {
          socket.emit('getFriendsAndConversations', {success:false, msg:"Error retrieving user."});
        }
        else
        {
          socket.emit('getFriendsAndConversations', {success:true, friends:User.Friends, conversations:User.ConversationIDs});
        }
      }
    );
  },

  socketCallAndRing:function(socket, data, OV)
  {
    let sessionName = data.ConversationID;
    let ConversationID = data.ConversationID;

    let userSender = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let sender = userSender[0].un;
    
    let role = OpenViduRole.PUBLISHER;
    let tokenOptions = {
      data: "",
      role: role
    };

    let ring = function()
    {
      Messages.findOne
      (
        {_id:ConversationID},
        function(err, conversation)
        {
          if(err)
          {
            console.error(err);
          }

          let logStartTimeMessage =
          {
            Timestamp:openviduMap[ConversationID].startTimestamp,
            Type:"VideoCallStartTime",
            Sender:sender
          };

          conversation.Messages.push(logStartTimeMessage);

          conversation.save
          (
            function(err)
            {
              if(err)
              {
                console.error(err);
              }

              conversation.AssociatedUsers.forEach(recepient =>
              {
                let user = connections.filter
                (
                  function(connectionElement)
                  {
                    return connectionElement.un == recepient;
                  }
                );
                if(user.length > 0 && user[0].un !== sender)
                {
                  user[0].s.emit('ring',{ConversationID:ConversationID, videoCallStartTime:openviduMap[ConversationID].startTimestamp});
                  console.log("\n\nServerEvent: Ring!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
                }
              });
            }
          );
        }
      );
    }

    // if(openviduSessionsMap[ConversationID])
    if(openviduMap[ConversationID])
    {
      // Get the existing Session from the collection
      // let session = openviduSessionsMap[ConversationID];
      let session = openviduMap[ConversationID].session;

      // Generate a new token asynchronously with the recently created tokenOptions
      session.generateToken(tokenOptions).then(token =>
      {
        // Store the new token in the collection of tokens
        // openviduSessionNamesTokensMap[ConversationID].push(token);
        openviduMap[ConversationID].tokens.push(token);

        socket.emit('openviduToken', { token:token });

        // ring();

      }).catch(error => { console.error(error); });
    }
    else
    {
      OV.createSession().then(session =>
      {
        // openviduSessionsMap[ConversationID] = session;

        // openviduTimestampsMap[ConversationID] = new Date();

        //?
        // Store a new empty array in the collection of tokens
        // openviduSessionNamesTokensMap[ConversationID] = [];

        openviduMap[ConversationID] =
        {
          session:session,
          startTimestamp:new Date(),
          tokens:[]
        };

        // Generate a new token asynchronously with the recently created tokenOptions
        session.generateToken(tokenOptions).then(token =>
        {
          //?
          // Store the new token in the collection of tokens
          openviduMap[ConversationID].tokens.push(token);

          // Return the Token to the client
          socket.emit('openviduToken', { token:token });

          ring();

        }).catch(error => {console.error(error);});
      }).catch(error =>
      {
        console.error(error);
        let msg = "Error contacting Openvidu Server.";
        console.error(msg);
        socket.emit('err', msg);
      });
    }
  },
  socketLeaveCall:function(socket, data)
  {
    let sessionName = data.ConversationID;
    let ConversationID = data.ConversationID;
    let Token = data.token;
    
    let userSender = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let sender = userSender[0].un;
    
    console.log('Removing user | {sessionName, token}={' + sessionName + ', ' + Token + '}');


    // If the session exists
    // if (openviduSessionsMap[ConversationID] && openviduSessionNamesTokensMap[ConversationID])
    if(openviduMap[ConversationID])
    {
      // let index = openviduSessionNamesTokensMap[ConversationID].indexOf(token);
      let index = openviduMap[ConversationID].tokens.indexOf(Token);

      // If the token exists
      if (index !== -1) {
          // Token removed
          // openviduSessionNamesTokensMap[ConversationID].splice(index, 1);
          openviduMap[ConversationID].tokens.splice(index, 1);
          // console.log(sessionName + ': ' + openviduSessionNamesTokensMap[ConversationID].toString());
          console.log(sessionName + ': ' + openviduMap[ConversationID].tokens.toString());
      } else {
          var msg = "Error: the TOKEN wasn't valid";
          console.log(msg);
          socket.emit('err', msg);
      }
      // if (openviduSessionNamesTokensMap[ConversationID].length == 0) {
      if(openviduMap[ConversationID].tokens.length == 0)
      {
        // Last user left: session must be removed
        console.log(sessionName + ' empty!');
        // delete openviduSessionsMap[ConversationID];
        Messages.findOne
        (
          {_id:ConversationID},
          function(err, conversation)
          {
            if(err)
            {
              console.error(err);
            }
            
            let timestamp = new Date();
            let duration = timestamp - openviduMap[ConversationID].startTimestamp;
            let logEndTimeMessage =
            {
              Timestamp:timestamp,
              Type:"VideoCallEndTime",
              VideoCallDuration:duration,
              Sender:sender
            };

            conversation.Messages.push(logEndTimeMessage);

            conversation.save
            (
              function(err)
              {
                if(err) {console.error(err);}

                conversation.AssociatedUsers.forEach(recepient =>
                {
                  let user = connections.filter
                  (
                    function(connectionElement)
                    {
                      return connectionElement.un == recepient;
                    }
                  );
                  if(user.length > 0) // && user[0] !== sender)
                  {
                    user[0].s.emit('videoCallEnd',{conversationID:ConversationID, videoCallEndTime:timestamp, videoCallDuration:duration});
                    console.log("\n\nServerEvent: Video Call end!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
                  }
                });
                openviduMap[ConversationID] = null;
              }
            );
          }
        );
      }
      // res.status(200).send();
    }
    else
    {
      var msg = "Error: session does not exist";
      console.log(msg);
      socket.emit('err', msg);
    }
  },
  socketCreateGroupChat:function(socket, data)
  {
    let conversationName = data.ConversationName;
    let userSender = connections.filter
    (
      function(connectionElement)
      {
        return connectionElement.s.id == socket.id;
      }
    );
    let sender = userSender[0].un;

    let newRoom = new Messages
    (
      {
        ConversationName:conversationName,
        AssociatedUsers:[sender]
      }
    );

    newRoom.save
    (
      function(err, savedNewRoom)
      {
        if(err)
        {
          console.error(err);
          return socket.emit('newRoomAcknowledgement', {success:false, msg:"Error saving new chat room."});
        }
        else
        {
          let newMessagesStatus = new MessagesStatus
          (
            {
              ConversationID:savedNewRoom._id
            }
          );

          newMessagesStatus.save
          (
            function(err, savedMessagesStatus)
            {
              if(err) { console.error(err); }
            }
          );

          User.findOne //authenticated sockets should have access to users
          (
            {Username:sender},
            function(err, User)
            {
              if(err)
              {
                socket.emit('newRoomAcknowledgement', {success:false, msg:"Error retrieving user."});
              }
              else
              {
                User.ConversationIDs.push(savedNewRoom._id);
                User.save
                (
                  function(err, savedUser)
                  {
                    if(err)
                    {
                      console.log(err);
                      return socket.emit('newRoomAcknowledgement', {success:false, msg:"Error saving room to user."});
                    }
                    else
                    {
                      return socket.emit('newRoomAcknowledgement', {success:true, msg:"New conversation saved.", conversationID:savedNewRoom._id});
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  },
  socketAddUsersToChat:function(socket, data)
  {
    let ConversationID = data.ConversationID;
    // let UsersToAdd = JSON.parse(data.UsersToAdd); //expected to be an array
    let UsersToAdd = data.UsersToAdd.split(",");

    Messages.findOne
    (
      {_id:ConversationID},
      function(err, conversation)
      {
        if(err)
        {
          console.error(err);
          return socket.emit('addUsersToChatAcknowledgement', {success:false, msg:"Error retrieving conversation."});
        }
        else
        {
          UsersToAdd.forEach(user => conversation.AssociatedUsers.push(user));
          conversation.AssociatedUsers = [...new Set(conversation.AssociatedUsers)];
          conversation.save
          (
            function(err, savedConversation)
            {
              if(err)
              {
                console.error(err);
                return socket.emit('addUsersToChatAcknowledgement', {success:false, msg:"Error saving conversation."});
              }
              else
              {
                return socket.emit('addUsersToChatAcknowledgement', {success:true, msg:"Conversation updated."});
              }
            }
          );
        }
      }
    );
  }
}

module.exports = ControllerFunctions;
