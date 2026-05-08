/**
 * Service d'authentification
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../../../core/services/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../../core/utils/jwt');
const { AppError } = require('../../../core/middleware/errorHandler');
const logger = require('../../../core/utils/logger');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

if (BCRYPT_ROUNDS < 12) {
  throw new Error(`BCRYPT_ROUNDS must be >= 12 for security. Current: ${BCRYPT_ROUNDS}`);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function registerUser({ email, password, username }) {
  const existingUser = await query(
    'SELECT id FROM users WHERE email = LOWER($1)',
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new AppError('Email already registered', 409);
  }

  const existingUsername = await query(
    'SELECT id FROM users WHERE username = $1',
    [username]
  );
  if (existingUsername.rows.length > 0) {
    throw new AppError('Username already taken', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;
  let profile;
  try {
    await transaction(async (client) => {
      const userId = uuidv4();
      const userResult = await client.query(
        `INSERT INTO users (id, email, password_hash, username, role)
         VALUES ($1, LOWER($2), $3, $4, 'citizen')
         RETURNING id, email, username, role, is_verified, created_at`,
        [userId, email, passwordHash, username]
      );
      user = userResult.rows[0];

      const profileId = uuidv4();
      const profileResult = await client.query(
        `INSERT INTO profiles (id, user_id)
         VALUES ($1, $2)
         RETURNING id, user_id`,
        [profileId, userId]
      );
      profile = profileResult.rows[0];
    });
  } catch (err) {
    logger.error('Register transaction failed', { meta: { email, error: err.message } });
    throw new AppError('Failed to create account', 500);
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, hashToken(refreshToken)]
  );

  logger.info('User registered', { meta: { userId: user.id, email: user.email } });

  return {
    user: { ...user, email: user.email.toLowerCase() },
    profile,
    accessToken,
    refreshToken,
  };
}

async function loginUser({ email, password }) {
  const result = await query(
    'SELECT id, email, username, password_hash, role FROM users WHERE email = LOWER($1)',
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    logger.warn('Failed login attempt', { meta: { email, reason: 'invalid password' } });
    throw new AppError('Invalid email or password', 401);
  }

  await query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, hashToken(refreshToken)]
  );

  logger.info('User logged in', { meta: { userId: user.id, email } });

  return {
    user: {
      id: user.id,
      email: user.email.toLowerCase(),
      username: user.username,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

async function getCurrentUser(userId) {
  const result = await query(
    `SELECT u.id, u.email, u.username, u.role, u.is_verified,
            p.id as profile_id, p.bio, p.avatar_url, p.location, p.interests,
            p.followers_count, p.posts_count
     FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [userId]
  );

  const user = result.rows[0];
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isVerified: user.is_verified,
    profile: {
      id: user.profile_id,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      location: user.location,
      interests: user.interests,
      followersCount: user.followers_count,
      postsCount: user.posts_count,
    },
  };
}

async function refreshAccessToken(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded || !decoded.userId) {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const result = await query(
    `SELECT id, revoked_at FROM refresh_tokens
     WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()`,
    [decoded.userId, tokenHash]
  );

  if (result.rows.length === 0) {
    throw new AppError('Refresh token not found or expired', 401);
  }

  const storedToken = result.rows[0];
  if (storedToken.revoked_at) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  const userResult = await query(
    'SELECT role FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const newAccessToken = generateAccessToken(decoded.userId, userResult.rows[0].role);

  logger.info('Token refreshed', { meta: { userId: decoded.userId } });

  return {
    accessToken: newAccessToken,
  };
}

async function logout(refreshToken) {
  if (!refreshToken) {
    return { success: true };
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded && decoded.userId) {
      const tokenHash = hashToken(refreshToken);
      await query(
        `UPDATE refresh_tokens SET revoked_at = NOW()
         WHERE user_id = $1 AND token_hash = $2`,
        [decoded.userId, tokenHash]
      );
      logger.info('User logged out', { meta: { userId: decoded.userId } });
    }
  } catch (err) {
    logger.warn('Logout error', { meta: { error: err.message } });
  }

  return { success: true };
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  refreshAccessToken,
  logout,
};
