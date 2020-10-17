const {
  matchPassword,
  generateToken,
  getUserId,
  hashPassword,
} = require('../../utils/security.util');
const { checkIDValidity } = require('../../utils/validators.util');
const { objectName } = require('../../utils/constants.util');
const mongodb = require('mongodb');
const CloudinaryAPI = require('../../utils/cloudinary.util');

module.exports = {
  async login(parent, args, { db }, info) {
    const { username, email, password } = args.credentials;
    let opArgs;

    if (username && username.trim()) {
      opArgs = { username: username.trim() };
    }
    if (email && email.trim()) {
      opArgs = { email: email.trim() };
    }

    if (!opArgs || !password) {
      throw new Error('Unable to login!');
    }

    const user = await db.collection('users').findOne(opArgs);

    if (!user) {
      throw new Error('Unable to login!');
    }

    const isValidPassword = await matchPassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('Unable to login!');
    }

    return {
      token: generateToken(user._id),
      expiresIn: process.env.TOKEN_TIMER,
      user,
    };
  },
  async toggleFollowUser(parent, args, { request, db }, info) {
    const followerUserId = getUserId(request);

    if (!args.userToFollowId) {
      throw new Error('Information on user to follow is required');
    }

    const userToFollowId = checkIDValidity(
      args.userToFollowId,
      objectName.USER
    );

    let action;

    const userToFollow = await db
      .collection('users')
      .findOne({ _id: userToFollowId });

    if (!userToFollow) {
      throw new Error('Error fetching details for the user to follow!');
    }

    if (args.follow) {
      action = { $push: { followers: followerUserId } };
    } else {
      /** If current user unfollows a fellow user =>
       * fetch fellow user notifications
       * filter to select only those where current user id matches with that of the follower
       * delete such notifications
       * pull out from notifications array of fellow user
       */
      action = { $pullAll: { followers: [followerUserId] } };

      const notifications = await db
        .collection('notifications')
        .find({
          'follower.id': followerUserId,
          'follower.followingUserId': userToFollowId,
        })
        .toArray();

      if (notifications && notifications.length > 0) {
        // Notifications of same user following, including any dups
        let followNotificationIds = await notifications.map((notification) => {
          return mongodb.ObjectID(notification._id);
        });

        await db.collection('notifications').deleteMany({
          _id: {
            $in: followNotificationIds,
          },
        });

        action = {
          $pullAll: {
            followers: [followerUserId],
            notifications: [...followNotificationIds],
          },
        };

        /** Take this opportunity to pull-out those notification ids which does not exist */
        if (userToFollow.notifications.length > 0) {
          const notifications = await db
            .collection('notifications')
            .find({
              _id: {
                $in: userToFollow.notifications,
              },
            })
            .toArray();

          let validNotifications = await notifications.map((notification) =>
            String(notification._id)
          );

          if (userToFollow.notifications.length > validNotifications.length) {
            let deadNotificationIds = await userToFollow.notifications.filter(
              (un) => !validNotifications.includes(String(un))
            );

            // Remove dead-ref notifications
            if (deadNotificationIds && deadNotificationIds.length > 0) {
              await db.collection('users').updateOne(
                { _id: userToFollowId },
                {
                  $pullAll: {
                    notifications: [...deadNotificationIds],
                  },
                }
              );
            }
          }
        }
      }
    }

    const { result } = await db
      .collection('users')
      .updateOne({ _id: userToFollowId }, action);

    let message;
    if (result.n > 0) {
      message = `User ${args.follow ? 'followed' : 'unfollowed'} successfully!`;
    } else {
      throw new Error(
        `Unknown error ${args.follow ? 'following' : 'unfollowing'} user!`
      );
    }

    if (args.follow) {
      // Create new notification if the user that has been followed has set preferences to receive notifications
      if (userToFollow.enableNotifications.newFollower) {
        try {
          const currentUser = await db
            .collection('users')
            .findOne({ _id: followerUserId });

          let result = await db.collection('notifications').insertOne({
            username: currentUser.username,
            follower: {
              id: currentUser._id,
              followerAvatar: currentUser.avatar,
              followingUserId: userToFollowId,
            },
            notificationType: 3,
          });

          if (result.ops && result.ops.length > 0) {
            const pushResult = await db.collection('users').updateOne(
              { _id: userToFollowId },
              {
                $push: { notifications: mongodb.ObjectID(result.ops[0]._id) },
              }
            );
          }
        } catch (error) {
          console.log(
            'Error creating follower notification for the user!',
            error
          );
          throw new Error('Error creating follower notification for the user!');
        }
      }
    }

    return message;
  },
  async updateUserAvatar(parent, args, { request, db }, info) {
    let message = '';
    const userId = getUserId(request);
    const user = await db.collection('users').findOne({ _id: userId });

    if (!user) {
      throw new Error('Error fetching current user data!');
    }

    const oldImageUrl = user.avatar;
    const newImageUrl = args.avatar.trim();

    if (!newImageUrl) {
      throw new Error('Invalid url for new user avatar image!');
    }

    try {
      const uploadResult = await CloudinaryAPI.cloudinary.v2.uploader.upload(
        newImageUrl,
        {
          folder: 'avatars',
        }
      );
      const avatar = uploadResult.secure_url;

      let { result } = await db.collection('users').updateOne(
        { _id: userId },
        {
          $set: { avatar },
        }
      );

      if (result.n > 0) {
        if (oldImageUrl && oldImageUrl.includes('res.cloudinary.com')) {
          // Don't keep the user waiting for the old image to be deleted
          CloudinaryAPI.cloudinary.v2.uploader.destroy(
            'avatars/' + CloudinaryAPI.getCloudinaryImagePublicId(oldImageUrl)
          );

          await db
            .collection('comments')
            .updateMany(
              { 'author.id': userId },
              { $set: { 'author.avatar': avatar } }
            );

          await db.collection('comments').updateMany(
            {
              likes: {
                $elemMatch: {
                  id: userId,
                },
              },
            },
            {
              $set: {
                'likes.$.avatar': avatar,
              },
            }
          );

          await db
            .collection('notifications')
            .updateMany(
              { 'follower.id': userId },
              { $set: { 'follower.followerAvatar': avatar } }
            );
        }
        message = 'User avatar updated!';
      } else {
        message = 'user avatar update failed!';
      }
    } catch (error) {
      console.log('Error updating user avatar!', error);
      throw new Error('Error updating user avatar!');
    }

    return message;
  },
  async updateUserPassword(parent, args, { request, db }, info) {
    let message = 'Error updating password!';
    const userId = getUserId(request);

    const oldPassword = args.oldPassword.trim();
    const newPassword = args.newPassword.trim();
    if (!oldPassword || !newPassword) {
      throw new Error(message);
    }
    const hashedPassword = await hashPassword(newPassword);

    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      throw new Error(message);
    }

    const isMatch = await matchPassword(oldPassword, user.password);
    if (!isMatch) {
      throw new Error(message);
    }

    try {
      let { result } = await db.collection('users').updateOne(
        { _id: userId },
        {
          $set: { password: hashedPassword },
        }
      );

      if (result.n > 0) {
        return 'Password changed!';
      }
    } catch (error) {
      console.log('Error updating user password', error);
      throw new Error(
        'Server error updating password, please try again after some time or contact administrator!'
      );
    }

    return message;
  },
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
