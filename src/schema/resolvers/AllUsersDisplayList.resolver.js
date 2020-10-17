const { getUserId } = require('../../utils/security.util');

module.exports = {
  async totalCampgrounds(parent, args, { request, db }, info) {
    const count = await db
      .collection('campgrounds')
      .countDocuments({ 'author.id': parent._id });

    return count | 0;
  },
  async totalComments(parent, args, { db }, info) {
    const count = await db
      .collection('comments')
      .countDocuments({ 'author.id': parent._id });

    return count | 0;
  },
  async totalRatings(parent, args, { db }, info) {
    const count = await db
      .collection('ratings')
      .countDocuments({ 'author.id': parent._id });

    return count | 0;
  },
};
