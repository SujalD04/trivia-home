import { create } from 'zustand';

export const useUserStore = create((set) => ({
  coins: 0,
  ownedItems: [],
  addCoins: (amount) =>
    set((state) => ({ coins: state.coins + amount })),
  buyItem: (itemName, price) =>
    set((state) => {
      if (state.coins >= price && !state.ownedItems.includes(itemName)) {
        return {
          coins: state.coins - price,
          ownedItems: [...state.ownedItems, itemName],
        };
      }
      return state;
    }),
}));
