const { getUserId } = require('../../utils/security.util');

module.exports = {
  password(parent, args, context, info) {
    return '👻 ACCESS DENIED';
  },
  async followers(parent, args, context, info) {
    if (parent.followers.length === 0) {
      return [];
    }

    return await context.db
      .collection('users')
      .find({
        _id: {
          $in: parent.followers,
        },
      })
      .toArray();
  },
  async notifications(parent, args, context, info) {
    if (parent.notifications.length === 0) {
      return [];
    }

    return await context.db
      .collection('notifications')
      .find({
        _id: {
          $in: parent.notifications,
        },
      })
      .toArray();
  },
  // createdAt(parent, args, context, info) {
  //   return parent.createdAt.toISOString();
  // },
  // updatedAt(parent, args, context, info) {
  //   return parent.updatedAt.toISOString();
  // },
  //   /** Restrict fields to authenticated user AND to user's own records */
  //   enableNotifications(parent, args, context, info) {
  //     if(!parent.enableNotifications) return;
  //     const loggedUserId = getUserId(context.request);
  //      if(String(loggedUserId) !== String(parent._id)) {
  //       return
  //     }
  //     return parent.enableNotifications;
  //   },
  //   enableNotificationEmails(parent, args, context, info) {
  //     if(!parent.enableNotificationEmails) return;
  //     const loggedUserId = getUserId(context.request);
  //     if(String(loggedUserId) !== String(parent._id)) {
  //      return
  //    }
  //    return parent.enableNotificationEmails;
  //  },
  //  hideStatsDashboard(parent, args, context, info) {
  //   if(!parent.hideStatsDashboard) return;
  //   const loggedUserId = getUserId(context.request);
  //   if(String(loggedUserId) !== String(parent._id)) {
  //    return
  //  }
  //  return parent.hideStatsDashboard;
  // },
  // isAdmin(parent, args, context, info) {
  //   if(!parent.isAdmin) return;
  //   const loggedUserId = getUserId(context.request);
  //   if(String(loggedUserId) !== String(parent._id)) {
  //    return
  //  }
  //  return parent.isAdmin;
  // },
};
