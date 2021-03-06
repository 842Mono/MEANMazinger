var User = require('./Models/User');
var Messages = require('./Models/Messages');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./Models/User');
var jwt = require('jsonwebtoken');
const config = require('./secret');

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
          return res.json({success:false, msg:"Error Saving User. Please Try Again"});
        }
        else
        {
          console.log(savedUser);
          return res.json({success:true, msg:"User Saved Successfully"});
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
    console.log(req.body);
    if(!req.body.requiredUsername)
      return res.json({success:false, msg:"No Required Username"});
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
      return res.json({success:false, msg:"Some input data missing"});
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
  socketUpdateOnline:function(user,status,next)
  {
    User.update
    (
      { Username:user },
      { $set: { Online:status }},
      next
    );
  },
  initClearOnline:function()
  {
    User.update
    (
      {Online:true},
      { $set: { Online:false }},
      {multi: true},
      function(err,obj){console.log(obj);}
    );
  }
}

module.exports = ControllerFunctions;
