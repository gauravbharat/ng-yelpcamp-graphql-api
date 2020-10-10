const mongodb = require('mongodb');
const { checkIDValidity, escapeRegex } = require('../../utils/validators.util')
const { objectName, sortOrder } = require('../../utils/constants.util');

module.exports = {
  async user(parent, args, context, info) {
    if(!args._id) {
      throw new Error('User ID is required')
    }

    const opArgs = {
      _id: checkIDValidity(args._id, objectName.USER)
    }

    return await context.db.collection('users').findOne(opArgs);
  },
  async users(parent, args, context, info) {
    let searchObject = context.db.collection('users').find();
    if(args.pagination) {
      if(args.pagination.skip) { searchObject = searchObject.skip(args.pagination.skip) }
      if(args.pagination.limit) { searchObject = searchObject.limit(args.pagination.limit) }
    }

    // console.log(context.request.req.headers.authorization);
    return await searchObject.toArray();
  },
  async campground(parent, args, context, info) {
    if(!args._id) {
      throw new Error('Campground ID is required')
    }

    // Search based on the campgroundId passed
    const opArgs = {
      _id: checkIDValidity(args._id, objectName.CAMPGROUND)
    }

    return context.db.collection('campgrounds').findOne(opArgs);
  },
  async campgrounds(parent, args, context, info) {
    let opArgs = {};

    // Search / Filter based on the query sting passed
    if(args.query) {
      const regex = new RegExp(escapeRegex(args.query), 'gi');
      opArgs = { 
        $or: [ 
          { name: regex }, 
          { location: regex }, 
          { 'country.Country_Name': regex }, 
          { 'country.Continent_Name': regex }, ] 
      }
    }

    let searchObject = context.db.collection('campgrounds').find(opArgs);

    if(args.pagination && args.pagination.sort) {
      const sortOptions = args.pagination.sort.split('_');
      searchObject.sort([[sortOptions[0], sortOrder[sortOptions[1]]]]);
    } else {
      // By default, sort camps in descending order of last updated
      searchObject.sort([['updatedAt', -1]]);
    }
    
    if(args.pagination) {
      args.pagination.skip && searchObject.skip(args.pagination.skip);
      args.pagination.limit && searchObject.limit(args.pagination.limit);
    }

    return await searchObject.toArray();
  },
  async amenities(parent, args, context, info) {
    return await context.db.collection('amenities').find().toArray();
  },
  async comments(parent, args, context, info) {
    if(!args.authorId) {
      throw new Error('Comment author is required')
    }

    args.authorId = checkIDValidity(args.authorId, objectName.COMMENT)
    return await context.db.collection('comments').find({'author.id': args.authorId}).toArray();
  }
};
