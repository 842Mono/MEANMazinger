var User = require('./Models/User');
var Messages = require('./Models/Messages');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
// var User = require('./Models/User');
var jwt = require('jsonwebtoken');
const config = require('./secret');


let connections = [];
let countTotalSockets = 0;

var OpenViduRole = require('openvidu-node-client').OpenViduRole;
let openviduSessionsMap = {};
let openviduSessionNamesTokensMap = {};

let ControllerFunctions =
{
  authorise:passport.authenticate('jwt', {session:false}),
  register:function(req,res)
  {
    //req.body.checkBody('firstName', 'FirstName is required').notEmpty();
    //req.body.checkBody('firstName', 'FirstName is required').notEmpty();
    //console.log(req);
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
  login:function(req,res){},
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
  fetchConversation:function(req,res)
  {
    if(!req.body.requiredUsername)
      return res.json({success:false, msg:"Required username wasn't provided."});
    let requesterUsername = req.user.Username; //"u1"; //req.user.Username;
    let requiredUsername = req.body.requiredUsername;

    Messages.findOne
    (
      {$or:[{Username1:requesterUsername, Username2:requiredUsername},{Username1:requiredUsername, Username2:requesterUsername}]},
      function(err,conversation)
      {
        if(err)
          console.log(err);
        if(!conversation)
          return res.json({success:false, msg:"Conversation Not Found"});
        else
        {
          res.json({success:true, conversation:conversation});
        }
      }
    );
  },
  sendMessage:function(req,res)
  {
    if(!req.body.RecepientUsername || !req.body.Content)
      return res.json({success:false, msg:"Some input data is missing."});
    let Username = req.user.Username; //"u1"; //req.user.Username;
    let RecepientUsername = req.body.RecepientUsername;
    let Message =
    {
      Timestamp:new Date(),
      Content:req.body.Content,
      Sender:Username
    };

    Messages.findOne
    (
      {$or:[{Username1:Username, Username2:RecepientUsername},{Username1:RecepientUsername, Username2:Username}]},
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
              Username2:RecepientUsername,
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
                return res.json({success:false, msg:"Failed To Save New Conversation."});
              }
              else
                return res.json({success:true, msg:"New Conversation Saved Successfully.", newConversation:savedConversation});
              //
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
                return res.json({success:false, msg:"Failed To Save Message."});
              }
              else
                return res.json({success:true, msg:"Message Saved Successfully.", newConversation:savedConversation});
              //
            }
          );
        }
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
      function(err,obj){console.log(obj);}
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
            ioSockets.emit('changeGetAllUsers', {});
            console.log("\n\nServerEvent: Authentication!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
          }
        );
        // controller.socketUpdateOnline(data.Username, true, );
      }
      else
      {
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
  socketSendMessage:function(socket, data) //(content, RecepientUsername, SenderUsername, next)
  {
    let content = data.Message;
    let recepientUsername = data.Recepient;

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

    let next = function({success, msg})
    {
      if(success)
      {
        userRecepient[0].s.emit('newMessage',{sender:userSender[0].un, message:content});
        console.log("\n\nServerEvent: Active Message!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
      }
      else
      {
        console.log(msg);
        socket.emit('err', msg);
      }
    }
    
    if(userRecepient.length > 0)
    {

      let Username = userSender[0].un;
      let Message =
      {
        Timestamp:new Date(),
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
                  next({success:true, msg:"New Conversation Saved Successfully.", newConversation:savedConversation});
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
    }
    else
    {
      socket.emit("error", "Cannot find recepient.")
    }
  },
  // socketSendMessageGroupUsers:function(socket, data)
  // {
  //   let recepients = JSON.parse(recepients);

  //   recepients.forEach(recepient =>
  //   {
  //     let user = connections.filter
  //     (
  //       function(connectionElement)
  //       {
  //         return connectionElement.un == recepient;
  //       }
  //     );
  //     if(user.length > 0)
  //     {
  //       user[0].s.emit('changeConversation',{sender:data.sender});
  //       console.log("\n\nServerEvent: Active Message!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
  //     }
  //   });
  // },
  socketSendMessageGroup:function(socket, data)
  {
    let ConversationID = data.ConversationID;
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
  
                recepients.forEach(recepient =>
                {
                  let user = connections.filter
                  (
                    function(connectionElement)
                    {
                      return connectionElement.un == recepient;
                    }
                  );
                  if(user.length > 0 && user[0] !== sender)
                  {
                    user[0].s.emit('changeConversation',{sender:sender, message:content, conversationID:ConversationID});
                    console.log("\n\nServerEvent: Active Message!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
                  }
                });
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

  createGroupChat:function(req, res)
  {
    console.log(req.ConversationName);
    console.log("^");
    let conversationName = req.ConversationName;

    let newRoom = new Messages
    (
      {
        ConversationName:conversationName,
        AssociatedUsers:[req.user.Username]
      }
    );

    newRoom.save
    (
      function(err, savedNewRoom)
      {
        if(err)
        {
          console.error(err);
          return res.json({success:false, msg:"Error saving new chat room."});
        }
        else
        {
          // console.log(savedNewRoom);
          // console.log(savedNewRoom._id);

          // console.log("req.user:::::::::::::::::::::::::::::::");
          // console.log(req.user);
          // console.log("req.user.coIDs}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
          // console.log(req.user.ConversationIDs);

          req.user.ConversationIDs.push(savedNewRoom._id);
          req.user.save
          (
            function(err, savedUser)
            {
              if(err)
              {
                console.log(err);
                return res.json({success:false, msg:"Error saving room to user."});
              }
              else
              {
                // savedUser.ConversationIDs.forEach(id => {
                //   console.log("an id here");
                //   console.log(id);
                // });
                // console.log(savedUser.ConversationIDs);
                return res.json({success:true, msg:"New conversation saved.", conversationID:savedNewRoom._id});
              }
            }
          );
        }
      }
    );
  },
  addUsersToChat:function(req,res)
  {
    let ConversationID = req.body.ConversationID;
    let UsersToAdd = JSON.parse(req.body.UsersToAdd); //expected to be an array

    Messages.findOne
    (
      {_id:ConversationID},
      function(err, conversation)
      {
        if(err)
        {
          console.error(err);
          return res.json({success:false, msg:"Error retrieving conversation."});
        }
        else
        {
          // console.log(conversation);
          // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^");
          // console.log(conversation._id);
          // console.log(conversation.AssociatedUsers);
          UsersToAdd.forEach(user => conversation.AssociatedUsers.push(user));
          conversation.save
          (
            function(err, savedConversation)
            {
              if(err)
              {
                console.error(err);
                return res.json({success:false, msg:"Error saving conversation."});
              }
              else
              {
                return res.json({success:true, msg:"Conversation updated.",});
              }
            }
          );
        }
      }
    );
  },
  sendMessageGroup:function(req,res)
  {
    if(!req.body.ConversationID || !req.body.Content)
      return res.json({success:false, msg:"Some input data is missing."});
    let Username = req.user.Username; //"u1"; //req.user.Username;
    let ConversationID = req.body.ConversationID;
    let Message =
    {
      Timestamp:new Date(),
      Content:req.body.Content,
      Sender:Username
    };

    Messages.findOne
    (
      {_id:ConversationID},
      function(err,conversation)
      {
        if(err)
          console.log(err);

        conversation.Messages.push(Message);
        conversation.save
        (
          function(err,savedConversation)
          {
            if(err)
            {
              console.log(err);
              return res.json({success:false, msg:"Failed To Save Message."});
            }
            else
              return res.json({success:true, msg:"Message Saved Successfully.", newConversation:savedConversation});
          }
        );
      }
    );
  },
  // getRecepientsFromID(ConversationID, next) //asynchronous
  // {
    // Messages.findOne
    // (
    //   {_id:ConversationID},
    //   function(err, conversation)
    //   {
    //     if(err)
    //     {
    //       console.error(err);
    //     }
    //     next(conversation.AssociatedUsers);
    //   }
    // );
  // },
  fetchConversationGroup:function(req,res)
  {
    let requesterUsername = req.user.Username; //"u1"; //req.user.Username;
    let ConversationID = req.body.ConversationID;

    Messages.findOne
    (
      {_id:ConversationID},
      function(err,conversation)
      {
        if(err)
          console.log(err);
        if(!conversation)
          return res.json({success:false, msg:"Conversation Not Found"});
        else
        {
          res.json({success:true, conversation:conversation});
        }
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
          return res.json({success:false, msg:"Error adding friend."});
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
  getFriendsAndConversations:function(req,res)
  {
    return res.json({friends:req.user.Friends, conversations:req.user.ConversationIDs});
  },

  socketCallAndRing:function(socket, data, OV)
  {
    let sessionName = data.ConversationID; //need to generate a session name
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
          conversation.AssociatedUsers.forEach(recepient =>
          {
            let user = connections.filter
            (
              function(connectionElement)
              {
                return connectionElement.un == recepient;
              }
            );
            if(user.length > 0 && user[0] !== sender)
            {
              user[0].s.emit('ring',{ConversationID:ConversationID});
              console.log("\n\nServerEvent: Ring!\n" + connections.length + " Authenticated.\n" + countTotalSockets + " Total.");
            }
          });
        }
      );
    }

    if(openviduSessionsMap[ConversationID])
    {
      // Get the existing Session from the collection
      let session = openviduSessionsMap[ConversationID];

      // Generate a new token asynchronously with the recently created tokenOptions
      session.generateToken(tokenOptions).then(token =>
      {
        // Store the new token in the collection of tokens
        openviduSessionNamesTokensMap[ConversationID].push(token);

        socket.emit('openviduToken', { token:token });

        ring();

      }).catch(error => { console.error(error); });
    }
    else
    {
      OV.createSession().then(session =>
      {
        openviduSessionsMap[ConversationID] = session;

        //?
        // Store a new empty array in the collection of tokens
        openviduSessionNamesTokensMap[ConversationID] = [];

        // Generate a new token asynchronously with the recently created tokenOptions
        session.generateToken(tokenOptions).then(token =>
        {
          //?
          // Store the new token in the collection of tokens
          openviduSessionNamesTokensMap[ConversationID].push(token);

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
    var sessionName = data.ConversationID;
    let ConversationID = data.ConversationID;
    var Token = data.token;
    console.log('Removing user | {sessionName, token}={' + sessionName + ', ' + token + '}');

    // If the session exists
    if (openviduSessionsMap[ConversationID] && openviduSessionNamesTokensMap[ConversationID])
    {
        let index = openviduSessionNamesTokensMap[ConversationID].indexOf(token);

        // If the token exists
        if (index !== -1) {
            // Token removed
            openviduSessionNamesTokensMap[ConversationID].splice(index, 1);
            console.log(sessionName + ': ' + openviduSessionNamesTokensMap[ConversationID].toString());
        } else {
            var msg = "Error: the TOKEN wasn't valid";
            console.log(msg);
            socket.emit('err', msg);
        }
        if (openviduSessionNamesTokensMap[ConversationID].length == 0) {
            // Last user left: session must be removed
            console.log(sessionName + ' empty!');
            delete openviduSessionsMap[ConversationID];
        }
        // res.status(200).send();
    }
    else
    {
      var msg = "Error: session does not exist";
      console.log(msg);
      socket.emit('err', msg);
    }
  }
}

module.exports = ControllerFunctions;
