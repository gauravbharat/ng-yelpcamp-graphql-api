module.exports = {
  author(parent, args, context, info) {
    /** Return author.id as User type _id, for correct mapping */
    return {
      _id: parent.author.id,
      username: parent.author.username,
      avatar: parent.author.avatar,
    };
  },
  likes(parent, args, context, info) {
    /** Return likes.id as User type _id, for correct mapping */
    if (parent.likes.length === 0) {
      return [];
    }

    return parent.likes.map((like) => {
      return {
        _id: like.id,
        username: like.username,
        avatar: like.avatar,
      };
    });
  },
  // createdAt(parent, args, context, info) {
  //   return parent.createdAt.toISOString();
  // },
  // updatedAt(parent, args, context, info) {
  //   return parent.updatedAt.toISOString();
  // },
};
