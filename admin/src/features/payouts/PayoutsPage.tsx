import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { useI18n } from '../../shared/i18n/I18nContext';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export function PayoutsPage() {
  const { token } = useAuth();
  const { t, locale } = useI18n();

  const formatPrice = (n: number) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

  const formatDate = (s: string) =>
    new Date(s).toLocaleString(locale === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const STATUS_LABELS: Record<string, string> = {
    pending: t('status.pending'),
    approved: t('status.approved'),
    paid: t('status.paid'),
    rejected: t('status.rejected'),
    all: t('status.all'),
  };

  const [payouts, setPayouts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processing, setProcessing] = useState<number | null>(null);
  const [modalId, setModalId] = useState<number | null>(null);
  const [modalAction, setModalAction] = useState<'approved' | 'rejected' | 'paid'>('paid');
  const [adminNote, setAdminNote] = useState('');
  const [error, setError] = useState('');

  const fetchPayouts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}&limit=50` : '?limit=50';
      const res = await fetch(`${API_BASE}/admin/payout-requests${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPayouts(data.items || data.data?.items || []);
      setTotal(data.total || 0);
    } catch {
      setError(t('payouts.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleProcess = async () => {
    if (!token || modalId === null) return;
    setProcessing(modalId);
    try {
      const res = await fetch(`${API_BASE}/admin/payout-requests/${modalId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: modalAction, admin_note: adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('payouts.errorProcess'));
      setModalId(null);
      setAdminNote('');
      fetchPayouts();
    } catch (err: any) {
      alert(err.message || t('payouts.errorProcess'));
    } finally {
      setProcessing(null);
    }
  };

  const openModal = (id: number, action: typeof modalAction) => {
    setModalId(id);
    setModalAction(action);
    setAdminNote('');
  };

  const selected = payouts.find(p => p.id === modalId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('payouts.title')}</h1>
        <button
          onClick={fetchPayouts}
          className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
        >
          {t('payouts.refresh')}
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['all', 'pending', 'approved', 'paid', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-pink-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{t('payouts.total', { count: total })}</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('payouts.loading')}
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg className="h-10 w-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>{t('payouts.empty')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('common.shop')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('payouts.colBank')}</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">{t('payouts.colAmount')}</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">{t('payouts.colStatus')}</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">{t('payouts.colDate')}</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">{t('payouts.colAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payouts.map((req: any) => {
                const shop = req.wallet?.shop;
                return (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{shop?.name || `Shop #${req.shop_id}`}</p>
                      {shop?.owner?.email && <p className="text-xs text-gray-400">{shop.owner.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{req.bank_name}</p>
                      <p className="text-xs text-gray-500">{req.bank_account}</p>
                      {req.account_name && <p className="text-xs text-gray-400">{req.account_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {formatPrice(Number(req.amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                      {req.admin_note && (
                        <p className="text-xs text-amber-600 mt-0.5 max-w-[140px] mx-auto truncate" title={req.admin_note}>
                          {req.admin_note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openModal(req.id, 'paid')}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium"
                          >
                            {t('payouts.actionPaid')}
                          </button>
                          <button
                            onClick={() => openModal(req.id, 'rejected')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-medium"
                          >
                            {t('payouts.actionReject')}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Modal */}
      {modalId !== null && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {modalAction === 'paid' ? t('payouts.modalTitlePaid') : t('payouts.modalTitleReject')}
            </h3>
            <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm space-y-1">
              <p><span className="text-gray-500">{t('common.shop')}:</span> <span className="font-medium">{selected.wallet?.shop?.name || `#${selected.shop_id}`}</span></p>
              <p><span className="text-gray-500">{t('payouts.labelBank')}:</span> <span className="font-medium">{selected.bank_name} — {selected.bank_account}</span></p>
              {selected.account_name && <p><span className="text-gray-500">{t('payouts.labelHolder')}:</span> <span className="font-medium">{selected.account_name}</span></p>}
              <p><span className="text-gray-500">{t('payouts.colAmount')}:</span> <span className="font-bold text-emerald-700">{formatPrice(Number(selected.amount))}</span></p>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                {t('payouts.noteLabel')} {modalAction === 'rejected' ? t('payouts.noteLabelReject') : t('payouts.noteOptional')}
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder={modalAction === 'rejected' ? t('payouts.notePlaceholderReject') : t('payouts.notePlaceholderPaid')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModalId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleProcess}
                disabled={processing !== null || (modalAction === 'rejected' && !adminNote.trim())}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                  modalAction === 'paid' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {processing === modalId ? (
                  <span className="flex items-center justify-center gap-1">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('common.processing')}
                  </span>
                ) : (
                  modalAction === 'paid' ? t('payouts.confirmPaid') : t('payouts.confirmReject')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
