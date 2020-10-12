const { gql } = require('apollo-server');

module.exports = gql`
  type Query {
    campgrounds(query: String, pagination: PaginationParams): [Campground]!
    campground(_id: String!): Campground
    campRatings(_id: String!): [Rating]! # total ratings on a campground

   # Requires authentication 
    me: User!
    users(query: String, pagination: PaginationParams): [User]!
    user(_id: String!): User
    comments(authorId:String!): [Comment]!
    userRatings(_id: String!): [Rating]! # total ratings given by a user to campgrounds
    userCampRating(campgroundId: String!, userId: String!): Rating # rating given by a user on a campground

    # Static data
    amenities: [Amenities!]!
    countries: [Countries!]!
  }

  type Mutation {
    login(credentials: LoginUserInput!): AuthPayload!
  }

  input LoginUserInput {
    username: String
    email: String
    password: String!
  }

  type AuthPayload {
    token: String!
    user: User!
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
    isAdmin: Boolean
    hideStatsDashboard: Boolean
    followers: [User]!
    notifications: [Notification]!
    createdAt: String!
    updatedAt: String!
    enableNotifications: EnableNotificationsFields
    enableNotificationEmails: EnableNotificationsEmailFields
    resetPasswordToken: String
    resetPasswordExpires: String
  }

  interface BaseNotificationFields {
    newCampground: Boolean!
    newComment: Boolean!
    newFollower: Boolean
  }

  type EnableNotificationsFields implements BaseNotificationFields {
    newCampground: Boolean!
    newComment: Boolean!
    newFollower: Boolean!
    newCommentLike: Boolean!
  }

  type EnableNotificationsEmailFields implements BaseNotificationFields {
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
    fitnessLevel: FitnessLevelField
    hikingLevel: HikingLevelField
    trekTechnicalGrade: TrekLevelField
    bestSeasons: BestSeasonsField
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

  interface DifficultyLevelFields {
    level: Int!
    levelName: String!
    levelDesc: String!
  }

  type FitnessLevelField implements DifficultyLevelFields {
    level: Int!
    levelName: String!
    levelDesc: String!
  }

  type HikingLevelField implements DifficultyLevelFields {
    level: Int!
    levelName: String!
    levelDesc: String!
  }

  type TrekLevelField implements DifficultyLevelFields {
    level: Int!
    levelName: String!
    levelDesc: String!
  }
  
  type BestSeasonsField {
    vasanta: Boolean!
    grishma: Boolean!
    varsha: Boolean!
    sharat: Boolean!
    hemant: Boolean!
    shishira: Boolean!
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
    notificationTypeDesc: NotificationTypeDesc!
    follower: FollowerTypeField
    isCommentLike: Boolean!
    campgroundId: Campground
    commentId: Comment
    userId: User
  }

  enum NotificationTypeDesc {
    NEW_CAMPGROUND
    NEW_COMMENT
    NEW_ADMIN_REQUEST
    NEW_FOLLOWER
    NEW_LIKE_FOR_COMMENT
  }

  type FollowerTypeField {
    id: User
    followingUserId: User
  }

  
`;
