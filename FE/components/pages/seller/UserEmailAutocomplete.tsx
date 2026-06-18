"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/constants/endpoint';
import { useI18n } from '@/lib/i18n/I18nContext';

interface User {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface UserEmailAutocompleteProps {
  value: string;
  onChange: (email: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function UserEmailAutocomplete({
  value,
  onChange,
  label = "Email",
  placeholder = "Nhập email nhân viên...",
  required = false,
  id = "email",
}: UserEmailAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  // Debounced search
  useEffect(() => {
    if (value.length < 2) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await apiClient(`${ENDPOINTS.SEARCH.USERS}?q=${encodeURIComponent(value)}&limit=10`);
        if (response && Array.isArray(response.users)) {
          setSearchResults(response.users);
          setIsOpen(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: User) => {
    onChange(user.email);
    setIsOpen(false);
    setSearchResults([]);
  };

  return (
    <div className="relative">
      <Label htmlFor={id}>{label} {required && <span className="text-red-500">*</span>}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="mt-1"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {t('seller.staff.emailHint')}
      </p>

      {/* Dropdown */}
      {isOpen && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="py-1">
            {searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs">
                    {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 
                     user.email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name || t('seller.staff.noName')}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
                <Mail className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
