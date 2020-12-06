const logger = require('../../../helpers/log_helper')

module.exports = function (req, res, next) {
  let base_info = req.method + " " + req.path
  logger.debug('-> ' + base_info);
  logger.debug("body: " + JSON.stringify(req.body))
  logger.debug("params: " + JSON.stringify(req.params))
  res.on('finish', () => {
    logger.info(base_info + ": " + res.statusCode + ' <-')
  })
  next();
}