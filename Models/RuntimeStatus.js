var mongoose = require('mongoose');

var RuntimeStatusSchema = mongoose.Schema
(
  {
    OnlineUsers:
    {
      type:[String]
    }
  }
);

var RuntimeStatus = mongoose.model("RuntimeStatus",RuntimeStatusSchema);

module.exports = RuntimeStatus;
