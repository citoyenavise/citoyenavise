/**
 * Admin Middleware
 * Vérifie que l'utilisateur est authentifié et a le rôle admin
 */

export const checkAdmin = (req, res, next) => {
  // Vérifier authentification
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }

  // Vérifier rôle admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
};

export default { checkAdmin };
