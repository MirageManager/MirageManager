const jwt = require('jsonwebtoken');

const CFG = require('../../../helpers/cfg_helper').CFG
const errorHelper = require('./errors')
const ManagerError = errorHelper.ManagerError

module.exports.login = function(login_body) {
  const { name, password } = login_body
  if (name ===  CFG.authentication.admin_user && password === CFG.authentication.admin_pw) {
      const token = jwt.sign({
          name: name,
          exp: Math.floor(Date.now() / 1000) + CFG.authentication.admin_session_duration_s
      }, CFG.authentication.jwt_key)
      return {token: token}
  } else {
      throw new ManagerError('Invalid credentials',401)
  }
}