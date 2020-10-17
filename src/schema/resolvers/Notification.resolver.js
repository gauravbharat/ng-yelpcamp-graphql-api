const mongodb = require('mongodb');
const { notificationTypes } = require('../../utils/constants.util');

module.exports = {
  notificationTypeDesc(parent, args, context, info) {
    return notificationTypes.get(parent.notificationType);
  },
  campgroundId(parent, args, context, info) {
    if (!parent.campgroundId) return;
    return context.db
      .collection('campgrounds')
      .findOne({ _id: mongodb.ObjectID(parent.campgroundId) });
  },
  commentId(parent, args, context, info) {
    if (!parent.commentId) return;
    return context.db.collection('comments').findOne({ _id: parent.commentId });
  },
  userId(parent, args, context, info) {
    if (!parent.userId) return;
    return context.db.collection('users').findOne({ _id: parent.userId });
  },
  async follower(parent, args, context, info) {
    if (!parent.follower) return;
    const users = await context.db
      .collection('users')
      .find({
        _id: {
          $in: [parent.follower.id, parent.follower.followingUserId],
        },
      })
      .toArray();

    const follower = await users
      .filter((user) => String(user._id) === String(parent.follower.id))
      .map((user) => {
        return {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      });

    const followingTo = await users
      .filter(
        (user) => String(user._id) === String(parent.follower.followingUserId)
      )
      .map((user) => {
        return {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      });

    return {
      id: {
        ...follower[0],
      },
      followingUserId: {
        ...followingTo[0],
      },
    };
  },
  createdAt(parent, args, context, info) {
    return parent.createdAt.toISOString();
  },
  updatedAt(parent, args, context, info) {
    return parent.updatedAt.toISOString();
  },
};
