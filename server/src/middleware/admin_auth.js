const jwt = require('jsonwebtoken')
const CFG = require('../../../helpers/cfg_helper').CFG

module.exports = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, CFG.authentication.jwt_key)
        if (data.name === CFG.authentication.admin_user) {
            next()
        } else {
            throw new Error()
        }
    } catch (err) {
        res.status(401).send('Not authorized to access this resource')
    } 
}