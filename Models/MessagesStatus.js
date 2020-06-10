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
    // Type:
    // {
    //   type:String,
    //   enum:["Sent", "Delivered", "Seen"]
    // },
    // Date:
    // {
    //   type:Date
    // },
    DeliveredTo:
    [
      {
        Username:
        {
          type:String
        },
        Date:
        {
          type:Date
        }
      }
    ],
    SeenBy:
    [
      {
        Username:
        {
          type:String
        },
        Date:
        {
          type:Date
        }
      }
    ]
  },
  { usePushEach: true } // try to remove this workaround. https://github.com/Automattic/mongoose/issues/5574
);

var MessagesStatus = mongoose.model("MessagesStatus", MessagesStatusSchema);

module.exports = MessagesStatus;
