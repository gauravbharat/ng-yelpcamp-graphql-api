const { ApolloServer, gql } = require('apollo-server');
const { MongoClient } = require('mongodb');

const typeDefs = require('./schema/typeDefs');
const Query = require('./schema/resolvers/Query');
const Mutation = require('./schema/resolvers/Mutation');
const User = require('./schema/resolvers/User.resolver');
const Campground = require('./schema/resolvers/Campground.resolver');
const Comment = require('./schema/resolvers/Comment.resolver');
const Rating = require('./schema/resolvers/Rating.resolver');
const Notification = require('./schema/resolvers/Notification.resolver');
const AllUsersDisplayList = require('./schema/resolvers/AllUsersDisplayList.resolver');

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers: {
    Query,
    Mutation,
    User,
    Campground,
    Comment,
    Rating,
    Notification,
    AllUsersDisplayList,
    BaseFields: {
      __resolveType(tag, context, info) {
        /** Added BaseFields i/f in resolvers to suppress the following console error -
         * Type "BaseFields" is missing a "__resolveType" resolver. Pass false into "resolverValidationOptions.requireResolversForResolveType" to disable this warning. */
      },
    },
    DifficultyLevelFields: {
      __resolveType(tag, context, info) {
        // To disable console warning
      },
    },
    BaseNotificationFields: {
      __resolveType(tag, context, info) {
        // To disable console warning
      },
    },
  },
  context: async (request) => {
    let db;

    try {
      const dbClient = new MongoClient(process.env.DATABASEURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      if (!dbClient.isConnected()) {
        await dbClient.connect();
      }

      db = dbClient.db('angular-yelpcamp');
    } catch (error) {
      console.log(
        'Error connecting to database via graphql context',
        error.message
      );
    }

    return {
      request,
      db,
    };
  },
});

apolloServer.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
