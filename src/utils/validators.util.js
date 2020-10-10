const mongodb = require('mongodb');

exports.escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

exports.checkIDValidity = (objectId, objectName = "") => {
  if(!mongodb.ObjectID.isValid(objectId)) {
    throw new Error(`Invalid input received for ${objectName.toLowerCase()}`);
  }
  return mongodb.ObjectID(objectId);
}