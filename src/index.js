const { ApolloServer, gql } = require('apollo-server');
const { MongoClient } = require('mongodb');

const typeDefs = require('./schema/typeDefs');
const Query = require('./schema/resolvers/Query');
const User = require('./schema/resolvers/User.resolver');

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers: {
    Query,
    User,
  },
  context: async ({ request }) => {
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
      console.log('Error connecting to database via graphql context', error);
    }

    return {
      request,
      setupCompleted: false,
      db,
    };
  },
});

apolloServer.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
