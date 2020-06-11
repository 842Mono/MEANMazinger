var mongoose = require('mongoose');

var MessagesSchema = mongoose.Schema
(
  {
    // ConversationID:
    // {
    //   type:String
    // },
    ConversationName:
    {
      type:String
    },
    AssociatedUsers:
    [
      String
      // {
      //   Username:
      //   {
      //     type:String
      //     // required:true
      //   }
      // }
    ],

    Username1:
    {
      type:String
      // required:true
    },
    Username2:
    {
      type:String
      // required:true
    },
    Messages:
    [
      {
        Timestamp:
        {
          type:Date,
          required:true
        },
        Type:
        {
          type:String,
          enum:["TextMessage", "ImageFileBase64", "WaveMessage", "VideoCallStartTime", "VideoCallEndTime"],
          required:true
        },
        // ImageBase64:
        // {
        //   type:String
        // },
        Content: // In case of TextMessage
        {
          type:String
        },
        VideoCallDuration: // In case of VideoCallEndTime
        {
          type:Date
        },
        Sender:
        {
          type:String,
          required:true
        }
      }
    ]
  },
  { usePushEach: true } // try to remove this workaround. https://github.com/Automattic/mongoose/issues/5574
);

var Messages = mongoose.model("Messages", MessagesSchema);

module.exports = Messages;
