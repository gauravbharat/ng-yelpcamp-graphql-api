module.exports = {
  campgroundId(parent, args, context, info) {
    return context.db.collection('campgrounds').findOne({ _id: parent.campgroundId });
  },
  author(parent, args, context, info) {
    /** Return author.id as User type _id, for correct mapping */
    return {
      _id: parent.author.id,
      username: parent.author.username
    }
  }
}