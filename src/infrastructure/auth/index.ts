/**
 * Auth Infrastructure
 * Export all auth utilities
 */

// JWT
export {
  createToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  shouldRefreshToken,
  type CreateTokenInput,
} from './jwt';

// Cookies
export {
  setAuthCookie,
  getAuthCookie,
  clearAuthCookie,
  hasAuthCookie,
} from './cookies';

// Google OAuth
export {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleProfile,
  generateOAuthState,
  parseOAuthState,
  createOAuthState,
} from './google';

// Helpers
export {
  getCurrentUser,
  getJWTPayload,
  requireAuth,
  requireOrgMember,
  requireOrgOwner,
  AuthError,
  getClientIP,
  getUserAgent,
} from './helpers';
