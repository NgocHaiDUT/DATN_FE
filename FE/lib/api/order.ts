import { apiClient } from "../api";
import { ENDPOINTS } from "@/constants/endpoint";

export interface CheckoutItem {
    variant_id: number;
    quantity: number;
}

export interface CheckoutPayload {
    shipping_address_id: number;
    items: CheckoutItem[];
    note?: string;
    payment_method?: "cod" | "online" | string;
    coupon_code?: string;
    user_voucher_id?: number;
}

export interface ShippingCalculationPayload {
    items: CheckoutItem[];
    shipping_address_id?: number;
}

export async function calculateShipping(data: ShippingCalculationPayload) {
    return await apiClient(ENDPOINTS.ORDERS.CALCULATE_SHIPPING, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function createOrder(data: CheckoutPayload) {
    return await apiClient(ENDPOINTS.ORDERS.CREATE, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export interface BuyNowPayload {
    product_id: number;
    variant_id?: number | null;
    quantity: number;
    shipping_address_id: number;
    note?: string;
    payment_method?: string;
    userId?: number;
    coupon_code?: string;
    user_voucher_id?: number;
}

export async function createOrderFromProduct(data: BuyNowPayload) {
    return await apiClient(ENDPOINTS.ORDERS.CREATE_FROM_PRODUCT, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getMyOrders(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.status) query.append("status", params.status);

    const res: any = await apiClient(`${ENDPOINTS.ORDERS.GET_MY_ORDERS}?${query.toString()}`, {
        method: "GET",
    });
    return Array.isArray(res) ? res : (res?.data || res?.orders || []);
}

export async function getOrderById(id: number) {
    const res: any = await apiClient(ENDPOINTS.ORDERS.GET_BY_ID(id), {
        method: "GET",
    });
    return res?.data || res;
}

export async function cancelOrder(id: number) {
    return apiClient(ENDPOINTS.ORDERS.CANCEL(id), {
        method: "POST",
    });
}

export async function confirmOrderReceived(id: number) {
    return apiClient(ENDPOINTS.ORDERS.CONFIRM_RECEIVED(id), {
        method: "POST",
    });
}

export async function trackGhnOrder(id: number) {
    const res: any = await apiClient(ENDPOINTS.ORDERS.TRACK_GHN(id), {
        method: "GET",
    });

    if (res?.success === false || Number(res?.status || res?.statusCode || 0) >= 400) {
        throw new Error(res?.message || "Khong the theo doi don hang");
    }

    return res?.data || res;
}

export async function getVnpayUrl(orderId: number) {
    return apiClient("/payment/create-vnpay-url", {
        method: "POST",
        body: JSON.stringify({ orderId }),
    });
}

// ─── Coupon ───────────────────────────────────────────────
export interface ValidateCouponPayload {
    code?: string;
    user_voucher_id?: number;
    subtotal: number;
    shipping_fee?: number;
}

export async function validateCoupon(payload: ValidateCouponPayload) {
    return apiClient(ENDPOINTS.COUPONS.VALIDATE, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getMyVouchers() {
    return apiClient(ENDPOINTS.COUPONS.MY, {
        method: "GET",
    });
}

// ─── Return Requests ──────────────────────────────────────
export interface CreateReturnRequestPayload {
    order_id: number;
    reason: string;
}

export async function createReturnRequest(data: CreateReturnRequestPayload) {
    return apiClient(ENDPOINTS.ORDERS.CREATE_RETURN_REQUEST, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function getMyReturnRequests() {
    return apiClient(ENDPOINTS.ORDERS.GET_MY_RETURN_REQUESTS, {
        method: "GET",
    });
}

