let winston = require('winston');
const CFG = require('./cfg_helper').CFG

winston.configure({
    level: CFG.logging.log_level,
    format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.align(),
            winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
    transports: [
        new winston.transports.Console({'timestamp': true})
    ]
});

module.exports = winston