const mongoose = require('mongoose')
const { categoryArray } = require('../constants')

const CategorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: categoryArray,
      required: [true, 'category required'],
    },
    hashtags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'hashtag',
      },
    ],
  },
  { timestamps: true }
)

module.exports = mongoose.model('category', CategorySchema)
