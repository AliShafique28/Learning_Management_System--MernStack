// Check if user has required role(s)
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next(); // User has permission, proceed
  };
};

module.exports = { roleCheck };
