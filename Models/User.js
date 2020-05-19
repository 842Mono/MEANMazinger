var mongoose = require('mongoose');
var validators = require('../validationFunctions');
var bcrypt = require('bcryptjs');

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
    },

    ConversationIDs:
    [
        String
        // {
        //   ConversationID:
        //   {
        //     type:String
        //   }
        // }
    ],
    Friends:
    [
      {
        // type:Schema.Types.ObjectId,
        // ref: 'User',
        type:String,
        validate:
        {
          validator: function(value)
          {
            return new Promise(function(resolve, reject)
            {
              mongoose.model('User').findOne({Username:value}, function(err, result)
              {
                if(err)
                  console.error(err);
                if(result)
                {
                  return resolve(true);
                }
                else
                  return reject(new Error("User not found"));
              })
            })
          }
        }
      }
    ]
  },
  { usePushEach: true } // try to remove this workaround. https://github.com/Automattic/mongoose/issues/5574
);

UserSchema.methods.comparePassword = function(pw, cb)
{
  console.log("pw\n" + pw);
  console.log("this.password\n" + this.Password);
  bcrypt.compare
  (
    pw,
    this.Password,
    function(err, isMatch)
    {
      if(err)
      {
        return cb(err);
      }
      cb(null, isMatch);
    }
  );
};

var User = mongoose.model("User", UserSchema);

module.exports = User;

module.exports.createUser = function(newUser, callback)
{
  console.log("newUser incoming\n" + newUser);
	bcrypt.genSalt
  (
    10,
    function(err, salt)
    {
	    bcrypt.hash
      (
        newUser.Password,
        salt,
        function(err, hash)
        {
	        newUser.Password = hash;
          console.log("hash incoming");
          console.log(hash);
	        newUser.save(callback);
        }
      );
    }
  );
}

module.exports.comparePasswordOld = function(candidatePassword, hash, callback)
{
	bcrypt.compare
  (
    candidatePassword,
    hash,
    function(err, isMatch)
    {
    	if(err)
        throw err;
    	callback(null, isMatch);
    }
  );
}
