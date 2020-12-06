const jwt = require('jsonwebtoken');

const Unikernel = require('../models/unikernel');
const admin_auth = require('./admin_auth')
const logger = require('../../../helpers/log_helper')
const CFG = require('../../../helpers/cfg_helper').CFG

module.exports = async(req, res, next) => {
    try {    
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, CFG.authentication.jwt_key)
        const unikernel = await Unikernel.findOne({ _id: data._id, 'tokens.token': token })
        req.body.id = unikernel._id
        next()
    } catch (error) {
        logger.error("AUTH_ERROR: ", error.message)
        logger.debug(error.stack)
        res.status(401).send('Not authorized to access this resource')
    }
}