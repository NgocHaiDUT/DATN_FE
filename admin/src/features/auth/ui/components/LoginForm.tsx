import React, { useState } from 'react'
import { useI18n } from '../../../../shared/i18n/I18nContext'

interface Props {
  onSubmit: (email: string, password: string) => void
  loading?: boolean
  error?: string | null
}

export const LoginForm: React.FC<Props> = ({ onSubmit, loading, error }) => {
  const { t } = useI18n()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(email, password)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md w-full bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-pink-50"
    >
      <div className="mb-6">
        <p className="text-xs font-medium tracking-wide text-pink-500 mb-1 uppercase">
          {t('auth.adminPanel')}
        </p>
        <h2 className="text-2xl font-semibold text-gray-900">{t('auth.signInTitle')}</h2>
        <p className="text-xs text-gray-500 mt-1">
          {t('auth.signInDesc')}
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/80 focus:border-pink-400 transition-shadow"
          placeholder={t('auth.emailPlaceholder')}
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/80 focus:border-pink-400 transition-shadow"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-center justify-between mb-6 text-xs">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-gray-300 text-[10px]">
            i
          </span>
          <span>{t('auth.demoAccount')}</span>
        </div>
        <button
          type="button"
          className="text-pink-500 hover:text-pink-600 font-medium"
        >
          {t('auth.forgotPassword')}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-60 text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        {loading ? t('auth.signingIn') : t('auth.signIn')}
      </button>
    </form>
  )
}
