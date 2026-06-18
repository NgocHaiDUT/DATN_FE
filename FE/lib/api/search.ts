import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export async function generalSearch(query: string, type?: string, limit: number = 20) {
    const params = new URLSearchParams();
    params.append('q', query);
    if (type) params.append('type', type);
    params.append('limit', limit.toString());

    return await apiClient(`${ENDPOINTS.SEARCH.ALL}?${params.toString()}`, {
        method: "GET"
    });
}

export async function searchUsers(query: string, limit: number = 20) {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return await apiClient(`${ENDPOINTS.SEARCH.USERS}?${params.toString()}`, {
        method: "GET"
    });
}

export async function searchShops(query: string, limit: number = 20) {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return await apiClient(`${ENDPOINTS.SEARCH.SHOPS}?${params.toString()}`, {
        method: "GET"
    });
}

export async function searchHashtags(query: string, limit: number = 20) {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return await apiClient(`${ENDPOINTS.SEARCH.HASHTAGS}?${params.toString()}`, {
        method: "GET"
    });
}

export async function getAutocomplete(query: string, limit: number = 5) {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return await apiClient(`${ENDPOINTS.SEARCH.AUTOCOMPLETE}?${params.toString()}`, {
        method: "GET"
    });
}
