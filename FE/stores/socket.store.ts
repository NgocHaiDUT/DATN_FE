import { create } from "zustand";

interface SocketState {
  onlineUsers: number[];
  onlineShops: number[];
  setOnlineUsers: (users: number[]) => void;
  setOnlineShops: (shops: number[]) => void;
  addUser: (userId: number) => void;
  removeUser: (userId: number) => void;
  addShop: (shopId: number) => void;
  removeShop: (shopId: number) => void;
  isUserOnline: (userId?: number) => boolean;
  isShopOnline: (shopId?: number) => boolean;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  onlineUsers: [],
  onlineShops: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setOnlineShops: (shops) => set({ onlineShops: shops }),
  addUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.includes(userId)
        ? state.onlineUsers
        : [...state.onlineUsers, userId],
    })),
  removeUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),
  addShop: (shopId) =>
    set((state) => ({
      onlineShops: state.onlineShops.includes(shopId)
        ? state.onlineShops
        : [...state.onlineShops, shopId],
    })),
  removeShop: (shopId) =>
    set((state) => ({
      onlineShops: state.onlineShops.filter((id) => id !== shopId),
    })),
  isUserOnline: (userId) => {
    if (!userId) return false;
    return get().onlineUsers.includes(userId);
  },
  isShopOnline: (shopId) => {
    if (!shopId) return false;
    return get().onlineShops.includes(shopId);
  },
}));
