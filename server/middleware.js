// HTTPS required
function requireHTTPS(req, res, next){
  // The 'x-forwarded-proto' check is for Heroku
  if (req.get('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.get('host')}${req.url}`);
  } else {
    next();
  }
}

module.exports = {
  requireHTTPS
}