import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart.service";
import type {
  AddToCartRequest,
  Cart,
  CartItem,
  CartResponse,
} from "@/types/cart.types";

const CART_QUERY_KEY = ["cart-raw"];

export const useCart = () => {
  const queryClient = useQueryClient();

  const cartQuery = useQuery<CartResponse>({
    queryKey: CART_QUERY_KEY,
    queryFn: () => cartService.getCart(),
    staleTime: 5 * 60 * 1000,
  });

  const addItem = useMutation({
    mutationFn: (payload: AddToCartRequest) => cartService.addItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const updateItem = useMutation({
    mutationFn: ({
      itemId,
      quantity,
    }: {
      itemId: number;
      quantity: number;
    }) => cartService.updateItem(itemId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const removeItem = useMutation({
    mutationFn: (itemId: number) => cartService.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const clearCart = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const cart: Cart | undefined = cartQuery.data?.cart;
  const items: CartItem[] = cart?.cart_items || [];

  return {
    cart,
    items,
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    refetch: cartQuery.refetch,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    removeItem: removeItem.mutateAsync,
    clearCart: clearCart.mutateAsync,
  };
};

