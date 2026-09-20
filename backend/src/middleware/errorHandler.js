export function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  })
}
