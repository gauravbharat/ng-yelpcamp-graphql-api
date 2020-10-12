const { gql } = require('apollo-server');

module.exports = gql`
  type Query {
    me: User!
    users(query: String, pagination: PaginationParams): [User]!
    campgrounds(query: String, pagination: PaginationParams): [Campground]!

    user(_id: String!): User
    campground(_id: String!): Campground
    comments(authorId:String!): [Comment]!
    campRatings(_id: String!): [Rating]! # total ratings on a campground
    userRatings(_id: String!): [Rating]! # total ratings given by a user to campgrounds
    userCampRating(campgroundId: String!, userId: String!): Rating # rating given by a user on a campground

    # notifications: [Notification!]!

    # Static data
    amenities: [Amenities!]!
    countries: [Countries!]!
  }

  input PaginationParams {
    skip: Int
    limit: Int
    sort: CampgroundSortByInput
  }

  interface BaseFields {
    _id: ID!
    createdAt: String!
    updatedAt: String!
  }

  type User implements BaseFields {
    _id: ID!
    username: String!
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    avatar: String!
    isAdmin: Boolean!
    hideStatsDashboard: Boolean!
    followers: [User]!
    notifications: [Notification]!
    createdAt: String!
    updatedAt: String!
    enableNotifications: enableNotificationsFields
    enableNotificationEmails: enableNotificationsEmailFields
  }

  interface baseNotificationFields {
    newCampground: Boolean!
    newComment: Boolean!
    newFollower: Boolean
  }

  type enableNotificationsFields implements baseNotificationFields {
    newCampground: Boolean!
    newComment: Boolean!
    newFollower: Boolean!
    newCommentLike: Boolean!
  }

  type enableNotificationsEmailFields implements baseNotificationFields {
    newCampground: Boolean!
    newComment: Boolean!
    newFollower: Boolean!
    system: Boolean!
  }

  type Comment implements BaseFields {
    _id: ID!
    text: String!
    author: User!
    isEdited: Boolean!
    likes: [User!]
    createdAt: String!
    updatedAt: String!
  }

  type Amenities {
    _id: ID
    name: String
    group: String
  }

  type Countries {
    _id: ID!
    Continent_Code: String
    Continent_Name: String
    Country_Name: String!
    Country_Number: Int
    Three_Letter_Country_Code: String
    Two_Letter_Country_Code: String
  }

  type Campground implements BaseFields {
    _id: ID!
    name: String!
    price: Int
    image: String!
    location: String
    latitude: Int
    longitude: Int
    description: String
    author: User!
    comments: [Comment!]
    amenities: [Amenities!]
    country: Countries
    rating: Float #this is a calculated average of multiple values from Rating table for this camp
    createdAt: String!
    updatedAt: String!
    fitnessLevel: fitnessLevelField
    hikingLevel: hikingLevelField
    trekTechnicalGrade: trekLevelField
    bestSeasons: bestSeasonsField
  }

  enum CampgroundSortByInput {
    name_ASC
    name_DESC
    price_ASC
    price_DESC
    location_ASC
    location_DESC
    rating_ASC
    rating_DESC
    createdAt_ASC
    createdAt_DESC
    updatedAt_ASC
    updatedAt_DESC
  }

  type Rating implements BaseFields {
    _id: ID!
    rating: Float!
    author: User!
    campgroundId: Campground!
    createdAt: String!
    updatedAt: String!
  }

  type Notification implements BaseFields {
    _id: ID!
    createdAt: String!
    updatedAt: String!
    isRead: Boolean!
    notificationType: Int!
    follower: followerTypeField
    isCommentLike: Boolean!
    campgroundId: Campground
    commentId: Comment
    userId: User
  }

  type followerTypeField {
    id: User
    followingUserId: User
  }

  interface difficultyLevelFields {
    level: Int!
    levelName: String!
    levelDesc: String!
  }

  type fitnessLevelField implements difficultyLevelFields {
    level: Int!
    levelName: String!
    levelDesc: String!
  }

  type hikingLevelField implements difficultyLevelFields {
    level: Int!
    levelName: String!
    levelDesc: String!
  }

  type trekLevelField implements difficultyLevelFields {
    level: Int!
    levelName: String!
    levelDesc: String!
  }
  
  type bestSeasonsField {
    vasanta: Boolean!
    grishma: Boolean!
    varsha: Boolean!
    sharat: Boolean!
    hemant: Boolean!
    shishira: Boolean!
  }
`;
