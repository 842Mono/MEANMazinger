var User = require('./Models/User');
var Messages = require('./Models/Messages');

let ControllerFunctions =
{
  register:function(req,res)
  {
    //req.checkBody('firstName', 'FirstName is required').notEmpty();
    //req.checkBody('firstName', 'FirstName is required').notEmpty();
    req.checkBody('lastName', 'LastName is required').notEmpty();
    if(!req.Username || !req.Password)
      return req.json({success:false, msg:"Missing Required Inputs"});

    let partialUser = {Username:req.Username, Password:req.Password};

    if(req.FirstName)
      partialUser.FirstName = req.FirstName;
    if(req.MiddleName)
      partialUser.MiddleName = req.MiddleName;
    if(req.LastName)
      partialUser.LastName = req.LastName;
    if(req.DateOfBirth)
      partialUser.DateOfBirth = req.DateOfBirth;
    if(req.Email)
      partialUser.Email = req.Email;

    let newUser = new User(partialUser);
    newUser.save
    (
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
          return res.json({success:false, msg:"User Saved Successfully"});
        }
      }
    );
  },
  login:function(req,res)
  {

  },
  sendMessage:function(req,res)
  {
    let Username = "u1";

    let RecepientUsername = "r1";
    let Message =
    {
      Timestamp:new Date(),
      Content:"test message"
    };

    Messages.findOne
    (
      {
        $or:[{Username1:Username, Username2:RecepientUsername},{Username1:RecepientUsername, Username2:Username}]
      },
      function(err,conversation)
      {
        if(err)
          console.log(err);
        /*if(Object.keys(obj).length == 0)
        {
          let newConversation =
          {
            Username1:Username,
            Username2:RecepientUsername,
            Messages:[Message]
          };
        }
        else
        {

        }*/
      }
    );
  }
}

module.exports = ControllerFunctions;
