const { checkIDValidity, escapeRegex } = require('../../utils/validators.util');
const { objectName, sortOrder } = require('../../utils/constants.util');
const { getUserId } = require('../../utils/security.util');

module.exports = {
  async me(parent, args, { request, db }, info) {
    const userId = getUserId(request);
    return await db.collection('users').findOne({ _id: userId });
  },
  async user(parent, args, context, info) {
    // Require user to be authenticated / logged-in
    const loggedUser = getUserId(context.request);

    if (!args._id) {
      throw new Error('User ID is required');
    }

    const opArgs = {
      _id: checkIDValidity(args._id, objectName.USER),
    };

    return await context.db.collection('users').findOne(opArgs);
  },
  async users(parent, args, context, info) {
    // Require user to be authenticated / logged-in
    const loggedUser = getUserId(context.request);

    let searchObject = context.db.collection('users').find();
    if (args.pagination) {
      args.pagination.skip && searchObject.skip(args.pagination.skip);
      args.pagination.limit && searchObject.limit(args.pagination.limit);
    }

    // console.log(context.request.req.headers.authorization);
    return await searchObject.toArray();
  },
  async campground(parent, args, context, info) {
    if (!args._id) {
      throw new Error('Campground ID is required');
    }

    // Search based on the campgroundId passed
    const campgroundId = checkIDValidity(args._id, objectName.CAMPGROUND);
    const opArgs = {
      _id: campgroundId,
    };

    const campground = await context.db
      .collection('campgrounds')
      .findOne(opArgs);

    if (!campground) {
      throw new Error('Error fetching campground!');
    }

    if (campground) {
      let ratingData;

      if (campground.rating > 0) {
        const ratings = await context.db
          .collection('ratings')
          .find({ campgroundId })
          .toArray();

        if (ratings.length > 0) {
          ratingData = await {
            ratingsCount: ratings.length,
            ratedBy: ratings.map((rating) => rating.author.username),
          };
        }
      }

      return await {
        campground: {
          ...campground,
          updatedAt: campground.updatedAt.toISOString(),
        },
        ratingData,
      };
    } else {
      return;
    }
  },
  async campgrounds(parent, args, context, info) {
    let opArgs = {};

    // Search / Filter based on the query sting passed
    if (args.query) {
      const regex = new RegExp(escapeRegex(args.query), 'gi');
      opArgs = {
        $or: [
          { name: regex },
          { location: regex },
          { 'country.Country_Name': regex },
          { 'country.Continent_Name': regex },
        ],
      };
    }

    let searchObject = context.db.collection('campgrounds').find(opArgs);

    if (args.pagination && args.pagination.sort) {
      const sortOptions = args.pagination.sort.split('_');
      searchObject.sort([[sortOptions[0], sortOrder[sortOptions[1]]]]);
    } else {
      // By default, sort camps in descending order of last updated
      searchObject.sort([['updatedAt', -1]]);
    }

    if (args.pagination) {
      args.pagination.skip && searchObject.skip(args.pagination.skip);
      args.pagination.limit && searchObject.limit(args.pagination.limit);
    }

    const campgrounds = await searchObject.toArray();

    if (!campgrounds) {
      throw new Error('Error fetching campgrounds!');
    }

    let maxCampgrounds = await context.db
      .collection('campgrounds')
      .countDocuments();
    const campgroundsCount = maxCampgrounds || 0;

    /** Return the actual filtered records count, and NOT the total campgrounds count, when in query mode */
    if (args.query) {
      maxCampgrounds = campgrounds.length || 0;
    }

    return {
      campgrounds,
      maxCampgrounds,
      campgroundsCount,
      usersCount: (await context.db.collection('users').countDocuments()) || 0,
      contributorsCount:
        (await (
          await context.db.collection('campgrounds').distinct('author.id')
        ).length) || 0,
    };
  },
  async allCampgrounds(parent, args, context, info) {
    // Check that the user is authenticated to fetch data

    // No return record limit restriction in this demo version!
    const campgrounds = await context.db
      .collection('campgrounds')
      .find()
      .toArray();

    if (!campgrounds) {
      throw new Error('Error fetching all campgrounds!');
    }

    return await campgrounds.map((campground) => {
      return {
        _id: campground._id,
        name: campground.name,
        rating: campground.rating || 0,
        price: campground.price || 0,
        countryCode: campground.country.Two_Letter_Country_Code || 'NA',
        continentName: campground.country.Continent_Name || 'NA',
      };
    });
  },
  async comments(parent, args, context, info) {
    // Require user to be authenticated / logged-in
    const loggedUser = getUserId(context.request);

    if (!args.authorId) {
      throw new Error('Comment author is required');
    }

    args.authorId = checkIDValidity(args.authorId, objectName.COMMENT);
    return await context.db
      .collection('comments')
      .find({ 'author.id': args.authorId })
      .toArray();
  },
  async campRatings(parent, args, context, info) {
    if (!args._id) {
      throw new Error('Campground ID is required');
    }

    // Search based on the campgroundId passed
    const opArgs = {
      campgroundId: checkIDValidity(args._id, objectName.CAMPGROUND),
    };

    return context.db.collection('ratings').find(opArgs).toArray();
  },
  async userRatings(parent, args, context, info) {
    // Require user to be authenticated / logged-in
    const loggedUser = getUserId(context.request);

    if (!args._id) {
      throw new Error('User ID is required');
    }

    // Search based on the campgroundId passed
    const opArgs = {
      ['author.id']: checkIDValidity(args._id, objectName.USER),
    };

    return context.db.collection('ratings').find(opArgs).toArray();
  },
  async userCampRating(parent, args, context, info) {
    // Require user to be authenticated / logged-in
    const loggedUser = getUserId(context.request);

    if (!args.campgroundId) {
      throw new Error('Campground ID is required');
    }

    if (!args.userId) {
      throw new Error('User ID is required');
    }

    // Search based on the campgroundId passed
    const opArgs = {
      campgroundId: checkIDValidity(args.campgroundId, objectName.CAMPGROUND),
      ['author.id']: checkIDValidity(args.userId, objectName.USER),
    };

    return context.db.collection('ratings').findOne(opArgs);
  },
  // async notifications(parent, args, context, info) {
  //   return await context.db.collection('notifications').find().toArray();
  // },
  async campLevelsData(parent, args, context, info) {
    // console.log(
    //   'context.request.req.headers inside campLevelsData',
    //   context.request.req.headers
    // );

    const hikesData = await context.db.collection('hikes').find().toArray();

    if (!hikesData) {
      throw new Error('Error fetching Camp levels data!');
    }

    return {
      seasons: hikesData[0].seasons,
      hikingLevels: hikesData[0].hikingLevels,
      trekTechnicalGrades: hikesData[0].trekTechnicalGrades,
      fitnessLevels: hikesData[0].fitnessLevels,
    };
  },
  async campStaticData(parent, args, context, info) {
    const hikesData = await context.db.collection('hikes').find().toArray();
    const countriesList = await context.db
      .collection('countries')
      .find()
      .toArray();
    const amenitiesList = await context.db
      .collection('amenities')
      .find()
      .toArray();

    return {
      countriesList,
      amenitiesList,
      seasons: hikesData[0].seasons,
      hikingLevels: hikesData[0].hikingLevels,
      trekTechnicalGrades: hikesData[0].trekTechnicalGrades,
      fitnessLevels: hikesData[0].fitnessLevels,
    };
  },
};
