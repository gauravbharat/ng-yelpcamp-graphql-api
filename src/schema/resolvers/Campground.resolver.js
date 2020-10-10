const { Db } = require("mongodb")

module.exports = {
  amenities(parent, args, context, info) {
    if(parent.amenities.length === 0) {
      return []
    } 

    return context.db.collection('amenities').find({
      _id: {
        $in: parent.amenities
      }
    }).toArray();
  },
  comments(parent, args, context, info) {
    if(parent.comments.length === 0) {
      return [];
    }

    return context.db.collection('comments').find({
      _id: {
        $in: parent.comments
      }
    }).toArray();
  }
}