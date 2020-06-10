var mongoose = require('mongoose');

var RuntimeStatusSchema = mongoose.Schema
(
  {
    OnlineUsers:
    {
      type:[String]
    }
  },
  { usePushEach: true } // try to remove this workaround. https://github.com/Automattic/mongoose/issues/5574
);

var RuntimeStatus = mongoose.model("RuntimeStatus",RuntimeStatusSchema);

module.exports = RuntimeStatus;
