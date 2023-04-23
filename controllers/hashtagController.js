const Hashtag = require('../models/Hashtag')
const Tweet = require('../models/Tweet')
const User = require('../models/User')
const Category = require('../models/Category')
const StatusCodes = require('http-status-codes')
const NotFound = require('../errors/not-found')

const createOrUpdateHastags = async (hashtags) => {
  const newHashtagPromise = hashtags.map(async (hashtag) => {
    const presentHashtag = await Hashtag.findOne({ hashtag })
    if (presentHashtag) {
      presentHashtag.count += 1
      await presentHashtag.save()
      return null
    } else {
      const newHashtag = await Hashtag.create({ hashtag, count: 1 })
      return newHashtag
    }
  })

  const newlyAddedHastags = await Promise.all(newHashtagPromise)
  return newlyAddedHastags.filter((hashtag) => hashtag !== null)
}

const getHashtags = async (req, res) => {
  const allHashtags = await Hashtag.find()
  if (!allHashtags) throw new Error('no hashtag found')
  res.json(allHashtags)
}

const upsertHashtags = async (req, res) => {
  const result = await createOrUpdateHastags(hashtags)
  res.json(result)
}

const getHashTagsByCategory = async (req, res) => {
  const { category } = req.params

  if (category == null) throw new NotFound(`no trends found under ${category}`)

  const tweetsWithHashtags = await Category.findOne({
    category,
  }).populate('hashtags')

  if (!tweetsWithHashtags)
    throw new NotFound(`no trends found under ${category}`)

  tweetsWithHashtags.hashtags.sort((a, b) => b.count - a.count)

  // const tweets = await Tweet.find({ category })

  res.status(StatusCodes.OK).json(tweetsWithHashtags)
}

const get_formatted_users = (users, visitingUserId) => {
  return users.map((user) => {
    user = user.toObject()
    let newObj = { ...user, isFollowingYou: false, doYouFollow: false }

    if (user.followers.isFound(visitingUserId))
      newObj = { ...newObj, doYouFollow: true }

    if (user.following.isFound(visitingUserId))
      newObj = { ...newObj, isFollowingYou: true }

    return newObj
  })
}

const getSearchResults = async (req, res) => {
  const { visitingUserId } = req.body

  let mongooseUsers = await User.find()
  const formatedUsers = get_formatted_users(mongooseUsers, visitingUserId)

  const tweets = await Tweet.find().populate('createdBy')
  const hashtags = await Hashtag.find().select('hashtag count')

  res.status(200).json({ users: formatedUsers, tweets, hashtags })
}

module.exports = {
  upsertHashtags,
  getHashtags,
  getHashTagsByCategory,
  getSearchResults,
}
