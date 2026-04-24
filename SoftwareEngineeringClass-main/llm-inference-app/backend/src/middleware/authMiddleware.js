const authMiddleware = (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No active local session',
      error: { code: 'NO_SESSION' }
    });
  }

  req.user = { userId: String(userId) };
  next();
};

module.exports = authMiddleware;
