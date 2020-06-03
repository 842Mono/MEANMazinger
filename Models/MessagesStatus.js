var mongoose = require('mongoose');

var MessagesStatusSchema = mongoose.Schema
(
  {
    ConversationID:
    {
        type:String,
        unique:true,
        index:true
    },
    Type:
    {
        type:String,
        enum:["Sent", "Delivered", "Seen"]
    },
    Date:
    {
        type:Date
    }
  }
);

var MessagesStatus = mongoose.model("MessagesStatus", MessagesStatusSchema);

module.exports = MessagesStatus;
