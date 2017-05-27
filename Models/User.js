var mongoose = require('mongoose');
var validators = require('../validationFunctions');



var UserSchema = mongoose.Schema
(
  {
    Username:
    {
      type:String,
      required:true,
      unique:true,
      index:true
    },
    Password:
    {
      type:String,
      required:true
    },
    Online:
    {
      type:Boolean,
      default:false
    },

    FirstName:
    {
      type:String
    },
    MiddleName:
    {
      type:String
    },
    LastName:
    {
      type:String
    },
    DateOfBirth:
    {
      type:Date,
      validate:[{validator:validators.birthDateValidation,msg:'Invalid Age'}]
    },
    Email:
    {
      type:String,
      unique:true,
      sparse:true
    }
  }
);

var User = mongoose.model("User",UserSchema);

module.exports = User;

module.exports.createUser = function(newUser, callback)
{
	bcrypt.genSalt
  (
    10,
    function(err, salt)
    {
	    bcrypt.hash
      (
        newUser.password,
        salt,
        function(err, hash)
        {
	        newUser.password = hash;
	        newUser.save(callback);
        }
      );
    }
  );
}
