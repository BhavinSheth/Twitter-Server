const mongoose = require('mongoose')
const { categoryArray } = require('../constants')

const HastagSchema = new mongoose.Schema(
  {
    hashtag: {
      type: String,
    },
    count: {
      type: Number,
      default: 0,
    },
    tweetIDs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'tweet',
      },
    ],
  },
  { timestamps: true }
)

module.exports = mongoose.model('hashtag', HastagSchema)
