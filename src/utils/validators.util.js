const mongodb = require('mongodb');

exports.escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

exports.checkIDValidity = (objectId, objectName = '') => {
  if (!mongodb.ObjectID.isValid(objectId)) {
    throw new Error(`Invalid input received for ${objectName.toLowerCase()}`);
  }
  return mongodb.ObjectID(objectId);
};

exports.validateFields = (fieldName, fieldValue, expectedFieldType) => {
  switch (expectedFieldType) {
    case 'string':
      if (
        !fieldValue ||
        typeof fieldValue !== 'string' ||
        fieldValue.trim() === ''
      ) {
        throw new Error(`Invalid input for ${fieldName}!`);
      } else {
        return fieldValue.trim();
      }

    case 'boolean':
      if (typeof fieldValue !== 'boolean') {
        throw new Error(`Invalid input for ${fieldName}!`);
      } else {
        return fieldValue;
      }
    default:
      return null;
  }
};
