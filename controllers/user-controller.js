const bcrypt = require('bcryptjs')
const helpers = require('../_helpers')
const { User, Tweet, Reply, Like, Followship } = require('../models')
const { getUser } = require('../_helpers')
const { imgurFileHandler } = require('../helpers/file-helpers')

const userController = {
  signInPage: (req, res) => {
    res.render('signin')
  },
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    const { account, name, email, password, checkPassword } = req.body

    if (password !== checkPassword) {
      throw new Error('密碼與確認密碼不相符！')
    }
    if (!account || !name || !email || !password || !checkPassword) {
      throw new Error('所有欄位都是必填。')
    }
    if (name.length > 50) {
      throw new Error('名稱上限為50字')
    }

    Promise.all([
      User.findOne({ where: { account } }),
      User.findOne({ where: { email } })
    ])
      .then(([account, email]) => {
        if (account) {
          throw new Error('account 已重複註冊！')
        }
        if (email) {
          throw new Error('email 已重複註冊！')
        }
        return bcrypt.hash(password, 10)
      })
      .then(hash => {
        if (hash) {
          return User.create({ account, name, email, password: hash, role: 'user' })
        }
      })
      .then(user => {
        if (user) {
          req.flash('success_messages', '成功註冊帳號！')
          res.redirect('/signin')
        }
      })
      .catch(err => next(err))
  },
  signIn: (req, res) => {
    if (getUser(req).role === 'admin') {
      req.flash('error_messages', '請前往後台登入')
      return res.redirect('/signin')
    }
    req.flash('success_messages', '成功登入！')
    res.redirect('/tweets')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  tweets: async (req, res, next) => {
    try {
      const user = helpers.getUser(req)
      const id = req.params.id
      const personal = await User.findByPk(id, {
        include: [
          Tweet,
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' }
        ]
      })
      const tweetsList = await Tweet.findAll({
        where: { ...personal ? { UserId: personal.id } : {} },
        include: [User, Reply, Like],
        order: [
          ['created_at', 'DESC']
        ]
      })
      const followingsId = user?.Followings?.map(f => f.id)
      user.isFollowed = (followingsId.includes(personal.id))
      const tweets = tweetsList.map(tweet => ({
        ...tweet.toJSON(),
        isLiked: tweet.Likes.some(t => t.UserId === user.id)
      }))
      return res.render('profile', { tweets, user, personal: personal.toJSON() })
    } catch (err) {
      next(err)
    }
  },
  replies: async (req, res, next) => {
    try {
      const user = getUser(req)
      const id = req.params.id
      const personal = await User.findByPk(id, {
        include: [
          Tweet,
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' },
          { model: Like, as: Tweet }
        ]
      })
      const repliesList = await Reply.findAll({
        where: { ...personal ? { UserId: personal.id } : {} },
        include: [
          User,
          { model: Tweet, include: User }],
        order: [['created_at', 'DESC']]
      })
      const followingsId = user?.Followings?.map(f => f.id)
      user.isFollowed = (followingsId.includes(personal.id))
      const replies = repliesList.map(reply => ({
        ...reply.toJSON()
      }))
      return res.render('profile-reply', { replies, user, personal: personal.toJSON() })
    } catch (err) {
      next(err)
    }
  },
  likes: async (req, res, next) => {
    try {
      const user = helpers.getUser(req)
      const id = req.params.id
      const personal = await User.findByPk(id, {
        include: [
          Tweet,
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' },
          { model: Like, as: Tweet }
        ]
      })

      const likedTweetsId = personal?.Likes.map(like => like.TweetId)
      const tweetsList = await Tweet.findAll({
        where: {
          ...likedTweetsId ? { id: likedTweetsId } : {}
        },
        include: [
          User,
          Reply,
          Like
        ],
        order: [
          ['created_at', 'DESC']
        ]
      })

      const followingsId = user?.Followings?.map(f => f.id)
      user.isFollowed = (followingsId.includes(personal.id))
      const tweets = tweetsList.map(tweet => ({
        ...tweet.toJSON(),
        isLiked: true
      }))
      return res.render('profile-like', { tweets, user, personal: personal.toJSON() })
    } catch (err) {
      next(err)
    }
  },
  postTweet: async (req, res, next) => {
    try {
      const id = req.params.id
      const { description } = req.body
      if (description.trim() === '') {
        req.flash('error_messages', 'Tweet 內容不能為空')
        return res.redirect('back')
      }
      if (description.length > 140) {
        req.flash('error_messages', 'Tweet 字數不能超過140字')
        return res.redirect('back')
      }
      await Tweet.create({
        description,
        UserId: id
      })
        .then(() => {
          req.flash('success_messages', '成功推文')
          return res.redirect('/tweets')
        })
        .catch(err => next(err))
    } catch (err) {
      next(err)
    }
  },
  postLike: async (req, res, next) => {
    try {
      const id = req.params.id
      await Like.create({
        UserId: id,
        TweetId: req.params.tweet_id
      })
      req.flash('success_messages', '成功 like!')
      return res.redirect('back')
    } catch (err) {
      next(err)
    }
  },
  postUnlike: async (req, res, next) => {
    try {
      const id = req.params.id
      return Promise.all([
        Like.findOne({
          where: {
            UserId: id,
            TweetId: req.params.tweet_id
          }
        })
      ]).then(like => {
        if (!like) return req.flash('error_messages', '你沒有like這個tweet!')
        like.destroy()
        req.flash('success_messages', '成功 unlike!')
        return res.redirect('back')
      }).catch(err => next(err))
    } catch (err) {
      next(err)
    }
  },
  followers: (req, res, next) => {
    const id = req.params.id
    const currentUser = getUser(req)

    return User.findByPk(id, {
      nest: true,
      include: [Tweet, { model: User, as: 'Followers' }]
    })
      .then(user => {
        const followers = user.Followers.map(user => {
          return {
            ...user.toJSON(),
            isFollowed: currentUser?.Followings.some(f => f.id === user.id)
          }
        }).sort((a, b) => b.Followship.createdAt - a.Followship.createdAt)
        res.render('followers', { user: user.toJSON(), followers })
      })
      .catch(err => next(err))
  },
  followings: (req, res, next) => {
    const id = req.params.id
    const currentUser = getUser(req)

    return User.findByPk(id, {
      nest: true,
      include: [Tweet, { model: User, as: 'Followings' }]
    })
      .then(user => {
        const followings = user.Followings.map(user => {
          return {
            ...user.toJSON(),
            isFollowed: currentUser?.Followings.some(f => f.id === user.id)
          }
        }).sort((a, b) => b.Followship.createdAt - a.Followship.createdAt)
        res.render('followings', { user: user.toJSON(), followings })
      })
      .catch(err => next(err))
  },
  addFollowing: async (req, res, next) => {
    const id = req.params.id
    if (id === Number(req.body.id)) {
      req.flash('error_messages', '不能追隨自己！')
      return res.redirect(200, 'back')
    }
    Promise.all([
      User.findByPk(id),
      Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: req.params.userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You are already following this user!')
        return Followship.create({
          followerId: req.user.id,
          followingId: id
        })
      })
      .then(() => {
        req.flash('success_messages', '追隨成功！')
        res.redirect('back')
      })
      .catch(err => next(err))
  },
  removeFollowing: (req, res, next) => {
    Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")
        return followship.destroy()
      })
      .then(() => {
        req.flash('success_messages', '取消追隨成功！')
        res.redirect('back')
      })
      .catch(err => next(err))
  },
  // 暫時調整為get，與下方命名規則相同
  getSetting: async (req, res) => {
    const id = req.params.id
    const user = await User.findByPk(id, { raw: true })
    if (user.id !== getUser(req).id) throw new Error('無法編輯其他人資料!')
    res.render('setting', user)
  },
  // post -> 新增 | put -> 修改
  putSetting: async (req, res, next) => {
    try {
      const { editAccount, editName, editEmail, editPassword, editCheckPassword } = req.body
      const { id, account, email } = getUser(req)

      if (editPassword !== editCheckPassword) throw new Error('密碼與確認密碼不符')
      if (editName.length > 50) throw new Error('超過字數，字數要在50字以內')
      if (editAccount !== account) {
        const exitAccount = await User.findOne({ where: { account: editAccount } })
        if (exitAccount) throw new Error(' 帳號已重複註冊！')
      }
      if (editEmail !== email) {
        const exitEmail = await User.findOne({ where: { email: editEmail } })
        if (exitEmail) throw new Error('Email已重複註冊！')
      }
      const editUser = await User.findByPk(id)
      await editUser.update({
        account: editAccount,
        name: editName,
        email: editEmail,
        password: await bcrypt.hash(editPassword, 10)
      })
      req.flash('success_messages', '成功更新！')
      res.redirect(`/users/${id}/setting`)
    } catch (err) {
      next(err)
    }
  },

  // api routes
  getUserInfo: (req, res, next) => {
    // User.findByPk(getUser(req).id) 這樣子寫不會過
    const id = req.params.id
    User.findByPk(id) // 要傳入 id test 才會過
      .then(userData => {
        if (!userData) throw new Error("user didn't exist")

        const user = userData.toJSON()
        delete user.password // 新增這裡，刪除密碼(移除敏感資料)
        res.json({ status: 'success', ...user })
      })
      .catch(err => next(err))
  },
  postUser: async (req, res, next) => {
    const userId = req.params.id
    const { files } = req
    const { name, introduction } = req.body

    const user = await User.findByPk(userId)
    if (!user) throw new Error("user didn't exist")
    let avatarFilePath = user.dataValues.avatar
    let coverFilePath = user.dataValues.cover

    if (files?.image) {
      avatarFilePath = await imgurFileHandler(...files.image)
    }

    if (files?.coverImage) {
      coverFilePath = await imgurFileHandler(...files.coverImage)
    }

    await user.update({
      name,
      introduction,
      avatar: avatarFilePath,
      cover: coverFilePath
    })
    req.flash('success_messages', '個人資料儲存成功 !')
    return res.json({ status: 'success', ...user.toJSON() })
  }
}
module.exports = userController
