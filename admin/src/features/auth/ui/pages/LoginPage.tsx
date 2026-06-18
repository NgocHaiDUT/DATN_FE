import React, { useState } from 'react'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../../hooks/useAuth'
import { DeviceVerificationForm } from '../components/DeviceVerificationForm'
import { useI18n } from '../../../../shared/i18n/I18nContext'

interface Props {
  onSuccess?: () => void
}

export const LoginPage: React.FC<Props> = ({ onSuccess }) => {
  const { t } = useI18n()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string>('')
  const [pendingDeviceId, setPendingDeviceId] = useState<string>('')

  const handleSubmit = async (email: string, password: string) => {
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      setLoading(false)
      onSuccess && onSuccess()
    } catch (err: any) {
      setLoading(false)
      if (err && err.code === 'DEVICE_VERIFICATION_REQUIRED') {
        setNeedsVerification(true)
        setPendingEmail(err.email || email)
        setPendingDeviceId(err.deviceId || '')
        setError(t('auth.otpSent'))
      } else {
        setError(err?.message || t('auth.loginFailed'))
      }
    }
  }

  const resetFlow = () => {
    setNeedsVerification(false)
    setPendingEmail('')
    setPendingDeviceId('')
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left: Branding / intro */}
        <div className="hidden md:block">
          <div className="mb-6 inline-flex items-center gap-3 px-3 py-2 bg-white/70 rounded-full shadow-sm border border-pink-100">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">MakeupAI Admin</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-snug">
            {t('auth.loginHeroTitle')}<br />
            <span className="text-pink-500">{t('auth.loginHeroHighlight')}</span>
          </h1>
          <p className="text-gray-600 mb-6 text-sm lg:text-base max-w-md">
            {t('auth.loginHeroDesc')}
          </p>

          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">✓</span>
              {t('auth.loginFeatureRevenue')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">✓</span>
              {t('auth.loginFeatureUsers')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">✓</span>
              {t('auth.loginFeatureContent')}
            </li>
          </ul>
        </div>

        {/* Right: Login or OTP card */}
        <div className="flex justify-center">
          {!needsVerification ? (
            <LoginForm onSubmit={handleSubmit} loading={loading} error={error} />
          ) : (
            <DeviceVerificationForm
              email={pendingEmail}
              deviceId={pendingDeviceId}
              onBack={resetFlow}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
