module.exports = async function (req, res, next) {
  if (req.unikernel.status === 'started' || req.unikernel.status === 'migration_ready') {
    req.unikernel.status = 'connected'
    await req.unikernel.save()
    next()
  } else next()
}