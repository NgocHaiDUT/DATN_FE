import React from 'react';
import { useI18n } from '../../shared/i18n/I18nContext';
import type { TranslationKey } from '../../shared/i18n/translations';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

type ReviewStats = {
  total: number;
  average_rating: number;
  rating_counts: Record<string, number>;
  aspect_counts: Record<string, Record<string, number>>;
  suggestion_counts: Record<string, number>;
  source_counts: Record<string, number>;
  recent_reviews: Array<{
    id: number;
    rating: number;
    created_at: string;
    source: string;
    aspects: Record<string, string>;
    suggestions: string[];
    user?: { id: number; email?: string; full_name?: string | null };
  }>;
};

const aspectLabelKeys: Record<string, TranslationKey> = {
  realism: 'vrReviews.aspect.realism',
  color_match: 'vrReviews.aspect.colorMatch',
  face_fit: 'vrReviews.aspect.faceFit',
  performance: 'vrReviews.aspect.performance',
};

const optionLabelKeys: Record<string, TranslationKey> = {
  very_good: 'vrReviews.option.veryGood',
  good: 'vrReviews.option.good',
  needs_work: 'vrReviews.option.needsWork',
  accurate: 'vrReviews.option.accurate',
  acceptable: 'vrReviews.option.acceptable',
  inaccurate: 'vrReviews.option.inaccurate',
  stable: 'vrReviews.option.stable',
  unstable: 'vrReviews.option.unstable',
  smooth: 'vrReviews.option.smooth',
  normal: 'vrReviews.option.normal',
  slow: 'vrReviews.option.slow',
};

const suggestionLabelKeys: Record<string, TranslationKey> = {
  more_natural_color: 'vrReviews.suggestion.moreNaturalColor',
  better_face_tracking: 'vrReviews.suggestion.betterFaceTracking',
  more_makeup_styles: 'vrReviews.suggestion.moreMakeupStyles',
  faster_processing: 'vrReviews.suggestion.fasterProcessing',
  clearer_product_preview: 'vrReviews.suggestion.clearerProductPreview',
};

const sourceLabelKeys: Record<string, TranslationKey> = {
  ai_studio_prompt: 'vrReviews.source.aiStudioPrompt',
  user_product_try_on: 'vrReviews.source.userProductTryOn',
  shop_try_on_tester: 'vrReviews.source.shopTryOnTester',
  prompt: 'vrReviews.source.prompt',
};

export const VrReviewStatsPage: React.FC = () => {
  const { locale, t } = useI18n();
  const [stats, setStats] = React.useState<ReviewStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setHasError(false);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/makeup/vr-review/admin/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) throw new Error('Failed to load VR review stats');
        const payload = await response.json();
        setStats(payload.data || payload);
      } catch {
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const topSuggestions = Object.entries(stats?.suggestion_counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const dateTimeLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const translateLabel = (labels: Record<string, TranslationKey>, key: string) => {
    const translationKey = labels[key];
    return translationKey ? t(translationKey) : key;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('vrReviews.title')}</h1>
        <p className="mt-1 text-gray-600">{t('vrReviews.subtitle')}</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">{t('vrReviews.loading')}</div>
      ) : hasError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{t('vrReviews.errorLoad')}</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label={t('vrReviews.totalReviews')} value={stats.total.toLocaleString(dateTimeLocale)} />
            <StatCard label={t('vrReviews.averageRating')} value={`${stats.average_rating.toFixed(2)} / 5`} />
            <StatCard
              label={t('vrReviews.topSource')}
              value={getTopLabel(stats.source_counts, sourceLabelKeys, t)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('vrReviews.ratingDistribution')}</h2>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <ProgressRow
                    key={rating}
                    countLabel={t('vrReviews.countUnit')}
                    label={t('vrReviews.stars', { rating })}
                    value={stats.rating_counts[String(rating)] || 0}
                    total={stats.total}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('vrReviews.topSuggestions')}</h2>
              <div className="space-y-3">
                {topSuggestions.length > 0 ? (
                  topSuggestions.map(([key, value]) => (
                    <ProgressRow
                      key={key}
                      countLabel={t('vrReviews.countUnit')}
                      label={translateLabel(suggestionLabelKeys, key)}
                      value={value}
                      total={stats.total}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500">{t('vrReviews.noSuggestions')}</p>
                )}
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('vrReviews.aspectDetails')}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(stats.aspect_counts).map(([aspect, counts]) => (
                <div key={aspect} className="rounded-lg border border-gray-100 p-4">
                  <h3 className="mb-3 font-semibold text-gray-800">{translateLabel(aspectLabelKeys, aspect)}</h3>
                  <div className="space-y-2">
                    {Object.entries(counts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, value]) => (
                        <ProgressRow
                          key={key}
                          countLabel={t('vrReviews.countUnit')}
                          label={translateLabel(optionLabelKeys, key)}
                          value={value}
                          total={stats.total}
                          compact
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('vrReviews.recentReviews')}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">{t('vrReviews.reviewer')}</th>
                    <th className="px-4 py-3">{t('vrReviews.source')}</th>
                    <th className="px-4 py-3">{t('vrReviews.score')}</th>
                    <th className="px-4 py-3">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recent_reviews.map((review) => (
                    <tr key={review.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {review.user?.full_name || review.user?.email || `User #${review.user?.id || ''}`}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{translateLabel(sourceLabelKeys, review.source)}</td>
                      <td className="px-4 py-3 text-gray-600">{review.rating} / 5</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(review.created_at).toLocaleString(dateTimeLocale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  countLabel,
  compact = false,
}: {
  label: string;
  value: number;
  total: number;
  countLabel: string;
  compact?: boolean;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className={`mb-1 flex justify-between ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{value} {countLabel}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-pink-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function getTopLabel(
  counts: Record<string, number>,
  labels: Record<string, TranslationKey>,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string,
) {
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return t('common.noData');
  const translationKey = labels[top[0]];
  return translationKey ? t(translationKey) : top[0];
}
