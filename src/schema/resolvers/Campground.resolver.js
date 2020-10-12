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
  },
  author(parent, args, context, info) {
    /** Return author.id as User type _id, for correct mapping */
    return {
      _id: parent.author.id,
      username: parent.author.username
    }
  }
}