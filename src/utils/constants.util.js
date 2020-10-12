exports.objectName = Object.freeze({
  USER: 'USER',
  CAMPGROUND: 'CAMPGROUND',
  COMMENT: 'COMMENT',
  NOTIFICATION: 'NOTIFICATION'
})

exports.sortOrder = Object.freeze({
  ASC: 1,
  DESC: -1
})

exports.notificationTypes = new Map([
  [0, 'NEW_CAMPGROUND'],
  [1, 'NEW_COMMENT'],
  [2, 'NEW_ADMIN_REQUEST'],
  [3, 'NEW_FOLLOWER'],
  [4, 'NEW_LIKE_FOR_COMMENT'],
])