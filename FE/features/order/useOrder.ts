import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    calculateShipping,
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    confirmOrderReceived,
    trackGhnOrder,
    CheckoutPayload,
    ShippingCalculationPayload,
    createOrderFromProduct,
    getVnpayUrl,
    validateCoupon,
    getMyVouchers,
    ValidateCouponPayload,
    createReturnRequest,
    getMyReturnRequests,
    CreateReturnRequestPayload,
} from "@/lib/api/order";
import { getMyWallet, getWalletTransactions, requestPayout, RequestPayoutPayload, getUserWallet, getUserWalletTransactions, initiateTopup, getBankAccounts, addBankAccount, deleteBankAccount, setDefaultBankAccount, verifyBankAccount, BankAccountPayload, getMyPayoutRequests } from "@/lib/api/wallet";

export function useCalculateShipping() {
    return useMutation({
        mutationFn: (data: ShippingCalculationPayload) => calculateShipping(data),
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CheckoutPayload) => createOrder(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart-grouped"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}

export function useCreateOrderFromProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => createOrderFromProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}

export function useMyOrders(params?: { page?: number; limit?: number; status?: string }) {
    return useQuery({
        queryKey: ["orders", params],
        queryFn: () => getMyOrders(params),
    });
}

export function useOrderDetails(id: number) {
    return useQuery({
        queryKey: ["order", id],
        queryFn: () => getOrderById(id),
        enabled: !!id,
    });
}

export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cancelOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}

export function useConfirmOrderReceived() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: confirmOrderReceived,
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        },
    });
}

export function useTrackGhnOrder() {
    return useMutation({
        mutationFn: (orderId: number) => trackGhnOrder(orderId),
    });
}

export function useVnpayUrl() {
    return useMutation({
        mutationFn: (orderId: number) => getVnpayUrl(orderId),
    });
}

// ─── Coupon ───────────────────────────────────────────────
export function useValidateCoupon() {
    return useMutation({
        mutationFn: (payload: ValidateCouponPayload) => validateCoupon(payload),
    });
}

export function useMyVouchers() {
    return useQuery({
        queryKey: ["my-vouchers"],
        queryFn: getMyVouchers,
    });
}

// ─── Return Requests ──────────────────────────────────────
export function useCreateReturnRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateReturnRequestPayload) => createReturnRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["return-requests"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}

export function useMyReturnRequests() {
    return useQuery({
        queryKey: ["return-requests"],
        queryFn: getMyReturnRequests,
    });
}

// ─── Seller Wallet ────────────────────────────────────────
export function useMyWallet() {
    return useQuery({
        queryKey: ["wallet"],
        queryFn: getMyWallet,
    });
}

export function useWalletTransactions(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: ["wallet-transactions", params],
        queryFn: () => getWalletTransactions(params),
    });
}

export function useRequestPayout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RequestPayoutPayload) => requestPayout(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["my-payout-requests"] });
        },
    });
}

export function useMyPayoutRequests(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: ["my-payout-requests", params],
        queryFn: () => getMyPayoutRequests(params),
    });
}

export function useBankAccounts() {
    return useQuery({
        queryKey: ["bank-accounts"],
        queryFn: getBankAccounts,
    });
}

export function useAddBankAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: BankAccountPayload) => addBankAccount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
        },
    });
}

export function useDeleteBankAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteBankAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
        },
    });
}

export function useSetDefaultBankAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => setDefaultBankAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
        },
    });
}

export function useVerifyBankAccount() {
    return useMutation({
        mutationFn: ({ bin, accountNumber }: { bin: string; accountNumber: string }) =>
            verifyBankAccount(bin, accountNumber),
    });
}

// ─── User Wallet (Refund) ─────────────────────────────────
export function useUserWallet() {
    return useQuery({
        queryKey: ["user-wallet"],
        queryFn: getUserWallet,
    });
}

export function useUserWalletTransactions(params?: { page?: number; limit?: number }) {
    return useQuery({
        queryKey: ["user-wallet-transactions", params],
        queryFn: () => getUserWalletTransactions(params),
    });
}

export function useInitiateTopup() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (amount: number) => initiateTopup(amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
        },
    });
}

