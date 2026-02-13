'use client';

/**
 * User Menu
 * Dropdown menu for user actions (profile, settings, logout)
 */

import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore, useUser, useCurrentOrg } from '@/presentation/stores/auth.store';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useUser();
  const currentOrg = useCurrentOrg();
  const logout = useAuthStore((state) => state.logout);
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

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  // Get initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="
          flex items-center gap-2
          p-1.5
          hover:bg-gray-100
          rounded-lg
          transition-colors
          disabled:opacity-50
        "
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="
            h-8 w-8 rounded-full
            bg-indigo-100 text-indigo-600
            flex items-center justify-center
            text-sm font-medium
          ">
            {initials}
          </div>
        )}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="
          absolute top-full right-0 mt-1
          w-64
          bg-white border border-gray-200 rounded-lg shadow-lg
          z-50
        ">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="
                  h-10 w-10 rounded-full
                  bg-indigo-100 text-indigo-600
                  flex items-center justify-center
                  text-sm font-medium
                ">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            {currentOrg && (
              <p className="mt-2 text-xs text-gray-500">
                {currentOrg.name} ({currentOrg.role})
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to profile - would need router here
                window.location.href = '/settings/profile';
              }}
              className="
                flex items-center gap-2
                w-full px-4 py-2
                text-sm text-gray-700
                hover:bg-gray-50
                transition-colors
              "
            >
              <User className="h-4 w-4 text-gray-400" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/settings';
              }}
              className="
                flex items-center gap-2
                w-full px-4 py-2
                text-sm text-gray-700
                hover:bg-gray-50
                transition-colors
              "
            >
              <Settings className="h-4 w-4 text-gray-400" />
              <span>Settings</span>
            </button>
          </div>

          <div className="border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2
                w-full px-4 py-2
                text-sm text-red-600
                hover:bg-red-50
                transition-colors
              "
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
