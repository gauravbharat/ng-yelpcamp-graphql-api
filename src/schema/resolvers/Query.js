module.exports = {
  async users(parent, args, context, info) {
    const data = await context.db.collection('users').find().limit(2).toArray();

    return data;

    return [
      {
        username: 'gaurav',
        email: 'gaurav@veerappa.co',
        firstName: 'Gaurav',
        lastName: 'Mendse',
      },
    ];
  },
};
