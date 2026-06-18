import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export async function getProvinces() {
    return apiClient(ENDPOINTS.ADDRESS.PROVINCES);
}

export async function getDistricts(provinceId: number | string) {
    return apiClient(`${ENDPOINTS.ADDRESS.DISTRICTS}?province_id=${provinceId}`);
}

export async function getWards(districtId: number | string) {
    return apiClient(`${ENDPOINTS.ADDRESS.WARDS}?district_id=${districtId}`);
}
