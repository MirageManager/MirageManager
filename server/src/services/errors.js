const logger = require('../../../helpers/log_helper')

module.exports.ManagerError = class ManagerError extends Error {  
    constructor (message, status) {
      super(message)
      this.name = this.constructor.name
      this.status = status
    }
    statusCode() {
      return this.status
    }
}

let handleMongoValError = function (error) {
  let fields = []
  for (err of error.errors) {
    fields.push(err)
  }
  let message = `Fields ${fields.join(', ')} are wrongly formated`
  return {error: {code: error.status, msg: message}}
}

module.exports.handle = function(error) {
    logger.error("ERROR: " + error.message)
    logger.debug(error.stack)
    switch (error.name) {
      case "ManagerError": 
        return {error: {code: error.status, msg: error.message}}
      case "ValidationError":
        return handleMongoValError(error)
      default:
        return {error: {code: 500, msg: error.message}}
    }
}
