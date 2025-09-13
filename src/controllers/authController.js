const passport = require('passport');
const { User } = require('../models');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {
  // Google OAuth login - redirect to Google
  googleLogin(req, res, next) {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })(req, res, next);
  }

  // Google OAuth callback
  async googleCallback(req, res, next) {
    passport.authenticate(
      'google',
      { failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` },
      async (err, user) => {
        if (err || !user) {
          logger.error('Google OAuth error:', err);
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }

        req.logIn(user, (err) => {
          if (err) {
            logger.error('Session login error:', err);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=session_error`);
          }

          logger.info(`User authenticated: ${user.email}`);
          // redirect frontend after login success
          res.redirect(process.env.FRONTEND_URL);
        });
      }
    )(req, res, next);
  }

  // Get current user
  async getCurrentUser(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json(
          ApiResponse.unauthorized('User not authenticated')
        );
      }

      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'email', 'name', 'avatar'],
      });

      if (!user) {
        return res.status(404).json(
          ApiResponse.notFound('User not found')
        );
      }

      res.json(ApiResponse.success({ user }, 'User data retrieved'));
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json(
        ApiResponse.error('Failed to fetch user data', 500)
      );
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      req.logout((err) => {
        if (err) logger.error('Logout error:', err);
      });

      req.session.destroy((err) => {
        if (err) logger.error('Session destroy error:', err);
      });

      logger.info(`User logged out: ${req.user?.email}`);
      res.json(ApiResponse.success(null, 'Logged out successfully'));
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json(
        ApiResponse.error('Logout failed', 500)
      );
    }
  }
}

module.exports = new AuthController();
