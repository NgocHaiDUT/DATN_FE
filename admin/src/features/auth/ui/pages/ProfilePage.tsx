import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../../../shared/i18n/I18nContext'

interface ProfileFieldProps {
  label: string
  value: string | undefined
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm font-medium text-gray-900 mt-1">{value || 'N/A'}</span>
  </div>
)

export const ProfilePage: React.FC = () => {
  const { t } = useI18n()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          {t('profile.unavailable')}
        </div>
      </div>
    )
  }

  const fallbackName = user.name || t('profile.admin')
  const initials = fallbackName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()
  const statusLabel = user.isActive === false ? t('profile.disabled') : t('status.active')
  const passwordStatus = user.firstLogin ? t('profile.requiresUpdate') : t('profile.updated')

  const handleChangePassword = () => {
    // TODO: replace with modal or dedicated form once API is ready
    console.log('Change password clicked')
    alert(t('profile.changePasswordSoon'))
  }

  const handleChangePhone = () => {
    console.log('Change phone clicked')
    alert(t('profile.changePhoneSoon'))
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-pink-500">{t('profile.admin')}</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{t('profile.overview')}</h1>
          <p className="text-sm text-gray-500 mt-2">{t('profile.desc')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleChangePhone}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300"
          >
            {t('profile.changePhone')}
          </button>
          <button
            onClick={handleChangePassword}
            className="px-4 py-2 rounded-xl bg-pink-500 text-sm font-semibold text-white hover:bg-pink-600"
          >
            {t('profile.changePassword')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-semibold">
              {initials || 'AD'}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{fallbackName}</h2>
                <p className="text-sm text-gray-500 mt-2">{user.role || t('profile.admin')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ProfileField label="Email" value={user.email} />
                <ProfileField label={t('users.phone')} value={user.phone} />
                <ProfileField label={t('common.status')} value={statusLabel} />
                <ProfileField label={t('profile.identifier')} value={user.id} />
              </div>
            </div>
          </div>
        </section>

      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <h3 className="text-lg font-semibold text-gray-900">{t('profile.additionalDetails')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <ProfileField label="Email" value={user.email} />
          <ProfileField label={t('users.colRole')} value={user.role || t('profile.admin')} />
          <ProfileField label={t('users.phone')} value={user.phone} />
          <ProfileField label={t('common.status')} value={statusLabel} />
          <ProfileField label={t('profile.passwordStatus')} value={passwordStatus} />
        </div>
      </section>
    </div>
  )
}
