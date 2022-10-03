const adminController = {
  getTwitters: (req, res) => {
    return res.render('admin/twitters')
  },
  signInPage: (req, res) => {
    return res.render('admin/signin')
  }
}

module.exports = adminController
