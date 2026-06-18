import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../../../shared/i18n/I18nContext'

interface Props {
  email: string
  deviceId: string
  onBack: () => void
  onSuccess?: () => void
}

export const DeviceVerificationForm: React.FC<Props> = ({ email, deviceId, onBack, onSuccess }) => {
  const { t } = useI18n()
  const { verifyDevice } = useAuth()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyDevice(email, deviceId, otp.trim())
      setLoading(false)
      onSuccess && onSuccess()
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || t('auth.verificationFailed'))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md w-full bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-pink-50"
    >
      <div className="mb-6">
        <p className="text-xs font-medium tracking-wide text-pink-500 mb-1 uppercase">
          {t('auth.deviceVerification')}
        </p>
        <h2 className="text-2xl font-semibold text-gray-900">{t('auth.otpTitle')}</h2>
        <p className="text-xs text-gray-500 mt-1">
          {t('auth.otpDesc', { email })}
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.otpLabel')}</label>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full tracking-widest text-center text-lg px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/80 focus:border-pink-400 transition-shadow"
          placeholder="••••••"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
        >
          {t('auth.backToLogin')}
        </button>
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 disabled:opacity-60 text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          {loading ? t('auth.verifying') : t('auth.verifyDevice')}
        </button>
      </div>

      <p className="text-[11px] text-gray-500 mt-3">
        {t('auth.deviceHelp')}
      </p>
    </form>
  )
}

export default DeviceVerificationForm
