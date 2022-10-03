const adminController = {
  getTwitters: (req, res) => {
    return res.render('admin/twitters')
  },
  signInPage: (req, res) => {
    return res.render('admin/signin')
  },
  usersPage: (req, res) => {
    res.render('admin/users')
  }
}

module.exports = adminController
