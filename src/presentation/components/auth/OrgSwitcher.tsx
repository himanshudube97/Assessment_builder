'use client';

/**
 * Organization Switcher
 * Dropdown to switch between organizations
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Building2 } from 'lucide-react';
import { useAuthStore, useCurrentOrg, useOrganizations } from '@/presentation/stores/auth.store';

interface OrgSwitcherProps {
  onCreateOrg?: () => void;
}

export function OrgSwitcher({ onCreateOrg }: OrgSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOrg = useCurrentOrg();
  const organizations = useOrganizations();
  const switchOrganization = useAuthStore((state) => state.switchOrganization);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentOrg) {
    return null;
  }

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrg.id) {
      setIsOpen(false);
      return;
    }

    await switchOrganization(orgId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="
          flex items-center gap-2
          px-3 py-2
          bg-white hover:bg-gray-50
          border border-gray-200 rounded-lg
          text-sm font-medium text-gray-700
          transition-colors
          disabled:opacity-50
        "
      >
        <Building2 className="h-4 w-4 text-gray-500" />
        <span className="max-w-[150px] truncate">{currentOrg.name}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="
          absolute top-full left-0 mt-1
          w-64 max-h-80 overflow-auto
          bg-white border border-gray-200 rounded-lg shadow-lg
          z-50
        ">
          <div className="p-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase px-2">
              Organizations
            </p>
          </div>

          <div className="py-1">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className="
                  flex items-center justify-between
                  w-full px-3 py-2
                  text-sm text-gray-700
                  hover:bg-gray-50
                  transition-colors
                "
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{org.name}</span>
                  <span className="
                    text-xs px-1.5 py-0.5
                    bg-gray-100 text-gray-500
                    rounded
                  ">
                    {org.role}
                  </span>
                </div>
                {org.id === currentOrg.id && (
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {onCreateOrg && (
            <>
              <div className="border-t border-gray-100" />
              <div className="p-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onCreateOrg();
                  }}
                  className="
                    flex items-center gap-2
                    w-full px-3 py-2
                    text-sm text-indigo-600
                    hover:bg-indigo-50
                    rounded
                    transition-colors
                  "
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Organization</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
