const userMutations = require('../resolvers/user.mutation');
const notificationMutations = require('../resolvers/notification.mutation');

module.exports = {
  ...userMutations,
  ...notificationMutations,
};
