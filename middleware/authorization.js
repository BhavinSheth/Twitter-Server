const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { UnauthenticatedError } = require('../errors')

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  // console.log(authHeader)
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    throw new UnauthenticatedError('authorization denied')
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    // console.log(payload)
    req.user = {
      userId: payload.userId,
      email: payload.email,
      userName: payload.userName,
    }
    return next()
  } catch (error) {
    console.log(authHeader)
    throw new UnauthenticatedError('authentication denied')
  }
}

module.exports = auth
