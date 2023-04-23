const mongoose = require('mongoose')
const getFormattedDate = require('../helpers/datetime')
const Hashtag = require('./Hashtag')
const { categoryArray, categoryObject } = require('../constants')
const getCategory = require('../helpers/getCategory')
const formatHashtags = require('../helpers/formatHashtags')
const Category = require('./Category')

const TweetSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: [true, 'who is creating this tweet?'],
    },

    text: {
      type: String,
      minLength: [1, 'tweet should contain atleat one word'],
      maxLength: 400,
    },

    hashtags: [],

    category: {
      type: String,
      enum: categoryArray,
      default: 'others',
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],

    retweets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],

    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tweet' }],

    parentPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'tweet',
      default: null,
    },

    images: [{ type: String }],
  },
  { timestamps: true }
)

// get tweet category before mongoose validations
TweetSchema.pre('validate', async function () {
  if (this.isNew) {
    let category = await getCategory(this.text)
    console.log(1, this)
    if (!categoryArray.includes(category)) category = categoryObject.OTHERS
    this.category = category
  }
})

// extract hashtag from tweet
TweetSchema.pre('save', async function () {
  if (this.isNew) {
    const regex = /#\w+/g
    const extractedHastags = this.text.match(regex) || []
    const formattedHashtags = formatHashtags(extractedHastags)

    await upsertHashtags(formattedHashtags, this._id, this.category)
    this.hashtags = formattedHashtags
  }
})

TweetSchema.methods.getFormattedHomePageTweet = function () {
  const tweet = this.toObject()
  const { likes, retweets, comments, createdAt } = tweet
  tweet.likes = likes.length
  tweet.retweets = retweets.length
  tweet.comments = comments.length
  tweet.createdAt = getFormattedDate(createdAt)
  return tweet
}

const upsertHashtags = async (hashtags, tweetId, category) => {
  await Promise.all(
    hashtags.map(async (hashtag) => {
      var presentHashtag = await Hashtag.findOne({ hashtag })

      if (presentHashtag) {
        presentHashtag.count += 1
      } else {
        presentHashtag = new Hashtag({
          hashtag: hashtag,
          count: 1,
        })
      }

      presentHashtag.tweetIDs.push(tweetId)
      await presentHashtag.save()
    })
  )

  const hashtagIDs = await getHashtagIDsForCategory(hashtags)
  await upsertHashtagToCategory(category, hashtagIDs)
}

const getHashtagIDsForCategory = async (hashtags) => {
  const hashtagIDs = hashtags.map(async (hashtag) => {
    const cur = await Hashtag.findOne({ hashtag })
    return cur._id
  })
  return Promise.all(hashtagIDs)
}

const upsertHashtagToCategory = async (category, hashtagIDs) => {
  const res = await Category.findOneAndUpdate(
    { category },
    {
      $addToSet: { hashtags: { $each: hashtagIDs } },
    },
    { new: true, upsert: true }
  )
}

module.exports = mongoose.model('tweet', TweetSchema)
