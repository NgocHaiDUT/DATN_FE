import React from 'react';
import { useI18n } from '../../shared/i18n/I18nContext';
import type { TranslationKey } from '../../shared/i18n/translations';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

type TrashResource =
  | 'users'
  | 'shops'
  | 'products'
  | 'product_variants'
  | 'orders'
  | 'reviews'
  | 'coupons'
  | 'messages';

type TrashItem = {
  id: number;
  resource: TrashResource;
  title: string;
  subtitle?: string | null;
  deleted_at: string | null;
  created_at?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

type TrashListResponse = {
  data: {
    resource: TrashResource;
    items: TrashItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type TrashSummaryResponse = {
  data: {
    total: number;
    resources: Array<{ resource: TrashResource; count: number }>;
  };
};

type ProductRestoreRequest = {
  id: number;
  product_id: number;
  product_name: string;
  shop_name?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  requested_at: string;
  note?: string | null;
};

type ProductRestoreRequestsResponse = {
  data: ProductRestoreRequest[];
};

const RESOURCE_LABEL_KEYS: Record<TrashResource, TranslationKey> = {
  users: 'trash.resource.users',
  shops: 'trash.resource.shops',
  products: 'trash.resource.products',
  product_variants: 'trash.resource.productVariants',
  orders: 'trash.resource.orders',
  reviews: 'trash.resource.reviews',
  coupons: 'trash.resource.coupons',
  messages: 'trash.resource.messages',
};

const RESOURCES = Object.keys(RESOURCE_LABEL_KEYS) as TrashResource[];
const PAGE_SIZE = 20;

export const TrashPage: React.FC = () => {
  const { locale, t } = useI18n();
  const [resource, setResource] = React.useState<TrashResource>('users');
  const [search, setSearch] = React.useState('');
  const [appliedSearch, setAppliedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<TrashItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [summary, setSummary] = React.useState<TrashSummaryResponse['data'] | null>(null);
  const [restoreRequests, setRestoreRequests] = React.useState<ProductRestoreRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoadingId, setActionLoadingId] = React.useState<number | null>(null);
  const [requestActionLoadingId, setRequestActionLoadingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState('');
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

  const fetchSummary = React.useCallback(async () => {
    const payload = await fetchJson<TrashSummaryResponse>('/admin/trash/summary');
    setSummary(payload.data);
  }, []);

  const fetchRestoreRequests = React.useCallback(async () => {
    if (resource !== 'products') {
      setRestoreRequests([]);
      return;
    }

    const payload = await fetchJson<ProductRestoreRequestsResponse>('/admin/trash/product-restore-requests');
    setRestoreRequests(payload.data);
  }, [resource]);

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        resource,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (appliedSearch.trim()) params.set('search', appliedSearch.trim());

      const payload = await fetchJson<TrashListResponse>(`/admin/trash?${params.toString()}`);
      setItems(payload.data.items);
      setTotal(payload.data.total);
      setTotalPages(Math.max(payload.data.totalPages, 1));
      await Promise.all([fetchSummary(), fetchRestoreRequests()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('trash.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, fetchRestoreRequests, fetchSummary, page, resource, t]);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleResourceChange = (nextResource: TrashResource) => {
    setResource(nextResource);
    setPage(1);
  };

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedSearch(search);
    setPage(1);
  };

  const handleRestore = async (item: TrashItem) => {
    if (!window.confirm(t('trash.confirmRestore', { title: item.title }))) return;
    await runAction(item.id, async () => {
      await fetchJson(`/admin/trash/${item.resource}/${item.id}/restore`, { method: 'PATCH' });
    });
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    if (!window.confirm(t('trash.confirmPermanentDelete', { title: item.title }))) return;
    await runAction(item.id, async () => {
      await fetchJson(`/admin/trash/${item.resource}/${item.id}/permanent`, { method: 'DELETE' });
    });
  };

  const handleApproveRestoreRequest = async (request: ProductRestoreRequest) => {
    if (!window.confirm(t('trash.confirmApproveRestore', { title: request.product_name }))) return;
    await runRequestAction(request.id, async () => {
      await fetchJson(`/admin/trash/product-restore-requests/${request.id}/approve`, { method: 'PATCH' });
    });
  };

  const handleRejectRestoreRequest = async (request: ProductRestoreRequest) => {
    if (!window.confirm(t('trash.confirmRejectRestore', { title: request.product_name }))) return;
    await runRequestAction(request.id, async () => {
      await fetchJson(`/admin/trash/product-restore-requests/${request.id}/reject`, { method: 'PATCH' });
    });
  };

  const runAction = async (itemId: number, action: () => Promise<void>) => {
    setActionLoadingId(itemId);
    setError('');
    try {
      await action();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('trash.errorAction'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const runRequestAction = async (requestId: number, action: () => Promise<void>) => {
    setRequestActionLoadingId(requestId);
    setError('');
    try {
      await action();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('trash.errorAction'));
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const resourceCount = (key: TrashResource) =>
    summary?.resources.find((item) => item.resource === key)?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('trash.title')}</h1>
        <p className="mt-1 text-gray-600">{t('trash.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label={t('trash.totalDeleted')} value={summary?.total ?? 0} />
        <SummaryCard label={t('trash.currentResource')} value={resourceCount(resource)} />
        <SummaryCard label={t('trash.retention')} value={t('trash.retentionValue')} />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">{t('trash.resource')}</span>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-100"
                value={resource}
                onChange={(event) => handleResourceChange(event.target.value as TrashResource)}
              >
                {RESOURCES.map((key) => (
                  <option key={key} value={key}>
                    {t(RESOURCE_LABEL_KEYS[key])} ({resourceCount(key)})
                  </option>
                ))}
              </select>
            </label>

            <form onSubmit={applySearch}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">{t('common.search')}</span>
                <div className="flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-100"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('trash.searchPlaceholder')}
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    {t('common.search')}
                  </button>
                </div>
              </label>
            </form>
          </div>

          <button
            type="button"
            onClick={loadItems}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common.refresh')}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {resource === 'products' ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="border-b border-amber-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-amber-950">{t('trash.restoreRequests')}</h2>
            <p className="mt-1 text-sm text-amber-800">
              {t('trash.restoreRequestCount', { count: restoreRequests.length })}
            </p>
          </div>

          {restoreRequests.length === 0 ? (
            <div className="px-5 py-4 text-sm text-amber-800">{t('trash.noRestoreRequests')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-amber-200 bg-amber-100 text-xs uppercase text-amber-900">
                  <tr>
                    <th className="px-4 py-3">{t('trash.product')}</th>
                    <th className="px-4 py-3">{t('trash.requester')}</th>
                    <th className="px-4 py-3">{t('trash.requestedAt')}</th>
                    <th className="px-4 py-3">{t('trash.note')}</th>
                    <th className="px-4 py-3 text-right">{t('common.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200 bg-white">
                  {restoreRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{request.product_name}</div>
                        <div className="text-xs text-gray-500">
                          #{request.product_id}
                          {request.shop_name ? ` · ${request.shop_name}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{request.requester_name || '-'}</div>
                        <div className="text-xs text-gray-500">{request.requester_email || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(request.requested_at, dateLocale)}</td>
                      <td className="px-4 py-3 text-gray-600">{request.note || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={requestActionLoadingId === request.id}
                            onClick={() => handleApproveRestoreRequest(request)}
                            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t('trash.approveRestore')}
                          </button>
                          <button
                            type="button"
                            disabled={requestActionLoadingId === request.id}
                            onClick={() => handleRejectRestoreRequest(request)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t('trash.rejectRestore')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t(RESOURCE_LABEL_KEYS[resource])}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{t('trash.showing', { count: total })}</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">{t('trash.loading')}</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('trash.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('trash.item')}</th>
                  <th className="px-4 py-3">{t('trash.deletedAt')}</th>
                  <th className="px-4 py-3">{t('trash.metadata')}</th>
                  <th className="px-4 py-3 text-right">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={`${item.resource}-${item.id}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-500">
                        #{item.id}
                        {item.subtitle ? ` · ${item.subtitle}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(item.deleted_at, dateLocale)}</td>
                    <td className="px-4 py-3">
                      <Metadata metadata={item.metadata} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleRestore(item)}
                          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {t('trash.restore')}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === item.id}
                          onClick={() => handlePermanentDelete(item)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {t('trash.permanentDelete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 text-sm">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.prev')}
          </button>
          <span className="text-gray-500">{t('common.page', { page, total: totalPages })}</span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.next')}
          </button>
        </div>
      </section>
    </div>
  );
};

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Metadata({ metadata }: { metadata?: Record<string, string | number | boolean | null> }) {
  const entries = Object.entries(metadata || {}).filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (entries.length === 0) return <span className="text-xs text-gray-400">-</span>;

  return (
    <div className="flex max-w-md flex-wrap gap-1.5">
      {entries.slice(0, 4).map(([key, value]) => (
        <span key={key} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
          {key}: {String(value)}
        </span>
      ))}
    </div>
  );
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale);
}

async function fetchJson<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return parsed as T;
}
