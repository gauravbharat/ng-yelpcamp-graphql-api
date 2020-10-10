const { gql } = require('apollo-server');

module.exports = gql`
  type Query {
    users(query: String, pagination: PaginationParams): [User]!
    user(_id: String!): User
    campgrounds(query: String, pagination: PaginationParams): [Campground]!
    campground(_id: String!): Campground
    comments(authorId:String!): [Comment]!
    amenities(campgroundId:String): [Amenities]!
    # rating
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
    createdAt: String!
    updatedAt: String!
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
    follower: followerType
    isCommentLike: Boolean!
    campgroundId: Campground
    commentId: Comment
    userId: User
  }

  type followerType {
    id: User!
    followingUserId: User!
  }
  
`;
