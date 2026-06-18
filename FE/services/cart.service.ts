import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import type {
  AddToCartRequest,
  CartResponse,
  CartItemResponse,
  UpdateCartItemRequest,
} from "@/types/cart.types";

export const cartService = {
  async getCart(): Promise<CartResponse> {
    return apiClient(ENDPOINTS.CART.GET_CART, {
      method: "GET",
    });
  },

  async addItem(payload: AddToCartRequest): Promise<CartItemResponse> {
    return apiClient(ENDPOINTS.CART.ADD_ITEM, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateItem(
    itemId: number,
    payload: UpdateCartItemRequest
  ): Promise<CartItemResponse> {
    return apiClient(ENDPOINTS.CART.UPDATE_ITEM(itemId), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async removeItem(itemId: number): Promise<CartItemResponse> {
    return apiClient(ENDPOINTS.CART.REMOVE_ITEM(itemId), {
      method: "DELETE",
    });
  },

  async clearCart(): Promise<CartResponse> {
    return apiClient(ENDPOINTS.CART.CLEAR, {
      method: "DELETE",
    });
  },
};

