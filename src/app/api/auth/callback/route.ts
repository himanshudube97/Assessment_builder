/**
 * OAuth Callback Route
 * GET /api/auth/callback - Handles Google OAuth callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  exchangeCodeForTokens,
  getGoogleProfile,
  parseOAuthState,
  createToken,
  setAuthCookie,
} from '@/infrastructure/auth';
import {
  getUserRepository,
  getOrganizationRepository,
  getMembershipRepository,
  getInviteRepository,
} from '@/infrastructure/database/repositories';
import { generateSlug } from '@/domain/entities/organization';
import { isInviteValid } from '@/domain/entities/invite';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, request.url)
    );
  }

  // Validate required params
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/login?error=missing_params', request.url)
    );
  }

  // Validate state for CSRF protection
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_state', request.url)
    );
  }

  // Clear state cookie
  cookieStore.delete('oauth_state');

  // Parse state for invite token
  const { inviteToken } = parseOAuthState(state);

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user profile from Google
    const profile = await getGoogleProfile(tokens.accessToken);

    // Get repositories
    const userRepo = getUserRepository();
    const orgRepo = getOrganizationRepository();
    const membershipRepo = getMembershipRepository();
    const inviteRepo = getInviteRepository();

    // Find or create user
    let user = await userRepo.findByGoogleId(profile.id);
    let isNewUser = false;

    if (!user) {
      // Check if user exists by email (might have been invited)
      user = await userRepo.findByEmail(profile.email);

      if (user) {
        // Link Google account to existing user
        user = await userRepo.update(user.id, {
          googleId: profile.id,
          name: profile.name,
          avatarUrl: profile.picture || null,
        });
      } else {
        // Create new user
        user = await userRepo.create({
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.picture || null,
          googleId: profile.id,
        });
        isNewUser = true;
      }
    } else {
      // Update user info from Google
      user = await userRepo.update(user.id, {
        name: profile.name,
        avatarUrl: profile.picture || null,
      });
    }

    // Handle invite if present
    let targetOrgId: string | null = null;
    let targetOrgRole: 'owner' | 'member' = 'member';

    if (inviteToken) {
      const invite = await inviteRepo.findByToken(inviteToken);

      if (invite && isInviteValid(invite)) {
        // Check if email matches
        if (invite.email.toLowerCase() === profile.email.toLowerCase()) {
          // Create membership
          const existingMembership = await membershipRepo.findByOrgAndUser(
            invite.organizationId,
            user.id
          );

          if (!existingMembership) {
            await membershipRepo.create({
              organizationId: invite.organizationId,
              userId: user.id,
              role: invite.role,
              invitedBy: invite.invitedBy,
            });
          }

          // Mark invite as accepted
          await inviteRepo.updateStatus(invite.id, 'accepted', user.id);

          targetOrgId = invite.organizationId;
          targetOrgRole = invite.role;
        }
      }
    }

    // Get user's memberships
    const memberships = await membershipRepo.findByUserId(user.id);

    // Determine which org to use
    let currentOrg: { id: string; name: string; slug: string; role: 'owner' | 'member' };

    if (targetOrgId) {
      // Use the org from invite
      const membership = memberships.find(m => m.organizationId === targetOrgId);
      if (membership) {
        currentOrg = {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
          role: targetOrgRole,
        };
      } else {
        // Fallback - shouldn't happen
        currentOrg = await createPersonalOrg(user, orgRepo, membershipRepo);
      }
    } else if (memberships.length > 0) {
      // Use last active org or first membership
      const lastActiveOrgId = user.lastActiveOrgId;
      const membership = lastActiveOrgId
        ? memberships.find(m => m.organizationId === lastActiveOrgId) || memberships[0]
        : memberships[0];

      currentOrg = {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      };
    } else {
      // Create personal organization for new user
      currentOrg = await createPersonalOrg(user, orgRepo, membershipRepo);
    }

    // Update last active org
    await userRepo.updateLastActiveOrg(user.id, currentOrg.id);

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: currentOrg.id,
      orgRole: currentOrg.role,
    });

    // Set auth cookie
    await setAuthCookie(token);

    // Redirect to dashboard
    const redirectUrl = isNewUser ? '/dashboard?welcome=true' : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', request.url)
    );
  }
}

/**
 * Helper to create personal organization for new users
 */
async function createPersonalOrg(
  user: { id: string; name: string },
  orgRepo: ReturnType<typeof getOrganizationRepository>,
  membershipRepo: ReturnType<typeof getMembershipRepository>
): Promise<{ id: string; name: string; slug: string; role: 'owner' }> {
  // Create personal organization
  const orgName = `${user.name}'s Workspace`;
  const org = await orgRepo.create({
    name: orgName,
    slug: generateSlug(orgName),
  });

  // Create owner membership
  await membershipRepo.create({
    organizationId: org.id,
    userId: user.id,
    role: 'owner',
  });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    role: 'owner',
  };
}
