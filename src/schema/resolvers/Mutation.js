const { matchPassword, generateToken } = require('../../utils/security.util');

module.exports = {
  async login(parent, args, { db }, info) {
    const {username, email, password} = args.credentials;
    let opArgs;

    if(username && username.trim()) { opArgs = { username: username.trim() } }
    if(email && email.trim()) { opArgs = { email: email.trim() } }

    if(!opArgs || !password) {
      throw new Error('Unable to login!')
    }

    const user = await db.collection('users').findOne(opArgs);

    if(!user) {
      throw new Error('Unable to login!')
    }

    const isValidPassword = await matchPassword(password, user.password);

    if(!isValidPassword) {
      throw new Error('Unable to login!')
    }

    return {
      token: generateToken(user._id),
      user
    }
  },

}