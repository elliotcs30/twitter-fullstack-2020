const { User, Tweet, Like, Reply } = require('../models')
const { getUser } = require('../_helpers')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const adminController = {
  signInPage: (req, res) => {
    return res.render('admin/signin')
  },
  signIn: async (req, res, next) => {
    try {
      if (getUser(req).role === 'user') {
        req.flash('error_messages', '請前往前台登入')
        res.redirect('/admin/signin')
      }
      req.flash('success_messages', '成功登入！')
      return res.redirect('/admin/tweets')
    } catch (err) {
      next(err)
    }
  },
  getTweets: (req, res, next) => {
    const DEFAULT_LIMIT = 10
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    Tweet.findAndCountAll({
      include: [User],
      limit,
      offset,
      raw: true,
      nest: true,
      order: [['created_at', 'DESC']] // 反序
    })
      .then(tweets => {
        const result = tweets.rows.map(tweet => {
          return {
            ...tweet,
            description: tweet.description.substring(0, 50)
          }
        })
        return res.render('admin/tweets', { tweets: result, pagination: getPagination(limit, page, tweets.count) })
      })
      .catch(err => next(err))
  },
  deleteTweet: async (req, res, next) => {
    try {
      const TweetId = req.params.id
      const tweet = await Tweet.findByPk(TweetId)
      await tweet.destroy()
      await Reply.destroy({ where: { TweetId } })
      await Like.destroy({ where: { TweetId } })

      req.flash('success_messages', '成功刪除')
      res.redirect('back')
    } catch (err) {
      next(err)
    }
  },
  logout: (req, res, next) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/admin/signin')
  },
  getUsers: (req, res, next) => {
    return User.findAll({
      nest: true, // 資料庫拿回來的資料可以比較整齊
      include: [
        { model: Tweet, include: [Like] },
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' }]
    })
      .then(data => {
        const users = data
          .filter(user => user.role !== 'admin')
          .map(userData => {
            const userJson = userData.toJSON()
            delete userJson.password // 新增這裡，刪除密碼(移除敏感資料)

            return {
              ...userJson,
              tweetCounts: userData.Tweets.length,
              likeCounts: userData.Tweets.reduce((acc, cur) => {
                return acc + cur.Likes.length
              }, 0),
              followerCounts: userData.Followers.length,
              followingCounts: userData.Followings.length
            }
          })
          .sort((a, b) => b.tweetCounts - a.tweetCounts)
        return res.render('admin/users', { users })
      })
      .catch(err => next(err))
  }
}

module.exports = adminController
