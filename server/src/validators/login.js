module.exports = function (req, res, next) {
  if (!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('password') ) {
    res.status(400).send('Name and password are required to login')
  } else {
    next()
  }
}