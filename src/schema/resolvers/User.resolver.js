const { getUserId } = require('../../utils/security.util');

module.exports = {
  password(parent, args, context, info) {
    return '👻 ACCESS DENIED';
  },
  followers(parent, args, context, info) {
    if (parent.followers.length === 0) {
      return [];
    }

    // // Require user to be authenticated / logged-in
    // const loggedUserId = getUserId(context.request);
    // // Only return for the authenticated user, AND his own data
    // if(String(loggedUserId) !== String(parent._id)) {
    //   return []
    // }

    return context.db
      .collection('users')
      .find({
        _id: {
          $in: parent.followers,
        },
      })
      .toArray();
  },
  notifications(parent, args, context, info) {
    if (parent.notifications.length === 0) {
      return [];
    }

    // // Require user to be authenticated / logged-in
    // const loggedUserId = getUserId(context.request);
    // // Only return for the authenticated user, AND his own data
    // if(String(loggedUserId) !== String(parent._id)) {
    //   return []
    // }

    return context.db
      .collection('notifications')
      .find({
        _id: {
          $in: parent.notifications,
        },
      })
      .toArray();
  },
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
