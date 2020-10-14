const { Db } = require('mongodb');

module.exports = {
  country(parent, args, context, info) {
    return {
      ...parent.country,
      _id: parent.country.id,
    };
  },
  amenities(parent, args, context, info) {
    if (parent.amenities.length === 0) {
      return [];
    }

    return context.db
      .collection('amenities')
      .find({
        _id: {
          $in: parent.amenities,
        },
      })
      .toArray();
  },
  async comments(parent, args, context, info) {
    if (parent.comments.length === 0) {
      return [];
    }

    const comments = await context.db
      .collection('comments')
      .find({
        _id: {
          $in: parent.comments,
        },
      })
      .toArray();

    return await comments.map((comment) => {
      return {
        ...comment,
        updatedAt: comment.updatedAt.toISOString(),
      };
    });
  },
  author(parent, args, context, info) {
    /** Return author.id as User type _id, for correct mapping */
    return {
      _id: parent.author.id,
      username: parent.author.username,
    };
  },
};
