const mongodb = require('mongodb');
const {
  matchPassword,
  generateToken,
  getUserId,
  hashPassword,
  getResetPasswordToken,
} = require('../../utils/security.util');
const {
  checkIDValidity,
  validateFields,
} = require('../../utils/validators.util');
const { objectName } = require('../../utils/constants.util');

const CloudinaryAPI = require('../../utils/cloudinary.util');
const EmailHandler = require('../../utils/email.util');

const _checkResetPasswordTokenValidity = async (token, db) => {
  let returnVal = {
    success: false,
    message: 'UNKNOWN ERROR VERIFYING PASSWORD RESET TOKEN',
  };

  if (!token || typeof token !== 'string') {
    returnVal.message =
      'Invalid data format received to reset password. Please contact web administrator.';
    return returnVal;
  }

  try {
    let resetPasswordToken = token;
    const user = await db.collection('users').findOne({ resetPasswordToken });

    if (!user) {
      returnVal.message = 'Password reset token is invalid or has expired.';
      return returnVal;
    }

    let resetPasswordExpires = new Date(user.resetPasswordExpires).getTime();
    const now = new Date().getTime();

    if (now > resetPasswordExpires) {
      resetPasswordToken = null;
      resetPasswordExpires = null;

      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            resetPasswordToken,
            resetPasswordExpires,
          },
        }
      );

      returnVal.message = 'Password reset token is invalid or has expired.';
      return returnVal;
    }

    returnVal.success = true;
    returnVal.message = 'Token verified successfully!';
    return returnVal;
  } catch (error) {
    console.log('_checkResetPasswordTokenValidity error', error);
    returnVal.message = 'Error verifying reset password token!';
    return returnVal;
  }
};

module.exports = {
  async register(parent, { registrationData }, { db }, info) {
    if (!registrationData) {
      throw new Error('Unable to register!');
    }

    let newData = {
      username: validateFields('username', registrationData.username, 'string'),
      email: validateFields('email', registrationData.email, 'string'),
      password: validateFields('password', registrationData.password, 'string'),
      firstName: validateFields(
        'firstName',
        registrationData.firstname,
        'string'
      ),
      lastName: validateFields('lastName', registrationData.lastname, 'string'),
      isAdmin: validateFields('isAdmin', registrationData.isAdmin, 'boolean'),
      isPublisher: validateFields(
        'isPublisher',
        registrationData.isPublisher,
        'boolean'
      ),
      isRequestedAdmin: validateFields(
        'isRequestedAdmin',
        registrationData.isRequestedAdmin,
        'boolean'
      ),
    };

    const usernameExists = await db
      .collection('users')
      .find({ username: registrationData.username })
      .toArray();

    if (usernameExists.length > 0) {
      throw new Error('Please choose a different username!');
    }

    const emailExists = await db
      .collection('users')
      .find({ email: registrationData.email })
      .toArray();

    if (emailExists.length > 0) {
      throw new Error('Please choose a different email!');
    }

    newData.password = await hashPassword(registrationData.password);
    newData = {
      ...newData,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQJS3-GoTF9xqAIyRROWdTD8SUihnSdP5Ac2uPb6AzgGHHyeuuD',
      enableNotifications: {
        newCampground: false,
        newComment: false,
        newFollower: false,
        newCommentLike: false,
      },
      enableNotificationEmails: {
        system: true,
        newCampground: false,
        newComment: false,
        newFollower: false,
      },
      hideStatsDashboard: false,
      followers: [],
      notifications: [],
    };

    try {
      let result = await db.collection('users').insertOne({
        ...newData,
      });

      if (result.ops && result.ops.length > 0) {
        const user = result.ops[0];

        try {
          /** Send a welcome email to the user
           * this process shouldn't block user registration by http error
           */
          EmailHandler.sendEmail({
            process: EmailHandler.PROCESS_NEW_USER,
            textOnly: false,
            emailTo: registrationData.email,
            emailSubject: `Welcome to Angular-YelpCamp!`,
            emailBody: `<div style="width: 60%; margin: 50px auto;">
            <h2>Greetings, ${registrationData.firstname}!</h2>
            <br />
          
            <h3>
              We are glad you chose to be a part of our
              <a href="${process.env.CLIENT_URL}" target="_blank"
                >Angular-YelpCamp community.</a
              >
            </h3>
            <br />
          
            <p>
              Feel free to explore fellow member campgrounds, post your own camps or let
              the members know what you think about their camps!
            </p>
            <br />
          
            <hr />
            <p>For your records, your registration details are -</p>
            <ul>
              <li>@username: ${registrationData.username}</li>
              <li>E-mail: ${registrationData.email}</li>
              <li>First Name: ${registrationData.firstname}</li>
              <li>Last Name: ${registrationData.lastname}</li>
            </ul>
            <h4>
              To manage your information,
              <a href="${process.env.CLIENT_URL}/user/current" target="_blank"
                >click here</a
              >
            </h4>
            <hr />
            <br />
          
            <h3>Warm welcome, and happy camping!!</h3>
            <br />
          
            <h4>Best Regards,</h4>
            <h3>The Angular-YelpCamp Team ⛺️</h3>
          </div>
          `,
          });
        } catch (error) {
          console.log('error sending registration email', error);
        }

        return {
          token: generateToken(user._id),
          expiresIn: process.env.TOKEN_TIMER,
          user,
        };
      } else {
        throw new Error('Server error registering new user!');
      }
    } catch (error) {
      console.log('new user registration error', error);
      throw new Error('Server error registering new user!');
    }
  },
  async login(parent, args, { db }, info) {
    const { username, email, password } = args.credentials;
    let opArgs;

    if (username && username.trim() !== '') {
      opArgs = { username: username.trim() };
    }
    if (email && email.trim() !== '') {
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
      const currentUser = await db
        .collection('users')
        .findOne({ _id: followerUserId });

      // Create new notification if the user that has been followed has set preferences to receive notifications
      if (userToFollow.enableNotifications.newFollower) {
        try {
          let result = await db.collection('notifications').insertOne({
            username: currentUser.username,
            follower: {
              id: currentUser._id,
              followerAvatar: currentUser.avatar,
              followingUserId: userToFollowId,
            },
            notificationType: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
            isRead: false,
            isCommentLike: false,
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

      // check that user opted to receive new follower emails
      if (userToFollow.enableNotificationEmails.newFollower) {
        // send password reset link to user
        await EmailHandler.sendEmail({
          process: EmailHandler.PROCESS_NEW_FOLLOWER,
          textOnly: false,
          emailTo: userToFollow.email,
          emailSubject: `Angular-YelpCamp: Your have a new follower!`,
          emailBody: `
            <div style="width: 60%; margin: 50px auto;">
              <h2>Hey, ${userToFollow.firstName}!</h2>
              <br />

              <h2>
                You have a new follower -
              </h2>
              <br />
              <hr />
              <div>
                <span style="display: flex; justify-content: flex-start;">
                  <img
                    style="
                      width: 100px;
                      height: 100px;
                      object-fit: cover;
                      overflow: hidden;
                      border-radius: 50%;
                    "
                    src="${currentUser.avatar}"
                    alt="${currentUser.username}"
                  />
                  &nbsp;&nbsp;
                  <h2>${currentUser.username}</h2>
                </span>
              </div>
              <hr />
              <br />

              <h4>
                To see complete user profile,
                <a
                  href="${process.env.CLIENT_URL}/user/other/${currentUser._id}"
                  target="_blank"
                  >click here</a
                >
              </h4>
              <h4>
                To see all notifications,
                <a href="${process.env.CLIENT_URL}/user/notifications" target="_blank"
                  >click here</a
                >
              </h4>
              <h4>
                To manage notifications,
                <a href="${process.env.CLIENT_URL}/user/current" target="_blank"
                  >click here</a
                >
              </h4>
              <br />

              <h4>Happy camping, and keep posting!</h4>

              <h4>Best Regards,</h4>
              <h3>The Angular-YelpCamp Team ⛺️</h3>
          </div>`,
        });
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
  async updateUserSettings(parent, { userData }, { request, db }, info) {
    // Authentication requred
    const userId = getUserId(request);

    const firstName = userData.firstname.trim();
    const lastName = userData.lastname.trim();
    const email = userData.email.trim();

    if (!firstName || !lastName || !email) {
      throw new Error('Invalid input received!');
    }

    let { result } = await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          firstName,
          lastName,
          email,
          hideStatsDashboard: userData.hideStatsDashboard,
          'enableNotifications.newCampground':
            userData.enableNotifications.newCampground,
          'enableNotifications.newComment':
            userData.enableNotifications.newComment,
          'enableNotifications.newFollower':
            userData.enableNotifications.newFollower,
          'enableNotifications.newCommentLike':
            userData.enableNotifications.newCommentLike,
          'enableNotificationEmails.newCampground':
            userData.enableNotificationEmails.newCampground,
          'enableNotificationEmails.newComment':
            userData.enableNotificationEmails.newComment,
          'enableNotificationEmails.newFollower':
            userData.enableNotificationEmails.newFollower,
        },
      }
    );

    if (result.n > 0) {
      return 'User settings updated!';
    } else {
      throw new Error('User settings update failed!');
    }
  },
  async createResetToken(parent, args, { db }, info) {
    if (!args.email || args.email.trim() === '') {
      throw new Error('Invalid email for reset password');
    }

    const user = await db.collection('users').findOne({ email: args.email });
    if (user) {
      try {
        const resetPasswordToken = await getResetPasswordToken();
        const resetPasswordExpires = new Date().getTime() + 3600000; // 1 hour

        await db
          .collection('users')
          .updateOne(
            { _id: user._id },
            { $set: { resetPasswordToken, resetPasswordExpires } }
          );

        // send password reset link to user
        await EmailHandler.sendEmail({
          process: EmailHandler.PROCESS_RESET_PASSWORD_TOKEN_REQUEST,
          textOnly: true,
          emailTo: args.email,
          emailSubject: `Angular-YelpCamp: Password Reset`,
          emailBody: `You are receiving this because you (or someone else) have requested the reset of the Angular-YelpCamp password. \n\n
        Please click on the following link, or paste this into your browser to complete the process - \n 
        ${process.env.CLIENT_URL}/auth/reset/${resetPasswordToken}\n\n
        If you did not request this, please ignore this email and your Angular-YelpCamp password will remain unchanged.\n 
        The Angular-YelpCamp Team`,
        });

        return {
          message: 'Password reset link sent to user email address!',
        };
      } catch (error) {
        console.log('createResetToken error', error);
        throw new Error('Error initiating reset password process!');
      }
    } else {
      return {
        message:
          'If your email is found valid, you shall have a password reset token emailed soon!',
      };
    }
  },
  async verifyResetToken(parent, args, { db }, info) {
    const { success, message } = await _checkResetPasswordTokenValidity(
      args.token,
      db
    );

    if (!success) {
      throw new Error(message);
    }

    return message;
  },
  async resetPassword(parent, args, { db }, info) {
    let returnVal = 'UNKNOWN ERROR COMPLETING RESET PASSWORD PROCESS';

    if (!args.newPassword || args.newPassword.trim() === '') {
      throw new Error('Invalid input for reset password');
    }

    const { success, message } = await _checkResetPasswordTokenValidity(
      args.token,
      db
    );

    if (!success) {
      throw new Error(message);
    }

    const password = await hashPassword(args.newPassword);
    let user;

    try {
      user = await db
        .collection('users')
        .findOne({ resetPasswordToken: args.token });

      const { result } = await db
        .collection('users')
        .updateOne({ resetPasswordToken: args.token }, { $set: { password } });

      if (result.n > 0) {
        returnVal = 'Password reset! Please login with your new password.';
      } else {
        throw new Error('DB Server error resetting password!');
      }
    } catch (error) {
      console.log('resetPassword error', error);
      throw new Error('Error completing reset password process!');
    }

    if (user) {
      try {
        // send password reset success to user, without sending any http error back on email service malfunction
        await EmailHandler.sendEmail({
          process: EmailHandler.PROCESS_RESET_PASSWORD_CONFIRMATION,
          textOnly: true,
          emailTo: user.email,
          emailSubject: `Angular-YelpCamp: Your password has been changed`,
          emailBody: `Hello ${user.username},\n\n
              This is a confirmation that the password for your account ${user.email} has just changed.\n
              
              *** In case you have not requested this change, please contact Angular-YelpCamp immediately on support@veerappa.co ***\n
              
              The Angular-YelpCamp Team`,
        });
      } catch (error) {
        console.log('email send password reset', error);
      }
    }

    return returnVal;
  },
};
