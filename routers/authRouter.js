const express = require('express')
const User = require('../models/User')

const router = express.Router()
const {
  login,
  register,
  googleLoginOrRegister,
} = require('../controllers/auth')

router.route('/login').post(login)
router.route('/register').post(register)
router.route('/googleLogin').post(googleLoginOrRegister)

module.exports = router
