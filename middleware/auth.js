const helpers = require('../_helpers')

const authenticated = (req, res, next) => {
  if (helpers.ensureAuthenticated(req)) {
    if (helpers.getUser(req).role === 'admin') {
      req.flash('error_messages', '管理者帳號無法進入使用者平台')
      res.redirect('/admin/tweets')
    }
    return next()
  }
  req.flash('error_messages', '請先登入才能使用')
  res.redirect('/signin')
}

const authenticatedAdmin = (req, res, next) => {
  if (helpers.ensureAuthenticated(req)) {
    if (helpers.getUser(req).role === 'admin') return next()
  }
  req.flash('error_messages', '請登入管理者帳號，或請由前台登入')
  res.redirect('/admin/signin')
}

const authenticatedLimit = (req, res, next) => {
  if (helpers.getUser(req).id === Number(req.params.id)) return next()
  res.json({ status: 'error', data: '只能修改自己的資料' })
  res.redirect(200, 'back')
}

module.exports = {
  authenticated,
  authenticatedAdmin,
  authenticatedLimit
}
