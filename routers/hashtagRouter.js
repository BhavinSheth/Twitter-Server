const express = require('express')
const router = express.Router()
const {
  upsertHashtags,
  getHashtags,
  getHashTagsByCategory,
  getSearchResults,
} = require('../controllers/hashtagController')

router.route('/hashtags').get(getHashtags).post(upsertHashtags)
router.route('/explore').get(getHashtags)
router.route('/explore/tabs/:category').get(getHashTagsByCategory)
router.route('/search').post(getSearchResults)

module.exports = router
