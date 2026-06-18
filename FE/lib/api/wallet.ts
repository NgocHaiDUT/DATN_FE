import { apiClient } from "../api";
import { ENDPOINTS } from "@/constants/endpoint";

export async function getMyWallet() {
    return apiClient(ENDPOINTS.WALLET.GET_MY_WALLET, { method: "GET" });
}

export async function getWalletTransactions(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    return apiClient(`${ENDPOINTS.WALLET.GET_TRANSACTIONS}?${query.toString()}`, { method: "GET" });
}

export interface RequestPayoutPayload {
    amount: number;
    bank_account_id?: number;
    bank_name?: string;
    bank_account?: string;
    account_name?: string;
}

export async function requestPayout(data: RequestPayoutPayload) {
    return apiClient(ENDPOINTS.WALLET.REQUEST_PAYOUT, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getMyPayoutRequests(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    return apiClient(`${ENDPOINTS.WALLET.GET_MY_PAYOUTS}?${query.toString()}`, { method: "GET" });
}

// Bank accounts
export interface BankAccountPayload {
    bank_name: string;
    bank_account: string;
    account_name: string;
    is_default?: boolean;
}

export async function getBankAccounts() {
    return apiClient(ENDPOINTS.WALLET.GET_BANK_ACCOUNTS, { method: "GET" });
}

export async function addBankAccount(data: BankAccountPayload) {
    return apiClient(ENDPOINTS.WALLET.ADD_BANK_ACCOUNT, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function deleteBankAccount(id: number) {
    return apiClient(ENDPOINTS.WALLET.DELETE_BANK_ACCOUNT(id), { method: "DELETE" });
}

export async function setDefaultBankAccount(id: number) {
    return apiClient(ENDPOINTS.WALLET.SET_DEFAULT_BANK_ACCOUNT(id), { method: "PATCH" });
}

export async function verifyBankAccount(bin: string, accountNumber: string): Promise<{ verified: boolean; accountName: string; accountNumber: string }> {
    return apiClient(ENDPOINTS.WALLET.VERIFY_BANK_ACCOUNT, {
        method: "POST",
        body: JSON.stringify({ bin, accountNumber }),
    });
}

// Admin
export async function adminListPayouts(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.status) query.append("status", params.status);
    return apiClient(`${ENDPOINTS.WALLET.ADMIN_LIST_PAYOUTS}?${query.toString()}`, { method: "GET" });
}

export async function adminProcessPayout(id: number, data: { status: string; admin_note?: string }) {
    return apiClient(ENDPOINTS.WALLET.ADMIN_PROCESS_PAYOUT(id), {
        method: "PATCH",
        body: JSON.stringify(data),
    });
}

export async function adminGetPlatformRevenue(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    return apiClient(`${ENDPOINTS.WALLET.ADMIN_PLATFORM_REVENUE}?${query.toString()}`, { method: "GET" });
}

// User Wallet
export async function getUserWallet() {
    return apiClient(ENDPOINTS.USER_WALLET.GET, { method: "GET" });
}

export async function getUserWalletTransactions(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    return apiClient(`${ENDPOINTS.USER_WALLET.GET_TRANSACTIONS}?${query.toString()}`, { method: "GET" });
}

export async function initiateTopup(amount: number) {
    return apiClient(ENDPOINTS.USER_WALLET.TOPUP, {
        method: "POST",
        body: JSON.stringify({ amount }),
    });
}
