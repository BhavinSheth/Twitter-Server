const { StatusCodes } = require('http-status-codes')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { ValidationError } = require('../errors/custom-error')
const { BadRequestError, NotFoundError } = require('../errors')
const { OAuth2Client } = require('google-auth-library')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const extractUserNameFromEmail = (email) => {
  const index = email.indexOf('@')
  return email.slice(0, index)
}

const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    throw new BadRequestError('pls provide email and password')
  }

  const user = await User.findOne({ email })

  if (!user) throw new BadRequestError(`email : ${email} doesn't exist`)

  if (!user.verifyPassword(password)) throw new Error('incorrect password')

  const token = user.createJWT()

  res.status(StatusCodes.OK).json({
    user: {
      userId: user._id,
      name: user.name,
      email,
      userName: user.userName,
      profileImg: user.profileImg,
    },
    token,
  })
}

const register = async (req, res) => {
  const { name, email, password } = req.body

  const existingUser = await User.findOne({ email })
  if (existingUser)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: `user with ${email} already exist` })

  const user = await User.create(req.body)
  const token = user.createJWT()
  res.status(StatusCodes.CREATED).json({
    user: {
      name: user.name,
      email: user.email,
      userName: user.userName,
      name: user.name,
      profileImg: user.profileImg,
    },
    token,
  })
}

async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  return ticket.getPayload()
}

const googleLoginOrRegister = async (req, res) => {
  const response = await verifyGoogleToken(req.body.credential)
  const { email, name, picture } = response

  var user = await User.findOne({ email })

  if (!user) {
    user = new User({
      email,
      name,
      userName: extractUserNameFromEmail(email),
      isLoggedInByGoogle: true,
      profileImg: picture,
    })
    await user.save({ validateBeforeSave: false })
  }
  const token = user.createJWT()
  res.status(StatusCodes.CREATED).json({
    user: {
      userId: user._id,
      userName: user.userName,
      email: user.email,
      name: user.name,
      profileImg: user.profileImg,
    },
    token,
  })
}

module.exports = { login, register, googleLoginOrRegister }
