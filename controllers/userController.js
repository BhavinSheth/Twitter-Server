const { StatusCodes } = require('http-status-codes')
const { NotFoundError, BadRequestError } = require('../errors')
const { ValidationError } = require('../errors/custom-error')
// const { StatusCodes } = require('http-status-codes')
const User = require('../models/User')
const axios = require('axios')
const formattedDate = require('../helpers/datetime')
const BadRequest = require('../errors/bad-request')
const openai = require('openai')
const { retweet } = require('./tweetController')

const getAllUsers = async (req, res) => {
  const users = await User.find()
  if (users) return res.status(StatusCodes.OK).json(users)
  return res.json('no user found')
}

const createUser = async (req, res) => {
  const user = req.body
  const error = {}
  // if (!user.name) error.name = 'name not found'

  // if (!user.email) error.email = 'email not found'
  // if (Object.keys(error).length > 0) throw new ValidationError(error)

  await User.create(user)
  if (!user) throw NotFoundError('no user found')
  res.json('user created succesfullly')
}

const gpt_api = async (req, res) => {
  const { question } = req.body
  const response = await axios.post(
    `https://api.openai.com/v1/engines/davinci/completions`,
    {
      prompt: question,
      max_tokens: 1000,
      n: 15,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
      },
    }
  )

  const newRes = response.data.choices.map((item) =>
    item.text.replace(/(\r\n|\n|\r)/gm, '')
  )
  return res.status(StatusCodes.OK).json(newRes)
}

const getSingleUser = async (req, res) => {
  const { username } = req.params
  const { visitingUserId } = req.body

  let status
  let user = await User.findOne({ userName: username }).select('-password')
  if (!user) throw new NotFoundError(`${username} not found`)
  user = user.toObject()

  if (user._id == visitingUserId) status = 'edit'
  else if (user.followers.isFound(visitingUserId)) status = 'unfollow'
  else status = 'follow'

  res.status(200).json({ ...user, status })
}

const followRequest = async (req, res) => {
  const { userId: sourceUserId } = req.user
  const sourceUser = await User.findById(sourceUserId)

  const { username: destinationUserName } = req.params

  const destinationUser = await User.findOne({ userName: destinationUserName })

  console.log(sourceUser, destinationUser)

  if (!destinationUser)
    throw new NotFoundError(
      `no user found with username ${destinationUserName}`
    )

  if (sourceUserId == destinationUser.id)
    return res
      .status(StatusCodes.NOT_ACCEPTABLE)
      .json({ message: `you cannot follow yourself` })

  if (sourceUser.following.includes(destinationUser.id)) {
    console.log('source', sourceUserId, 'destination', destinationUser.id)
    return res
      .status(StatusCodes.NOT_ACCEPTABLE)
      .json({ message: `you already follow ${destinationUser.name}` })
  }

  sourceUser.following.push(destinationUser.id)
  destinationUser.followers.push(sourceUserId)

  await sourceUser.save()
  await destinationUser.save()

  res.json({ sourceUser, destinationUser })
}

const unfollowRequest = async (req, res) => {
  const { userId: sourceUserId } = req.user
  const sourceUser = await User.findById(sourceUserId)

  const { username: destinationUserName } = req.params

  const destinationUser = await User.findOne({
    userName: destinationUserName,
  })

  if (!destinationUser)
    throw new NotFoundError(
      `no user found with username ${destinationUserName}`
    )

  if (!sourceUser.following.includes(destinationUser.id))
    return res
      .status(StatusCodes.NOT_ACCEPTABLE)
      .json({ message: `you need to follow ${destinationUser.name} first` })

  sourceUser.following.removeElement(destinationUser.id)
  destinationUser.followers.removeElement(sourceUserId)

  await sourceUser.save()
  await destinationUser.save()

  res.json({ sourceUser, destinationUser })
}

const editProfile = async (req, res) => {
  const { userId } = req.user
  const { _id: editedUserId } = req.body

  if (userId !== editedUserId)
    throw new BadRequestError('you cannot edit other users profile')

  const { _id, password, ...editableData } = req.body

  const updatedUser = await User.findByIdAndUpdate(
    editedUserId,
    {
      ...editableData,
    },
    { new: 'true', runValidators: 'true' }
  )
  res
    .status(StatusCodes.OK)
    .json({ message: 'profile edited succesfully', updatedUser })
}

const getProfileTweets = async (req, res) => {
  const { username } = req.params
  let user = await User.findOne({ userName: username })
    .select('userName')
    .populate({
      path: 'tweets retweeted',
      populate: {
        path: 'createdBy',
        select: 'userName name profileImg isVerified',
      },
      options: {
        sort: { createdAt: 'desc' },
      },
    })
  if (!user) throw new NotFoundError('no user found')

  user = user.toObject()
  const newTweets = user.tweets.map((tweet) => {
    return { ...tweet, isRetweeted: false }
  })
  const newRetweets = user.retweeted.map((retweet) => {
    return { ...retweet, isRetweeted: true }
  })
  res.status(StatusCodes.OK).json({
    ...user,
    tweets: [...newTweets, ...newRetweets],
  })
}

const getProfilelikedTweets = async (req, res) => {
  const { username } = req.params
  const { visitingUserId } = req.body

  let user = await User.findOne({ userName: username })
    .select('userName')
    .populate({
      path: 'liked',
      populate: {
        path: 'createdBy',
        select: 'userName name profileImg isVerified',
      },
      options: {
        sort: { createdAt: 'desc' },
      },
    })
  if (!user) throw new NotFoundError('no user found')

  user = user.toObject()

  const newlikedTweets = user.liked.map((tweet) => {
    const newLikes = tweet.likes.map((mongooseId) => mongooseId.toString())

    if (newLikes.includes(visitingUserId)) return { ...tweet, isLiked: true }
    else return { ...tweet, isLiked: false }
  })

  res.json({ ...user, liked: newlikedTweets })
}

const getComments = async (req, res) => {
  const { username } = req.params

  let user = await User.findOne({ userName: username }).select(
    'userName commented'
  )

  if (!user) throw new NotFoundError('no user found')

  return res.status(StatusCodes.OK).json(user)
}

const getFollowers = async (req, res) => {
  const { username } = req.params
  const { visitingUserId } = req.body

  let user = await User.findOne({ userName: username })
    .select('userName')
    .populate({
      path: 'followers',
      select: 'userName name profileImg isVerified followers following bio',
    })
  if (!user) throw new NotFoundError('no user found')

  user = user.toJSON()
  const { followers } = user

  const formattedFollowers = followers.map((follower) => {
    let newObj = { ...follower, isFollowingYou: false, doYouFollow: false }

    if (follower.followers.isFound(visitingUserId))
      newObj = { ...newObj, doYouFollow: true }

    if (follower.following.isFound(visitingUserId))
      newObj = { ...newObj, isFollowingYou: true }

    return newObj
  })

  return res
    .status(StatusCodes.OK)
    .json({ ...user, followers: formattedFollowers })
}

const getFollowing = async (req, res) => {
  const { username } = req.params
  const { visitingUserId } = req.body

  let user = await User.findOne({ userName: username })
    .select('userName')
    .populate({
      path: 'following',
      select: 'userName name profileImg isVerified bio followers following',
    })
  if (!user) throw new NotFoundError('no user found')

  user = user.toJSON()
  const { following } = user

  const formattedFollowing = following.map((singleFollowing) => {
    let newObj = {
      ...singleFollowing,
      isFollowingYou: false,
      doYouFollow: false,
    }

    if (singleFollowing.followers.isFound(visitingUserId))
      newObj = { ...newObj, doYouFollow: true }

    if (singleFollowing.following.isFound(visitingUserId))
      newObj = { ...newObj, isFollowingYou: true }

    return newObj
  })

  return res
    .status(StatusCodes.OK)
    .json({ ...user, following: formattedFollowing })
}

module.exports = {
  getAllUsers,
  createUser,
  gpt_api,
  getSingleUser,
  followRequest,
  unfollowRequest,
  editProfile,
  getProfileTweets,
  getProfilelikedTweets,
  getFollowers,
  getFollowing,
  getComments,
}
