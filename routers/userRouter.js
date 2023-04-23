const express = require('express')
const router = express.Router()
const {
  getAllUsers,
  createUser,
  gpt_api,
  getSingleUser,
  followRequest,
  unfollowRequest,
  editProfile,
  getProfileTweets,
  getProfilelikedTweets,
  getComments,
  getFollowers,
  getFollowing,
} = require('../controllers/userController')
const auth = require('../middleware/authorization')

router.route('/users').get(getAllUsers).post(createUser)
router.route('/:username').post(getSingleUser).put(auth, editProfile)
router.route('/:username/follow').post(auth, followRequest)
router.route('/:username/unfollow').post(auth, unfollowRequest)
router.route('/ai').post(gpt_api)

router.route('/:username/tweets').get(getProfileTweets)
router.route('/:username/likes').get(getProfilelikedTweets)
router.route('/:username/comments').get(getComments)
router.route('/:username/followers').post(getFollowers)
router.route('/:username/following').post(getFollowing)

module.exports = router
