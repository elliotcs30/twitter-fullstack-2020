const express = require('express')
const router = express.Router()
const { generalErrorHandler } = require('../middleware/error-handler')
const { authenticated, authenticatedLimit } = require('../middleware/auth')
const { getRecommendedUsers } = require('../middleware/recommendedUser')

const tweetController = require('../controllers/tweet-controller')
const replyController = require('../controllers/reply-controller')
const followshipController = require('../controllers/followship-controller')
const userController = require('../controllers/user-controller')

const passport = require('../config/passport')
const admin = require('./modules/admin')
const users = require('./modules/users')
const upload = require('../middleware/multer')

router.get('/signup', userController.signUpPage)
router.post('/signup', userController.signUp)
router.get('/signin', userController.signInPage)
router.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)
router.get('/logout', userController.logout)

router.post('/tweets/:tweet_id/unlike', authenticated, tweetController.postUnlike)
router.post('/tweets/:id/unlike', authenticated, tweetController.postUnlike)
router.post('/tweets/:id/like', authenticated, tweetController.postLike)

router.get('/tweets/:id/replies', authenticated, getRecommendedUsers, replyController.getReplies)
router.post('/tweets/:id/replies', authenticated, getRecommendedUsers, replyController.postReplies)

router.delete('/followships/:id', authenticated, followshipController.removeFollowing)
router.post('/followships', authenticated, followshipController.addFollowing)

router.get('/tweets', authenticated, getRecommendedUsers, tweetController.getTweets)
router.post('/tweets', authenticated, tweetController.postTweet)

// api
router.get('/api/users/:id', authenticatedLimit, userController.getUserInfo)
router.post('/api/users/:id', authenticatedLimit, upload.fields([
  { name: 'image', count: 1 },
  { name: 'coverImage', count: 1 }
]), userController.postUser)

router.use('/admin', admin)
router.use('/users', authenticated, getRecommendedUsers, users)

router.use('/', (req, res) => res.redirect('/tweets'))
router.use('/', generalErrorHandler)

module.exports = router
