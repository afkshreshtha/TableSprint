import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Add item or increase quantity
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find((i) => i.id === action.payload.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }

      state.total += action.payload.price;
    },

    // Increase quantity by 1
    increaseItem: (state, action: PayloadAction<string>) => {
      const existing = state.items.find((i) => i.id === action.payload);

      if (existing) {
        existing.quantity += 1;
        state.total += existing.price;
      }
    },

    // Decrease quantity by 1
    decreaseItem: (state, action: PayloadAction<string>) => {
      const existing = state.items.find((i) => i.id === action.payload);

      if (!existing) return;

      existing.quantity -= 1;
      state.total -= existing.price;

      if (existing.quantity === 0) {
        state.items = state.items.filter((i) => i.id !== action.payload);
      }
    },

    // Remove item completely from cart
    removeItem: (state, action: PayloadAction<string>) => {
      const existing = state.items.find((i) => i.id === action.payload);

      if (existing) {
        state.total -= existing.price * existing.quantity;
        state.items = state.items.filter((i) => i.id !== action.payload);
      }
    },

    // Set entire cart (used when loading from Supabase)
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.total = action.payload.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    },

    // Clear entire cart
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { 
  addItem, 
  increaseItem, 
  decreaseItem, 
  removeItem, 
  setCart, 
  clearCart 
} = cartSlice.actions;

export default cartSlice.reducer;