module.exports = {
  password(parent, args, context, info) {
    return '👻 ACCESS DENIED';
  },
  followers(parent, args, context, info) {
    if(parent.followers.length === 0) {
      return []
    }

    return context.db.collection('users').find({
      _id: {
        $in: parent.followers
      }
    }).toArray();
  },
  notifications(parent, args, context, info) {
    if(parent.notifications.length === 0) {
      return []
    }

    return context.db.collection('notifications').find({
      _id: {
        $in: parent.notifications
      }
    }).toArray();
  }
};
