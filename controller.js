var User = require('./Models/User');
var Messages = require('./Models/Messages');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./Models/User');
var jwt = require('jsonwebtoken');
const config = require('./secret');

let ControllerFunctions =
{
  register:function(req,res)
  {
    //req.body.checkBody('firstName', 'FirstName is required').notEmpty();
    //req.body.checkBody('firstName', 'FirstName is required').notEmpty();
    console.log(req);
    if(!req.body.Username || !req.body.Password)
      return res.json({success:false, msg:"Missing Required Inputs"});

    let partialUser = {Username:req.body.Username, Password:req.body.Password};

    if(req.body.FirstName)
      partialUser.FirstName = req.body.FirstName;
    if(req.body.MiddleName)
      partialUser.MiddleName = req.body.body.MiddleName;
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
          return res.json({success:true, msg:"User Saved Successfully"});
        }
      }
    );
  },
  login:function(req,res)
  {

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
          res.status(401).json({ success: false, message: 'User not found.' });
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
                res.status(200).json({ success: true, token: 'JWT ' + token });
              }
              else
              {
                res.status(401).json({ success: false, message: 'Authentication failed. Passwords did not match.' });
              }
            }
          );
        }
      }
    );
  },
  sendMessage:function(req,res)
  {
    let Username = "serd usar"; //from session or passport

    let RecepientUsername = req.body.RecepientUsername;
    let Message =
    {
      Timestamp:new Date(),
      Content:req.body.Content
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
                return res.json({success:true, msg:"New Conversation Saved Successfully."});
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
                return res.json({success:true, msg:"Message Saved Successfully."});
              //
            }
          );
        }
      }
    );
  }
}

module.exports = ControllerFunctions;
