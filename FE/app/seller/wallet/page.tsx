"use client";

import { useState } from "react";
import {
    useMyWallet, useWalletTransactions, useRequestPayout,
    useBankAccounts, useAddBankAccount, useDeleteBankAccount, useSetDefaultBankAccount,
    useMyPayoutRequests, useVerifyBankAccount,
} from "@/features/order/useOrder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Wallet, ArrowDownToLine, TrendingUp, Clock, Loader2, RefreshCcw,
    CreditCard, Plus, Trash2, Star, AlertCircle, CheckCircle2, Search,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/I18nContext";

type Tab = "overview" | "bank-accounts" | "payout-history";

const VIETNAM_BANKS = [
    { name: "Vietcombank (VCB)", bin: "970436" },
    { name: "Vietinbank", bin: "970415" },
    { name: "BIDV", bin: "970418" },
    { name: "Agribank", bin: "970405" },
    { name: "Techcombank", bin: "970407" },
    { name: "MB Bank", bin: "970422" },
    { name: "ACB", bin: "970416" },
    { name: "VPBank", bin: "970432" },
    { name: "TPBank", bin: "970423" },
    { name: "Sacombank", bin: "970403" },
    { name: "HDBank", bin: "970437" },
    { name: "VIB", bin: "970441" },
    { name: "OCB", bin: "970448" },
    { name: "SHB", bin: "970443" },
    { name: "Eximbank", bin: "970431" },
    { name: "MSB", bin: "970426" },
    { name: "SeABank", bin: "970440" },
    { name: "LienVietPostBank", bin: "970449" },
    { name: "NCB", bin: "970419" },
    { name: "Bac A Bank", bin: "970409" },
    { name: "Dong A Bank", bin: "970406" },
    { name: "PVcomBank", bin: "970412" },
    { name: "Nam A Bank", bin: "970428" },
    { name: "Cake by VPBank", bin: "546034" },
    { name: "Timo by Ban Viet", bin: "963388" },
] as const;

const formatPrice = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const statusBadge = (status: string, t: (k: any) => string) => {
    switch (status) {
        case "pending": return <Badge className="bg-amber-100 text-amber-700 border-0">{t('payoutStatus.pending')}</Badge>;
        case "approved": return <Badge className="bg-blue-100 text-blue-700 border-0">{t('payoutStatus.approved')}</Badge>;
        case "paid": return <Badge className="bg-emerald-100 text-emerald-700 border-0">{t('payoutStatus.paid')}</Badge>;
        case "rejected": return <Badge className="bg-red-100 text-red-700 border-0">{t('payoutStatus.rejected')}</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
};

const txTypeLabel = (type: string, t: (k: any) => string) => {
    switch (type) {
        case "credit_sale": return { label: t('txType.credit_sale'), color: "text-emerald-600" };
        case "debit_payout": return { label: t('txType.debit_payout'), color: "text-rose-600" };
        case "debit_refund": return { label: t('txType.debit_refund'), color: "text-amber-600" };
        case "credit_refund_payout": return { label: t('txType.credit_refund_payout'), color: "text-blue-600" };
        default: return { label: type, color: "text-slate-600" };
    }
};

const emptyBankForm = {
    bin: "",
    bank_name: "",
    bank_account: "",
    account_name: "",
    is_default: false,
    formatValid: false,
};

export default function SellerWalletPage() {
    const { t } = useI18n();
    const { data: walletRes, isLoading: walletLoading, refetch } = useMyWallet();
    const { data: txRes, isLoading: txLoading } = useWalletTransactions({ page: 1, limit: 20 });
    const { data: bankRes, isLoading: bankLoading } = useBankAccounts();
    const { data: payoutRes, isLoading: payoutLoading } = useMyPayoutRequests({ page: 1, limit: 20 });
    const requestPayoutMutation = useRequestPayout();
    const addBankMutation = useAddBankAccount();
    const deleteBankMutation = useDeleteBankAccount();
    const setDefaultMutation = useSetDefaultBankAccount();
    const verifyBankMutation = useVerifyBankAccount();

    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [payoutOpen, setPayoutOpen] = useState(false);
    const [addBankOpen, setAddBankOpen] = useState(false);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [payoutAmount, setPayoutAmount] = useState("");
    const [bankForm, setBankForm] = useState(emptyBankForm);

    const wallet: any = (walletRes as any)?.data || walletRes;
    const transactions: any[] = (txRes as any)?.items || (txRes as any)?.data?.items || [];
    const bankAccounts: any[] = Array.isArray(bankRes) ? bankRes : ((bankRes as any)?.data || []);
    const payoutRequests: any[] = (payoutRes as any)?.items || (payoutRes as any)?.data?.items || [];
    const defaultBank = bankAccounts.find((b: any) => b.is_default) || bankAccounts[0];

    const handleRequestPayout = async () => {
        const amount = Number(payoutAmount);
        if (isNaN(amount) || amount < 10000) { toast.error(t('wallet.minPayout')); return; }
        if (bankAccounts.length === 0) { toast.error(t('wallet.addBankFirst')); setPayoutOpen(false); setActiveTab("bank-accounts"); return; }
        try {
            await requestPayoutMutation.mutateAsync({ amount, bank_account_id: selectedBankId || defaultBank?.id });
            toast.success(t('wallet.payoutSuccess'));
            setPayoutOpen(false); setPayoutAmount(""); setSelectedBankId(null); refetch();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || t('wallet.payoutError'));
        }
    };

    const handleCheckFormat = async () => {
        if (!bankForm.bin) { toast.error(t('wallet.selectBank')); return; }
        if (!bankForm.bank_account || !/^\d{6,20}$/.test(bankForm.bank_account)) {
            toast.error(t('wallet.invalidAccount'));
            setBankForm(f => ({ ...f, formatValid: false }));
            return;
        }
        try {
            await verifyBankMutation.mutateAsync({ bin: bankForm.bin, accountNumber: bankForm.bank_account });
            setBankForm(f => ({ ...f, formatValid: true }));
            toast.success(t('wallet.validFormat'));
        } catch (err: any) {
            setBankForm(f => ({ ...f, formatValid: false }));
            toast.error(err?.response?.data?.message || err?.message || t('wallet.invalidFormat'));
        }
    };

    const canSave = bankForm.formatValid && bankForm.account_name.trim().length >= 3;

    const handleAddBank = async () => {
        if (!canSave) {
            if (!bankForm.formatValid) { toast.error(t('wallet.verifyFirst')); return; }
            toast.error(t('wallet.holderMinLength')); return;
        }
        try {
            await addBankMutation.mutateAsync({
                bank_name: bankForm.bank_name,
                bank_account: bankForm.bank_account,
                account_name: bankForm.account_name.trim().toUpperCase(),
                is_default: bankForm.is_default,
            });
            toast.success(t('wallet.addBankSuccess'));
            setAddBankOpen(false); setBankForm(emptyBankForm); verifyBankMutation.reset();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || t('wallet.addBankError'));
        }
    };

    const handleDeleteBank = async (id: number) => {
        if (!confirm(t('wallet.deleteBankConfirm'))) return;
        try { await deleteBankMutation.mutateAsync(id); toast.success(t('wallet.deleteBankSuccess')); }
        catch { toast.error(t('wallet.addBankError')); }
    };

    const handleSetDefault = async (id: number) => {
        try { await setDefaultMutation.mutateAsync(id); toast.success(t('wallet.setDefaultSuccess')); }
        catch { toast.error(t('common.error')); }
    };

    const handleCloseBankDialog = () => {
        setAddBankOpen(false);
        setBankForm(emptyBankForm);
        verifyBankMutation.reset();
    };

    if (walletLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-pink-500" /></div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-pink-500" /> {t('wallet.title')}
                </h1>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-full gap-2">
                    <RefreshCcw className="h-4 w-4" /> {t('common.refresh')}
                </Button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardContent className="pt-6">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">{t('wallet.balance')}</p>
                        <p className="text-3xl font-black text-emerald-700">{formatPrice(wallet?.balance ?? 0)}</p>
                        <p className="text-xs text-emerald-500 mt-1">{t('wallet.availableSoon')}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">{t('wallet.totalEarned')}</p>
                        <p className="text-3xl font-black text-blue-700">{formatPrice(wallet?.total_earned ?? 0)}</p>
                        <p className="text-xs text-blue-500 mt-1">{t('wallet.totalEarnedDesc')}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
                    <CardContent className="pt-6">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{t('wallet.commission')}</p>
                        <p className="text-3xl font-black text-slate-700">{((wallet?.commission_rate ?? 0.03) * 100).toFixed(1)}%</p>
                        <p className="text-xs text-slate-400 mt-1">{t('wallet.commissionDesc')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payout Button */}
            <Button
                onClick={() => { setSelectedBankId(defaultBank?.id ?? null); setPayoutOpen(true); }}
                className="h-12 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold gap-2"
                disabled={!wallet?.balance || wallet.balance <= 0}
            >
                <ArrowDownToLine className="h-4 w-4" /> {t('wallet.requestPayout')}
            </Button>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { key: "overview", label: t('wallet.tab.overview') },
                    { key: "bank-accounts", label: t('wallet.tab.bankAccounts') },
                    { key: "payout-history", label: t('wallet.tab.payoutHistory') },
                ].map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key as Tab)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-pink-500 text-pink-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: Transaction History */}
            {activeTab === "overview" && (
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> {t('wallet.tab.overview')}</CardTitle></CardHeader>
                    <CardContent>
                        {txLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-pink-500" /></div>
                            : transactions.length === 0 ? (
                                <div className="text-center py-10 text-slate-400"><TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>{t('wallet.noTransactions')}</p></div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {transactions.map((tx: any) => {
                                        const { label, color } = txTypeLabel(tx.type, t);
                                        const isCredit = tx.type.startsWith("credit");
                                        return (
                                            <div key={tx.id} className="flex items-center justify-between py-3">
                                                <div>
                                                    <p className={`text-sm font-semibold ${color}`}>{label}</p>
                                                    {tx.note && <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{tx.note}</p>}
                                                    <p className="text-xs text-slate-300 mt-0.5">{new Date(tx.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                                </div>
                                                <span className={`font-bold text-base ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {isCredit ? "+" : "-"}{formatPrice(Number(tx.amount))}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                    </CardContent>
                </Card>
            )}

            {/* Tab: Bank Accounts */}
            {activeTab === "bank-accounts" && (
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-slate-400" /> {t('wallet.tab.bankAccounts')}</CardTitle>
                        <Button size="sm" onClick={() => setAddBankOpen(true)} className="rounded-full gap-1 bg-pink-500 hover:bg-pink-600 text-white text-xs px-3">
                            <Plus className="h-3.5 w-3.5" /> {t('wallet.addBank')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {bankLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-pink-500" /></div>
                            : bankAccounts.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p>{t('wallet.noBankAccounts')}</p>
                                    <p className="text-xs mt-1">{t('wallet.noBankDesc')}</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {bankAccounts.map((acc: any) => (
                                        <div key={acc.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${acc.is_default ? "border-emerald-400 bg-emerald-50/40" : "border-slate-100"}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${acc.is_default ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-slate-800">{acc.bank_name}</p>
                                                        {acc.is_default && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0">{t('wallet.default')}</Badge>}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{acc.bank_account} &mdash; {acc.account_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!acc.is_default && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(acc.id)} disabled={setDefaultMutation.isPending} title={t('wallet.setDefault')} className="text-slate-400 hover:text-emerald-600 rounded-full">
                                                        <Star className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteBank(acc.id)} disabled={deleteBankMutation.isPending} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </CardContent>
                </Card>
            )}

            {/* Tab: Payout History */}
            {activeTab === "payout-history" && (
                <Card className="border-none shadow-sm">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowDownToLine className="h-4 w-4 text-slate-400" /> {t('wallet.tab.payoutHistory')}</CardTitle></CardHeader>
                    <CardContent>
                        {payoutLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-pink-500" /></div>
                            : payoutRequests.length === 0 ? (
                                <div className="text-center py-10 text-slate-400"><AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>{t('wallet.noPayouts')}</p></div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {payoutRequests.map((req: any) => (
                                        <div key={req.id} className="py-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-slate-800">{formatPrice(Number(req.amount))}</span>
                                                        {statusBadge(req.status, t)}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{req.bank_name} &mdash; {req.bank_account}</p>
                                                    {req.account_name && <p className="text-xs text-slate-400">{req.account_name}</p>}
                                                    {req.admin_note && <p className="text-xs text-amber-600 mt-0.5">Ghi chú: {req.admin_note}</p>}
                                                    <p className="text-xs text-slate-300 mt-0.5">{new Date(req.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </CardContent>
                </Card>
            )}

            {/* Payout Dialog */}
            {payoutOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{t('wallet.requestPayout')}</h3>
                        <p className="text-sm text-slate-500 mb-4">{t('wallet.balance')}: <span className="font-semibold text-emerald-600">{formatPrice(wallet?.balance ?? 0)}</span></p>
                        {bankAccounts.length > 0 ? (
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">{t('wallet.tab.bankAccounts')}</label>
                                <div className="space-y-2">
                                    {bankAccounts.map((acc: any) => (
                                        <div key={acc.id} onClick={() => setSelectedBankId(acc.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedBankId === acc.id ? "border-emerald-400 bg-emerald-50/40" : "border-slate-100 hover:border-slate-200"}`}>
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedBankId === acc.id ? "border-emerald-500" : "border-slate-300"}`}>
                                                {selectedBankId === acc.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{acc.bank_name}</p>
                                                <p className="text-xs text-slate-500">{acc.bank_account} &mdash; {acc.account_name}</p>
                                            </div>
                                            {acc.is_default && <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0 text-[10px]">{t('wallet.default')}</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 p-3 bg-amber-50 rounded-xl text-amber-700 text-sm">{t('wallet.noBankAccounts')}</div>
                        )}
                        <div className="mb-4">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{t('wallet.amount')}</label>
                            <input type="number" min="10000" max={wallet?.balance ?? 0} placeholder={t('wallet.amountPlaceholder')} value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setPayoutOpen(false)}>{t('common.cancel')}</Button>
                            <Button className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleRequestPayout}
                                disabled={requestPayoutMutation.isPending || bankAccounts.length === 0}>
                                {requestPayoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} {t('wallet.confirmPayout')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Bank Account Dialog */}
            {addBankOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{t('wallet.addBank')}</h3>
                        <p className="text-xs text-slate-500 mb-4">{t('wallet.addBankDesc')}</p>

                        <div className="space-y-3">
                            {/* Bank selector */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{t('wallet.bankName')} <span className="text-rose-500">*</span></label>
                                <select
                                    value={bankForm.bin}
                                    onChange={(e) => {
                                        const selected = VIETNAM_BANKS.find(b => b.bin === e.target.value);
                                        setBankForm(f => ({
                                            ...f,
                                            bin: e.target.value,
                                            bank_name: selected?.name ?? "",
                                            formatValid: false,
                                        }));
                                        verifyBankMutation.reset();
                                    }}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
                                >
                                    <option value="">{t('wallet.selectBank')}</option>
                                    {VIETNAM_BANKS.map(b => (
                                        <option key={b.bin} value={b.bin}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Account number + check button */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{t('wallet.accountNumber')} <span className="text-rose-500">*</span></label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="\d*"
                                        placeholder={t('wallet.accountNumberPlaceholder')}
                                        value={bankForm.bank_account}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            setBankForm(f => ({ ...f, bank_account: val, formatValid: false }));
                                            verifyBankMutation.reset();
                                        }}
                                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCheckFormat}
                                        disabled={verifyBankMutation.isPending || !bankForm.bin || !bankForm.bank_account}
                                        className="rounded-xl gap-1.5 border-pink-200 text-pink-600 hover:bg-pink-50 whitespace-nowrap"
                                    >
                                        {verifyBankMutation.isPending
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <Search className="h-3.5 w-3.5" />}
                                        {t('wallet.verify')}
                                    </Button>
                                </div>
                                {/* Inline format result */}
                                {bankForm.formatValid && (
                                    <p className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> {t('wallet.accountValid')}
                                    </p>
                                )}
                                {verifyBankMutation.isError && !bankForm.formatValid && (
                                    <p className="flex items-center gap-1 text-xs text-rose-500 mt-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {(verifyBankMutation.error as any)?.response?.data?.message || t('wallet.accountInvalid')}
                                    </p>
                                )}
                            </div>

                            {/* Account holder name — required manual entry */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{t('wallet.accountHolder')} <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder={t('wallet.accountHolderPlaceholder')}
                                    value={bankForm.account_name}
                                    onChange={(e) => setBankForm(f => ({ ...f, account_name: e.target.value }))}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">{t('wallet.accountHolderExample')}</p>
                            </div>

                            {/* Warning banner */}
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">{t('wallet.addBankWarning')}</p>
                            </div>

                            {/* Default checkbox */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={bankForm.is_default} onChange={(e) => setBankForm(f => ({ ...f, is_default: e.target.checked }))} className="rounded" />
                                <span className="text-sm text-slate-600">{t('wallet.setDefault')}</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <Button variant="outline" className="flex-1 rounded-full" onClick={handleCloseBankDialog}>{t('common.cancel')}</Button>
                            <Button
                                className="flex-1 rounded-full font-bold bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-50"
                                onClick={handleAddBank}
                                disabled={addBankMutation.isPending || !canSave}
                            >
                                {addBankMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} {t('wallet.saveAccount')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}