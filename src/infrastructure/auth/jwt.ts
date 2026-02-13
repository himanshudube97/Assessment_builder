/**
 * JWT Token Management
 * Using jose library for JWT operations
 */

import * as jose from 'jose';
import type { JWTPayload } from '@/domain/entities/auth';
import type { MembershipRole } from '@/domain/entities/membership';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_ISSUER = 'flowform';
const JWT_AUDIENCE = 'flowform-app';
const JWT_EXPIRY = '30d';

/**
 * Get the secret key for JWT operations
 */
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

export interface CreateTokenInput {
  userId: string;
  email: string;
  name: string;
  orgId: string;
  orgRole: MembershipRole;
}

/**
 * Create a new JWT token
 */
export async function createToken(input: CreateTokenInput): Promise<string> {
  const secret = getSecretKey();

  const token = await new jose.SignJWT({
    email: input.email,
    name: input.name,
    orgId: input.orgId,
    orgRole: input.orgRole,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      orgId: payload.orgId as string,
      orgRole: payload.orgRole as MembershipRole,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jose.decodeJwt(token);
    return {
      sub: decoded.sub as string,
      email: decoded.email as string,
      name: decoded.name as string,
      orgId: decoded.orgId as string,
      orgRole: decoded.orgRole as MembershipRole,
      iat: decoded.iat as number,
      exp: decoded.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return token.exp < now;
}

/**
 * Check if token should be refreshed (less than 7 days remaining)
 */
export function shouldRefreshToken(token: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;
  return token.exp - now < sevenDaysInSeconds;
}
