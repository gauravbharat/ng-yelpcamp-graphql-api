const { getUserId } = require('../../utils/security.util');
const { checkIDValidity } = require('../../utils/validators.util');
const { objectName } = require('../../utils/constants.util');

module.exports = {
  async updateNotification(parent, args, { request, db }, info) {
    // Authentication requred
    const loggedUserId = getUserId(request);

    if (!Array.isArray(args.notificationIdArr)) {
      throw new Error('Invalid input for updating user notifications!');
    }

    const notificationIds = args.notificationIdArr.map((id) =>
      checkIDValidity(id, objectName.NOTIFICATION)
    );

    try {
      const { result } = await db.collection('notifications').updateMany(
        {
          _id: {
            $in: notificationIds,
          },
        },
        { $set: { isRead: args.isSetRead } }
      );

      if (result.n > 0) {
        if (result.n === notificationIds.length) {
          return 'Notifications updated!';
        } else {
          return 'Some notifications may not be updated due to them not found in records!';
        }
      } else {
        throw new Error('Error updating user notifications!');
      }
    } catch (error) {
      console.log('notifications update error', error);
      throw new Error('GraphQL server error updating notifications!');
    }
  },
  async deleteNotification(parent, args, { request, db }, info) {
    // Authentication requred
    const loggedUserId = getUserId(request);

    if (!Array.isArray(args.notificationIdArr)) {
      throw new Error('Invalid input for updating user notifications!');
    }

    const notificationIds = args.notificationIdArr.map((id) =>
      checkIDValidity(id, objectName.NOTIFICATION)
    );

    try {
      await db.collection('notifications').deleteMany({
        _id: {
          $in: notificationIds,
        },
      });
    } catch (error) {
      console.log('notifications delete error', error);
      throw new Error('GraphQL server error deleting notifications!');
    }
  },
};
