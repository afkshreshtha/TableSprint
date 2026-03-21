"use client";

import { useEffect, useState } from "react";
import { createSession } from "@/services/sessionServices";
import { useAppDispatch } from "@/store/hooks";
import { addItem, decreaseItem, setCart, clearCart } from "@/store/slices/cartSlice";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { getCart } from "@/services/cartServices";
import { ShoppingCart, Plus, Minus, Leaf } from "lucide-react";
import { useCartPersistence } from "@/hooks/useCartPersistence";
import { supabase } from "@/lib/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Table {
  id: string;
  table_number: number;
}

interface Category {
  id: string;
  name: string;
  display_order?: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  is_available: boolean;
  is_vegetarian: boolean;
  image_url?: string;
}

interface TableClientProps {
  restaurant: Restaurant;
  table: Table;
  categories: Category[];
  items: MenuItem[];
}

export default function TableClient({
  restaurant,
  table,
  categories,
  items,
}: TableClientProps) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const { deleteCartFromSupabase } = useCartPersistence();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);

        const existingToken = sessionStorage.getItem("order_session");
        const existingRestaurantId = sessionStorage.getItem("session_restaurant_id");

        // ── KEY FIX: check if existing session belongs to THIS restaurant ──
        const isSameRestaurant = existingRestaurantId === restaurant.id;

        if (existingToken && isSameRestaurant) {
          // ── Same restaurant: validate session still exists in DB ──
          const { data: sessionData } = await supabase
            .from("order_sessions")
            .select("id")
            .eq("session_token", existingToken)
            .maybeSingle();

          if (sessionData) {
            // Valid session for this restaurant — reuse it
            setSessionToken(existingToken);
            const cartItems = await getCart(existingToken);

            if (cartItems && Array.isArray(cartItems)) {
              const formatted = cartItems.map((item: any) => ({
                id: item.menu_items.id,
                name: item.menu_items.name,
                price: item.menu_items.price,
                quantity: item.quantity,
              }));
              dispatch(setCart(formatted));
            }

            setLoading(false);
            return;
          }
        }

        // ── Different restaurant OR no session OR expired session ──
        // Clear everything from the previous restaurant
        dispatch(clearCart());
        sessionStorage.removeItem("order_session");
        sessionStorage.removeItem("session_restaurant_id");
        sessionStorage.removeItem("table_number");

        // Create a fresh session for this restaurant
        const session = await createSession(
          restaurant.id,
          table.id,
          table.table_number,
        );
        const token = session.session_token;

        // Store both token AND restaurant_id so we can detect switches
        sessionStorage.setItem("order_session", token);
        sessionStorage.setItem("session_restaurant_id", restaurant.id);  // ← NEW
        sessionStorage.setItem("table_number", table.table_number.toString());

        setSessionToken(token);
      } catch (error) {
        console.error("Error initializing session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [dispatch, restaurant.id, table.id]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleIncrease = (item: MenuItem) => {
    dispatch(addItem({ id: item.id, name: item.name, price: item.price, quantity: 1 }));
  };

  const handleDecrease = (item: MenuItem) => {
    const cartItem = cart.items.find((i) => i.id === item.id);
    if (!cartItem) return;

    if (cartItem.quantity === 1) {
      const confirmRemove = confirm("Remove this item from cart?");
      if (confirmRemove) {
        deleteCartFromSupabase();
        dispatch(decreaseItem(item.id));
      }
    } else {
      dispatch(decreaseItem(item.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{restaurant.name}</h1>
            <p className="text-orange-100 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-orange-300 rounded-full"></span>
              Table {table.table_number}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Categories Navigation */}
        {categories && categories.length > 0 && (
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#category-${category.id}`}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 text-sm font-medium"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items by Category */}
        {categories && categories.length > 0 ? (
          categories.map((category) => {
            const categoryItems = items?.filter(
              (item) => item.category_id === category.id && item.is_available,
            );
            if (!categoryItems || categoryItems.length === 0) return null;

            return (
              <div key={category.id} id={`category-${category.id}`} className="mb-16 scroll-mt-24">
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 pb-3 border-b-2 border-orange-500">
                    {category.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryItems.map((item) => {
                    const cartItem = cart.items.find((i) => i.id === item.id);

                    return (
                      <div
                        key={item.id}
                        className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        {item.image_url ? (
                          <div className="w-full h-48 bg-gray-200 overflow-hidden">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                            <div className="text-orange-300 text-5xl">🍽️</div>
                          </div>
                        )}

                        <div className="p-5 sm:p-6">
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                                {item.name}
                              </h3>
                              {item.is_vegetarian && (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                  <Leaf size={12} />
                                  Vegetarian
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {item.description || "No description available"}
                          </p>

                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 font-medium">Price</span>
                              <span className="text-2xl font-bold text-orange-600">
                                ₹{item.price.toFixed(2)}
                              </span>
                            </div>

                            {!cartItem ? (
                              <button
                                onClick={() => handleIncrease(item)}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 group/btn"
                              >
                                <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
                                Add
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button
                                  onClick={() => handleDecrease(item)}
                                  className="p-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                  <Minus size={18} />
                                </button>
                                <span className="w-8 text-center font-bold text-gray-900">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  onClick={() => handleIncrease(item)}
                                  className="p-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No menu items available</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6 px-4 z-40">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => router.push(`/r/${restaurant.slug}/cart`)}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-between px-6 shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <span className="flex items-center gap-3">
                <ShoppingCart size={24} />
                <div className="text-left">
                  <p className="text-sm text-orange-100">Your Cart</p>
                  <p className="text-lg font-bold">
                    {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </span>
              <span className="text-2xl font-bold">
                ₹{cart.total?.toFixed(2) ?? "0.00"}
              </span>
            </button>
          </div>
        </div>
      )}

      {cart.items.length > 0 && <div className="h-28" />}
      {cart.items.length === 0 && <div className="h-16" />}

      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-6 bg-white border border-gray-300 rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300 z-30"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7m0 0l-7 7m7-7v12" />
          </svg>
        </button>
      )}
    </div>
  );
}