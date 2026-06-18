import { apiClient } from "../api";
import { ENDPOINTS } from "@/constants/endpoint";

export interface Address {
    id: number;
    user_id: number;
    full_name: string;
    phone_number: string;
    province_id: number;
    district_id: number;
    ward_code: string;
    address_detail: string;
    is_default: boolean;
    province_name?: string;
    district_name?: string;
    ward_name?: string;
}

export async function getMyAddresses(): Promise<Address[]> {
    const res: any = await apiClient(ENDPOINTS.PROFILE.GET_ALL_ADDRESSES, { method: "GET" });
    return res?.data || [];
}

export async function addAddress(data: Omit<Address, "id" | "user_id">) {
    return apiClient(ENDPOINTS.PROFILE.ADD_ADDRESS, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateAddress(addressId: number, data: Partial<Address>) {
    return apiClient(ENDPOINTS.PROFILE.UPDATE_ADDRESS(addressId), {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteAddress(addressId: number) {
    return apiClient(ENDPOINTS.PROFILE.DELETE_ADDRESS(addressId), {
        method: "DELETE",
    });
}
