import { useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCart, clearCart } from "@/store/slices/cartSlice";
import { supabase } from "@/lib/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Custom hook to manage cart persistence with Supabase
 * Syncs cart data between sessionStorage, Redux, and Supabase
 */
export function useCartPersistence() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const hasLoaded = useRef(false);

  /**
   * Extract table number from order session token
   * Format: order_session_{uuid}_{uuid}_{tableNumber}
   */
  const getTableNumberFromSession = (sessionToken: string): string | null => {
    try {
      // Split by underscore and get the last part
      const parts = sessionToken.split("_");
      const lastPart = parts[parts.length - 1];

      // Check if it's a valid number
      const tableNumber = parseInt(lastPart, 10);
      if (!isNaN(tableNumber)) {
        return lastPart;
      }

      return null;
    } catch (error) {
      console.error("Error extracting table number:", error);
      return null;
    }
  };

  /**
   * Get session token and table number from sessionStorage
   */
  const getSessionInfo = useCallback(() => {
    const sessionToken = sessionStorage.getItem("order_session");

    if (!sessionToken) return null;
    const tableNumber = sessionStorage.getItem("table_number");

    return {
      sessionToken,
      tableNumber,
    };
  }, []);

  /**
   * Save cart to Supabase
   */
  const saveCartToSupabase = useCallback(
    async (items: CartItem[]) => {
      const sessionInfo = getSessionInfo();
      if (!sessionInfo) {
        console.log("No session token found, skipping Supabase save");
        return;
      }

      try {
        const { sessionToken, tableNumber } = sessionInfo;

        // Check if cart record exists
        const { data: existingCart, error: fetchError } = await supabase
          .from("carts")
          .select("*")
          .eq("session_token", sessionToken)
          .single();

        const cartData = {
          session_token: sessionToken,
          table_number: tableNumber ? parseInt(tableNumber, 10) : null,
          items: items,
          total: items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ),
          updated_at: new Date().toISOString(),
        };

        if (existingCart) {
          // Update existing cart
          const { error: updateError } = await supabase
            .from("carts")
            .update(cartData)
            .eq("session_token", sessionToken);

          if (updateError) {
            console.error("Error updating cart in Supabase:", updateError);
          } else {
            console.log("Cart updated in Supabase");
          }
        } else {
          // Insert new cart
          const { error: insertError } = await supabase.from("carts").insert([
            {
              ...cartData,
              created_at: new Date().toISOString(),
            },
          ]);

          if (insertError) {
            console.error("Error inserting cart in Supabase:", insertError);
          } else {
            console.log("Cart saved to Supabase");
          }
        }
      } catch (error) {
        console.error("Error saving cart to Supabase:", error);
      }
    },
    [getSessionInfo],
  );
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      return;
    }

    if (cart.items.length > 0) {
      saveCartToSupabase(cart.items);
    }
  }, [cart.items, saveCartToSupabase]);
  /**
   * Load cart from Supabase on mount
   */
  const loadCartFromSupabase = useCallback(async () => {
    const sessionInfo = getSessionInfo();
    if (!sessionInfo) {
      console.log("No session token found, skipping Supabase load");
      return;
    }

    try {
      const { sessionToken } = sessionInfo;

      const { data: cartData, error } = await supabase
        .from("carts")
        .select("*")
        .eq("session_token", sessionToken)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No cart found - this is normal for new sessions
          console.log("No existing cart found for this session");
        } else {
          console.error("Error loading cart from Supabase:", error);
        }
        return;
      }

      if (cartData && cartData.items && Array.isArray(cartData.items)) {
        console.log("Cart loaded from Supabase:", cartData.items);
        dispatch(setCart(cartData.items));
      }
    } catch (error) {
      console.error("Error loading cart from Supabase:", error);
    }
  }, [dispatch, getSessionInfo]);

  /**
   * Delete cart from Supabase
   */
  const deleteCartFromSupabase = useCallback(async () => {
    const sessionInfo = getSessionInfo();
    if (!sessionInfo) return;

    try {
      const { sessionToken } = sessionInfo;

      const { error } = await supabase
        .from("carts")
        .delete()
        .eq("session_token", sessionToken);

      if (error) {
        console.error("Error deleting cart from Supabase:", error);
      } else {
        console.log("Cart deleted from Supabase");
      }
    } catch (error) {
      console.error("Error deleting cart from Supabase:", error);
    }
  }, [getSessionInfo]);

  /**
   * Load cart on component mount
   */
  useEffect(() => {
    loadCartFromSupabase();
  }, [loadCartFromSupabase]);

  /**
   * Save cart to Supabase whenever it changes
   */

  /**
   * Subscribe to real-time cart updates (optional)
   */
  useEffect(() => {
    const sessionInfo = getSessionInfo();
    if (!sessionInfo) return;

    const { sessionToken } = sessionInfo;

    const channel = supabase
      .channel("cart-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "carts",
          filter: `session_token=eq.${sessionToken}`,
        },
        (payload) => {
          console.log("Cart changed:", payload);

          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            const newCart = payload.new as any;
            if (newCart.items && Array.isArray(newCart.items)) {
              dispatch(setCart(newCart.items));
            }
          } else if (payload.eventType === "DELETE") {
            dispatch(clearCart());
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch, getSessionInfo]);

  return {
    getSessionInfo,
    getTableNumberFromSession,
    saveCartToSupabase,
    loadCartFromSupabase,
    deleteCartFromSupabase,
  };
}
