import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

let storedId = localStorage.getItem('quizUserId');
if (!storedId) {
  storedId = uuidv4();
  localStorage.setItem('quizUserId', storedId);
}

export const useUserStore = create((set) => ({
  userId: storedId,
  coins: 0,
  ownedItems: [],

  // Allows resetting or changing userId manually if needed
  setUserId: (id) => {
    localStorage.setItem('quizUserId', id);
    set({ userId: id });
  },

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
