'use client';

import { useCallback } from 'react';
import { Building2, Image, Crown } from 'lucide-react';
import type { AssessmentSettings, SubscriptionTier } from '@/domain/entities/assessment';

interface BrandingPanelProps {
  settings: Partial<AssessmentSettings>;
  onChange: (updates: Partial<AssessmentSettings>) => void;
}

export function BrandingPanel({ settings, onChange }: BrandingPanelProps) {
  const subscriptionTier = settings.subscriptionTier || 'free';
  const companyName = settings.companyName || '';
  const logoUrl = settings.logoUrl || '';

  const handleTierChange = useCallback((tier: SubscriptionTier) => {
    onChange({ subscriptionTier: tier });
  }, [onChange]);

  const handleCompanyNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ companyName: e.target.value || null });
  }, [onChange]);

  const handleLogoUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ logoUrl: e.target.value || null });
  }, [onChange]);

  return (
    <div className="space-y-6">
      {/* Subscription Tier */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Subscription Tier
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['free', 'pro', 'enterprise'] as SubscriptionTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => handleTierChange(tier)}
              className={`
                px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                ${subscriptionTier === tier
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-muted-foreground'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                {tier === 'free' && <span className="text-lg">🆓</span>}
                {tier === 'pro' && <Crown className="h-5 w-5" />}
                {tier === 'enterprise' && <Building2 className="h-5 w-5" />}
                <span className="capitalize">{tier}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {subscriptionTier === 'free' && 'Shows "Powered by Assess" watermark'}
          {subscriptionTier === 'pro' && 'Removes watermark + custom branding'}
          {subscriptionTier === 'enterprise' && 'Full white-label capabilities'}
        </p>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Company Name
          {subscriptionTier === 'free' && (
            <span className="ml-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded">
              Pro+
            </span>
          )}
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={companyName}
            onChange={handleCompanyNameChange}
            placeholder="Your Company Name"
            disabled={subscriptionTier === 'free'}
            className={`
              w-full pl-10 pr-4 py-2 rounded-lg border bg-background
              ${subscriptionTier === 'free'
                ? 'border-border/50 text-muted-foreground cursor-not-allowed opacity-60'
                : 'border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
              }
            `}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {subscriptionTier === 'free'
            ? 'Upgrade to Pro to customize company name'
            : 'This will appear in place of "Assess" branding'
          }
        </p>
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Logo URL
          {subscriptionTier === 'free' && (
            <span className="ml-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded">
              Pro+
            </span>
          )}
        </label>
        <div className="relative">
          <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="url"
            value={logoUrl}
            onChange={handleLogoUrlChange}
            placeholder="https://example.com/logo.png"
            disabled={subscriptionTier === 'free'}
            className={`
              w-full pl-10 pr-4 py-2 rounded-lg border bg-background
              ${subscriptionTier === 'free'
                ? 'border-border/50 text-muted-foreground cursor-not-allowed opacity-60'
                : 'border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
              }
            `}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {subscriptionTier === 'free'
            ? 'Upgrade to Pro to add custom logo'
            : 'Enter a URL to your logo image (recommended: square, max 200x200px)'
          }
        </p>

        {/* Logo Preview */}
        {logoUrl && subscriptionTier !== 'free' && (
          <div className="mt-3 p-3 border border-border rounded-lg bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview:</p>
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-2">
          💡 Premium Features
        </h4>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span><strong>Pro:</strong> Remove watermark + custom branding (logo & name)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">✓</span>
            <span><strong>Enterprise:</strong> Complete white-label + priority support</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
