const User = require('../models/User')
const Tweet = require('../models/Tweet')
const getFormattedDate = require('../helpers/datetime')
const { StatusCodes } = require('http-status-codes')
const Hashtag = require('../models/Hashtag')
const Category = require('../models/Category')
const { NotFoundError } = require('../errors')
const BadRequest = require('../errors/bad-request')
require('../helpers/removeMethods')
const { cloudinary } = require('../helpers/cloudinary')

const createTweet = async (req, res) => {
  const { userId } = req.user
  const user = await User.findById(userId)
  const tweet = req.body

  if (tweet.images.length > 0 && tweet.images[0] !== null) {
    console.log(tweet)
    const cloudinaryRes = await uploadImage(tweet.images)
    console.log(cloudinaryRes)
    tweet.images = []
    tweet.images.push(cloudinaryRes.url)
  }
  tweet.createdBy = userId

  const newTweet = await Tweet.create(tweet)

  user.tweets.push(newTweet._id)
  await user.save()

  res.json(newTweet)
}

const uploadImage = async (images) => {
  const cloudinaryRes = await cloudinary.uploader.upload(images[0], {
    folder: 'twitter',
    access_mode: 'public',
  })
  return cloudinaryRes
}

const getAllClientTweets = async (req, res) => {
  const { userId } = req.user
  const tweets = await User.find({ _id: userId })
    .select('name userName')
    .populate([
      {
        path: 'tweets',
        select: 'text hashtags',
      },
    ])

  res.json(tweets)
}

const deleteTweet = async (req, res) => {
  const { userId } = req.user
  const { _id: tweetId } = req.body

  const user = await User.findById(userId)
  user.tweets.removeElement(tweetId)
  await user.save()

  const tweet = await Tweet.findById(tweetId)
  await tweet.remove()

  res.json(user)
}

const getTweet = async (req, res) => {
  const { tweetId, username } = req.params

  const user = await User.findOne({ userName: username })

  const tweet = await Tweet.findOne({
    _id: tweetId,
    // createdBy: user.id,
  })
    .populate({
      path: 'createdBy',
      select: 'userName name profileImg isVerified',
    })
    .populate({
      path: 'comments',
      populate: {
        path: 'createdBy',
      },
    })

  return res.json(tweet)
}

const getHomePageTweets = async (req, res) => {
  const tweets = await Tweet.find().populate({
    path: 'createdBy',
    select: 'name userName profileImg isVerified',
  })

  // const formattedTweets = tweets.map((tweet) =>
  //   tweet.getFormattedHomePageTweet()
  // )

  res.status(200).json(tweets)
}

// user tweet authorized operations

const likeTweet = async (req, res) => {
  const { username: userName, tweetId } = req.params
  const { userId: likedById } = req.user

  const likedByUser = await User.findById(likedById)

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) throw NotFoundError(`No Tweet Found by id ${tweetId}`)
  if (tweet.likes.includes(likedById))
    return res
      .status(StatusCodes.NOT_ACCEPTABLE)
      .json({ message: 'you cannot like tweet again' })

  tweet.likes.push(likedById)
  const updatedTweet = await tweet.save()

  likedByUser.liked.push(tweetId)
  const updatedUser = await likedByUser.save()

  res.status(StatusCodes.OK).json({ updatedTweet, updatedUser })
}

const unlikeTweet = async (req, res) => {
  const { username: userName, tweetId } = req.params
  const { userId: likedById } = req.user

  const likedByUser = await User.findById(likedById)

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) throw NotFoundError(`No Tweet Found by id ${tweetId}`)
  if (!tweet.likes.includes(likedById))
    return res
      .status(StatusCodes.NOT_ACCEPTABLE)
      .json({ message: "you haven't liked tweet yet" })

  tweet.likes.removeElement(likedById)
  const updatedTweet = await tweet.save()

  likedByUser.liked.removeElement(tweetId)
  const updatedUser = await likedByUser.save()

  res.status(StatusCodes.OK).json({ updatedTweet, updatedUser })
}

const retweet = async (req, res) => {
  const { username: userName, tweetId } = req.params
  const { userId: retweetedById } = req.user

  const retweetedByUser = await User.findById(retweetedById)

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) throw NotFoundError(`No Tweet Found by id ${tweetId}`)
  if (tweet.retweets.includes(retweetedById))
    return res
      .status(StatusCodes.NOT_ACCEPTABLE)
      .json({ message: 'you cannot retweet again' })

  tweet.retweets.push(retweetedById)
  const updatedTweet = await tweet.save()

  retweetedByUser.retweeted.push(tweetId)
  const updatedUser = await retweetedByUser.save()

  res.status(StatusCodes.OK).json({ updatedTweet, updatedUser })
}

const undoRetweet = async (req, res) => {
  const { username: userName, tweetId } = req.params
  const { userId: retweetedById } = req.user

  const retweetedByUser = await User.findById(retweetedById)

  const tweet = await Tweet.findById(tweetId)
  if (!tweet) throw NotFoundError(`No Tweet Found by id ${tweetId}`)
  if (!tweet.retweets.includes(retweetedById))
    return res
      .status(StatusCodes.NOT_ACCEPTABLE)
      .json({ message: "you haven't retweeted yet" })

  tweet.retweets.removeElement(retweetedById)
  const updatedTweet = await tweet.save()

  retweetedByUser.retweeted.removeElement(tweetId)
  const updatedUser = await retweetedByUser.save()

  res.status(StatusCodes.OK).json({ updatedTweet, updatedUser })
}

const comment = async (req, res) => {
  const { tweetId: parentTweetId } = req.params
  const { userId: commentedByUserId } = req.user
  const { text } = req.body

  const commentedByUser = await User.findById(commentedByUserId)

  const parentTweet = await Tweet.findById(parentTweetId)
  if (!parentTweet)
    throw new NotFoundError(`No Tweet Found by id ${parentTweetId}`)

  const comment = await Tweet.create({
    text,
    createdBy: commentedByUserId,
    parentPost: parentTweetId,
  })

  parentTweet.comments.push(comment.id)
  const newParentTweet = await parentTweet.save()

  commentedByUser.commented.push(comment.id)
  const newCommentedByUser = await commentedByUser.save()

  res
    .status(StatusCodes.OK)
    .json({ comment, newParentTweet, newCommentedByUser })
}

module.exports = {
  createTweet,
  deleteTweet,
  getHomePageTweets,
  getTweet,
  getAllClientTweets,
  likeTweet,
  unlikeTweet,
  retweet,
  undoRetweet,
  comment,
}
