const mongoose = require('mongoose')
const { mobile_no_validator } = require('../mongo-validators/user')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide name'],
      maxlength: 50,
      minlength: 3,
      trim: true,
    },
    userName: {
      type: String,
      required: [true, 'Please provide user name (unique)'],
      unique: [true, 'user name must be unique'],
    },
    email: {
      type: String,
      lowercase: true,
      required: [true, 'Please provide email'],
      unique: [true, 'email already exist'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
      trim: true,
    },

    city: {
      type: String,
      // required: [true, 'please provide city'],
    },
    state: {
      type: String,
      // required: [true, 'please provide state'],
    },
    // mobileNo: {
    //   type: Number,
    //   required: [true, 'please provide phone number'],
    //   validate: mobile_no_validator,
    // },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
      trim: true,
    },
    profileImg: {
      type: String,
    },

    bannerImg: {
      type: String,
      default:
        'https://thumbs.dreamstime.com/b/sun-rays-mountain-landscape-5721010.jpg',
    },

    bio: {
      type: String,
    },

    birthdate: {
      type: Date,
    },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],

    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],

    tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tweet' }],

    isLoggedInByGoogle: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tweet' }],

    retweeted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tweet' }],

    commented: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tweet' }],
  },
  { timestamps: true }
)

// for google logged in users
UserSchema.pre('validate', function () {
  if (this.isLoggedInByGoogle) {
    this.$ignore('city')
    this.$ignore('password')
    this.$ignore('state')
    this.$ignore('mobileNo')
  }
})

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      name: this.name,
      email: this.email,
      userName: this.userName,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d',
    }
  )
}

UserSchema.methods.verifyPassword = function (incomingPassword) {
  return this.password === incomingPassword
}

module.exports = mongoose.model('user', UserSchema)
