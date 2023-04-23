const express = require('express')
const router = express.Router()
const auth = require('../middleware/authorization')
const {
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
} = require('../controllers/tweetController')

router.route('/home').get(getHomePageTweets)
router
  .route('/:username/tweets')
  .post(auth, createTweet)
  .delete(auth, deleteTweet)

router.route('/:username/status/:tweetId/like').post(auth, likeTweet)
router.route('/:username/status/:tweetId/unlike').post(auth, unlikeTweet)
router.route('/:username/status/:tweetId/retweet').post(auth, retweet)
router.route('/:username/status/:tweetId/undoRetweet').post(auth, undoRetweet)
router.route('/:username/status/:tweetId/comment').post(auth, comment)

router.route('/:username/status/:tweetId').get(getTweet)
module.exports = router
