const fs = require('fs')
const path = require('path')
const express = require('express')
const https = require('https')

process.env.root_path = path.resolve('../')
const CFG = require('../../helpers/cfg_helper').CFG

const loginRouter = require('./routers/login')
const hostRouter = require('./routers/host')
const imageRouter = require('./routers/image')

const migrations = require('./middleware/migrations')
const logger = require('../../helpers/log_helper')
const logging_middleware = require('./middleware/logging')
const init = require('./services/init')


var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(logging_middleware)
if (CFG.mirage_manager.migration.boost)
  app.use('/hosts/:host_id/unikernels/:unikernel_id/states', migrations.mw)
app.use('/hosts', hostRouter)
app.use('/login', loginRouter)
app.use('/images', imageRouter)

let start = async function () {
  await init.connect_mongoose()
  init.check_git()
  if (!init.init_repo()) init.update_repo()
  await init.init_host_connections()
  if (CFG.webserver.tls === 'true') {
    https.createServer({
      key: fs.readFileSync(CFG.webserver.ssl_key),
      cert: fs.readFileSync(CFG.webserver.ssl_cert),
      passphrase: CFG.webserver.passphrase
    }, app)
    .listen(CFG.webserver.port, () => {logger.info("Listening on port: " + CFG.webserver.port)});
  } else {
    app.listen(CFG.webserver.port, function () {
      logger.warn("Warning, communication is not encrypted!")
      logger.info("Listening on port: " + CFG.webserver.port)
    });
  }
}

try {
  start()
} catch (err) {
  logger.error(err.message)
  logger.debug(err.stack)
  process.exit(1)
}