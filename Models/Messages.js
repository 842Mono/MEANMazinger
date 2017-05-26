var mongoose = require('mongoose');

var MessagesSchema = mongoose.Schema
(
  {
    Username1:
    {
      type:String,
      required:true
    },
    Username2:
    {
      type:String,
      required:true
    },
    Messages:
    [
      {
        Timestamp:
        {
          type:Date,
          required:true
        },
        Content:
        {
          type:String,
          required:true
        }
      }
    ]
  }
);

var Messages = mongoose.model("Messages", MessagesSchema);

module.exports = Messages;
