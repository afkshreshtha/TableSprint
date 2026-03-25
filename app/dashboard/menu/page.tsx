"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/lib/utils/protectedRoute";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Zap,
  Lock,
  UtensilsCrossed,
  Tag,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_popular: boolean;
  categories: { name: string };
}

const FREE_ITEM_LIMIT = 5;
const FREE_CATEGORY_LIMIT = 3;

export default function MenuPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [topSellerIds, setTopSellerIds] = useState<Set<string>>(new Set());

  // Category modal
  const [categoryName, setCategoryName] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Item modal
  const [itemForm, setItemForm] = useState({
    category_id: "",
    name: "",
    description: "",
    price: "",
    is_vegetarian: false,
    is_available: true,
  });
  const [showItem, setShowItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "item" | "category";
    id: string;
    name: string;
  } | null>(null);

  // Upgrade nudge modal
  const [showUpgradeModal, setShowUpgradeModal] = useState<
    "items" | "categories" | null
  >(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      if (!restaurant) return;

      setRestaurantId(restaurant.id);

      const { data: sub } = await supabase
        .from("restaurant_subscriptions")
        .select("status")
        .eq("restaurant_id", restaurant.id)
        .single();

      setIsPro(["active", "trialing"].includes(sub?.status || ""));

      const [{ data: cats }, { data: menu }] = await Promise.all([
        // In your Promise.all fetch, add ordering:
        supabase
          .from("categories")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("menu_items")
          .select("*, categories(name)")
          .eq("restaurant_id", restaurant.id)
          .order("created_at", { ascending: true }),
      ]);
      // Auto-detect top 3 popular items from last 30 days
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .gte("created_at", since.toISOString())
        .neq("status", "cancelled")
        .eq("payment_status", "paid");

      if (recentOrders && recentOrders.length > 0) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("menu_item_id, quantity")
          .in(
            "order_id",
            recentOrders.map((o) => o.id),
          );

        const countMap = new Map<string, number>();
        orderItems?.forEach((oi) => {
          if (!oi.menu_item_id) return;
          countMap.set(
            oi.menu_item_id,
            (countMap.get(oi.menu_item_id) || 0) + oi.quantity,
          );
        });

        const top3 = Array.from(countMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id]) => id);

        setTopSellerIds(new Set(top3));
      }
      setCategories(cats || []);
      setItems(menu || []);
      setLoading(false);
    };
    init();
  }, []);
  const togglePopular = async (item: MenuItem) => {
    const newVal = !item.is_popular;
    await supabase
      .from("menu_items")
      .update({ is_popular: newVal })
      .eq("id", item.id);
    fetchData();
  };
  const fetchData = async () => {
    if (!restaurantId) return;
    const [{ data: cats }, { data: menu }] = await Promise.all([
      // In your Promise.all fetch, add ordering:
      supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*, categories(name)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true }),
    ]);
    setCategories(cats || []);
    setItems(menu || []);
  };

  const handleSaveCategory = async (e: any) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setSaving(true);
    if (editingCategory) {
      await supabase
        .from("categories")
        .update({ name: categoryName })
        .eq("id", editingCategory.id);
    } else {
      await supabase.from("categories").insert({
        name: categoryName,
        restaurant_id: restaurantId,
        display_order: categories.length,
      });
    }
    setSaving(false);
    setCategoryName("");
    setEditingCategory(null);
    setShowCategory(false);
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchData();
  };

  const handleSaveItem = async (e: any) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.category_id || !itemForm.price)
      return;
    setSaving(true);
    if (editingItem) {
      await supabase
        .from("menu_items")
        .update({
          category_id: itemForm.category_id,
          name: itemForm.name,
          description: itemForm.description,
          price: parseFloat(itemForm.price),
          is_available: itemForm.is_available,
          is_vegetarian: itemForm.is_vegetarian,
        })
        .eq("id", editingItem.id);
    } else {
      await supabase.from("menu_items").insert({
        restaurant_id: restaurantId,
        category_id: itemForm.category_id,
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        is_available: itemForm.is_available,
        is_vegetarian: itemForm.is_vegetarian,
      });
    }
    setSaving(false);
    resetItemForm();
    setShowItem(false);
    fetchData();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("menu_items").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchData();
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      is_vegetarian: item.is_vegetarian,
      is_available: item.is_available,
    });
    setShowItem(true);
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({
      category_id: "",
      name: "",
      description: "",
      price: "",
      is_vegetarian: false,
      is_available: true,
    });
  };

  const handleAddItem = () => {
    if (!isPro && items.length >= FREE_ITEM_LIMIT) {
      setShowUpgradeModal("items");
      return;
    }
    resetItemForm();
    setShowItem(true);
  };

  const handleAddCategory = () => {
    if (!isPro && categories.length >= FREE_CATEGORY_LIMIT) {
      setShowUpgradeModal("categories");
      return;
    }
    setCategoryName("");
    setEditingCategory(null);
    setShowCategory(true);
  };

  const visibleItems = isPro ? items : items.slice(0, FREE_ITEM_LIMIT);
  const visibleCategories = isPro
    ? categories
    : categories.slice(0, FREE_CATEGORY_LIMIT);
  const hiddenItems = items.length - visibleItems.length;
  const hiddenCategories = categories.length - visibleCategories.length;

  // Replace filteredItems to filter from visibleItems only:
  const filteredItems =
    activeCategory === "all"
      ? visibleItems
      : visibleItems.filter((i) => i.category_id === activeCategory);

  const itemsAtLimit = !isPro && items.length >= FREE_ITEM_LIMIT;
  const categoriesAtLimit = !isPro && categories.length >= FREE_CATEGORY_LIMIT;

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-7 h-7 text-orange-600 animate-pulse" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Loading menu…</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <DashboardLayout>
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Menu
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {items.length} item{items.length !== 1 ? "s" : ""} ·{" "}
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddCategory}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                categoriesAtLimit
                  ? "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {categoriesAtLimit ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Tag className="w-3.5 h-3.5" />
              )}
              Add Category
              {categoriesAtLimit && (
                <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  PRO
                </span>
              )}
            </button>
            <button
              onClick={handleAddItem}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                itemsAtLimit
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  : "bg-orange-600 text-white hover:bg-orange-700 shadow-sm shadow-orange-200"
              }`}
            >
              {itemsAtLimit ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Item
              {itemsAtLimit && (
                <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  PRO
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Free plan usage bar ── */}
        {isPro === false && (
          <div className="bg-white border border-orange-100 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Free Plan Usage
                </span>
              </div>
              <Link
                href="/dashboard/pricing"
                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                Upgrade to Pro <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Menu Items</span>
                  <span
                    className={
                      items.length >= FREE_ITEM_LIMIT
                        ? "text-orange-600 font-bold"
                        : "text-gray-700 font-semibold"
                    }
                  >
                    {visibleItems.length} / {FREE_ITEM_LIMIT}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${items.length >= FREE_ITEM_LIMIT ? "bg-orange-500" : "bg-emerald-500"}`}
                    style={{
                      width: `${Math.min((visibleItems.length / FREE_ITEM_LIMIT) * 100, 100)}%`,
                    }}
                  />
                </div>
                {hiddenItems > 0 ? (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    {hiddenItems} item{hiddenItems > 1 ? "s" : ""} hidden ·{" "}
                    <Link
                      href="/dashboard/pricing"
                      className="underline font-bold"
                    >
                      Resubscribe
                    </Link>
                  </p>
                ) : (
                  items.length >= FREE_ITEM_LIMIT && (
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      Limit reached · Upgrade for unlimited
                    </p>
                  )
                )}
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Categories</span>
                  <span
                    className={
                      categories.length >= FREE_CATEGORY_LIMIT
                        ? "text-orange-600 font-bold"
                        : "text-gray-700 font-semibold"
                    }
                  >
                    {visibleCategories.length} / {FREE_CATEGORY_LIMIT}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${categories.length >= FREE_CATEGORY_LIMIT ? "bg-orange-500" : "bg-blue-500"}`}
                    style={{
                      width: `${Math.min((visibleCategories.length / FREE_CATEGORY_LIMIT) * 100, 100)}%`,
                    }}
                  />
                </div>
                {hiddenCategories > 0 ? (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    {hiddenCategories} categor
                    {hiddenCategories > 1 ? "ies" : "y"} hidden ·{" "}
                    <Link
                      href="/dashboard/pricing"
                      className="underline font-bold"
                    >
                      Resubscribe
                    </Link>
                  </p>
                ) : (
                  categories.length >= FREE_CATEGORY_LIMIT && (
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      Limit reached · Upgrade for unlimited
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Hidden warning banner */}
            {(hiddenItems > 0 || hiddenCategories > 0) && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <p className="text-xs text-orange-700 font-medium">
                  Your subscription has ended.{" "}
                  {hiddenItems > 0 &&
                    `${hiddenItems} menu item${hiddenItems > 1 ? "s" : ""} `}
                  {hiddenItems > 0 && hiddenCategories > 0 && "and "}
                  {hiddenCategories > 0 &&
                    `${hiddenCategories} categor${hiddenCategories > 1 ? "ies" : "y"} `}
                  hidden.{" "}
                  <Link
                    href="/dashboard/pricing"
                    className="underline font-bold"
                  >
                    Resubscribe
                  </Link>{" "}
                  to restore access.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Category Filter Tabs ── */}
        {visibleCategories.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              All ({visibleItems.length})
            </button>
            {visibleCategories.map((cat) => {
              const count = items.filter(
                (i) => i.category_id === cat.id,
              ).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all group relative ${
                    activeCategory === cat.id
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-orange-200 hover:text-orange-600"
                  }`}
                >
                  {cat.name}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeCategory === cat.id
                        ? "bg-orange-700 text-orange-100"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                  {/* Edit/Delete on hover */}
                  <span className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategory(cat);
                        setCategoryName(cat.name);
                        setShowCategory(true);
                      }}
                      className="w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
                    >
                      <Edit2 className="w-2.5 h-2.5 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          type: "category",
                          id: cat.id,
                          name: cat.name,
                        });
                      }}
                      className="w-5 h-5 bg-white border border-red-200 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50"
                    >
                      <X className="w-2.5 h-2.5 text-red-500" />
                    </button>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Menu Items Grid ── */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <UtensilsCrossed className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold mb-1">
              No items {activeCategory !== "all" ? "in this category" : "yet"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Add your first menu item to get started
            </p>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {item.is_vegetarian ? (
                        <span className="w-4 h-4 rounded border-2 border-green-600 flex items-center justify-center flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-green-600 block" />
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded border-2 border-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="w-2 h-2 rounded-full bg-red-500 block" />
                        </span>
                      )}
                      <h3 className="font-bold text-gray-900 text-base truncate">
                        {item.name}
                      </h3>
                      {item.is_popular && (
                        <span className="flex items-center gap-1 text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          🔥 Popular
                        </span>
                      )}
                      {/* Auto-suggest badge — shows when sales data suggests it but owner hasn't toggled yet */}
                      {!item.is_popular && topSellerIds.has(item.id) && (
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          ✦ Suggested
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
                      {item.categories?.name || "Uncategorized"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {/* Popular toggle */}
                    <button
                      onClick={() => togglePopular(item)}
                      title={
                        item.is_popular
                          ? "Remove popular tag"
                          : topSellerIds.has(item.id)
                            ? "Mark as popular (suggested)"
                            : "Mark as popular"
                      }
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                        item.is_popular
                          ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                          : topSellerIds.has(item.id)
                            ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                            : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      🔥
                    </button>
                    <button
                      onClick={() => openEditItem(item)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: "item",
                          id: item.id,
                          name: item.name,
                        })
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Description */}
                <p className="text-gray-400 text-xs leading-relaxed mb-4 flex-1 line-clamp-2">
                  {item.description || "No description added"}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                    ₹
                    {item.price % 1 === 0
                      ? item.price.toFixed(0)
                      : item.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      item.is_available
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.is_available ? "● Available" : "○ Out of stock"}
                  </span>
                </div>
              </div>
            ))}

            {/* Ghost "locked" cards for free users near limit */}
            {isPro === false && items.length >= FREE_ITEM_LIMIT && (
              <div
                onClick={() => setShowUpgradeModal("items")}
                className="border-2 border-dashed border-orange-200 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors group min-h-[160px]"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <Lock className="w-5 h-5 text-orange-600" />
                </div>
                {hiddenItems > 0 ? (
                  <>
                    <p className="text-sm font-bold text-orange-700 mb-1">
                      +{hiddenItems} Hidden Item{hiddenItems > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-orange-500 text-center">
                      Resubscribe to restore all your menu items
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-orange-700 mb-1">
                      Add More Items
                    </p>
                    <p className="text-xs text-orange-500 text-center">
                      Upgrade to Pro for unlimited menu items
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Upgrade Modal ── */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                {showUpgradeModal === "items"
                  ? hiddenItems > 0
                    ? `${hiddenItems} Items Hidden`
                    : `${FREE_ITEM_LIMIT} Item Limit Reached`
                  : hiddenCategories > 0
                    ? `${hiddenCategories} Categories Hidden`
                    : `${FREE_CATEGORY_LIMIT} Category Limit Reached`}
              </h3>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                {showUpgradeModal === "items"
                  ? hiddenItems > 0
                    ? `Your subscription ended. Resubscribe to restore your ${hiddenItems} hidden item${hiddenItems > 1 ? "s" : ""}.`
                    : `Free plan allows up to ${FREE_ITEM_LIMIT} menu items. Upgrade to Pro for unlimited items.`
                  : hiddenCategories > 0
                    ? `Your subscription ended. Resubscribe to restore your ${hiddenCategories} hidden categor${hiddenCategories > 1 ? "ies" : "y"}.`
                    : `Free plan allows up to ${FREE_CATEGORY_LIMIT} categories. Upgrade to Pro for unlimited categories.`}
              </p>
              <div className="bg-orange-50 rounded-xl p-4 mb-5 text-left space-y-2">
                {[
                  "Unlimited menu items",
                  "Unlimited categories",
                  "Full analytics history",
                  "Chef staff accounts",
                  "Priority support",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-sm text-orange-800"
                  >
                    <Zap className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Maybe later
                </button>
                <Link
                  href="/dashboard/pricing"
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Upgrade Now
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Category Modal ── */}
        {showCategory && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCategory ? "Edit Category" : "New Category"}
                </h3>
                <button
                  onClick={() => {
                    setShowCategory(false);
                    setCategoryName("");
                    setEditingCategory(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="e.g. Starters, Main Course, Desserts"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategory(false);
                      setCategoryName("");
                      setEditingCategory(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                  >
                    {saving
                      ? "Saving…"
                      : editingCategory
                        ? "Update"
                        : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Item Modal ── */}
        {showItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingItem ? "Edit Item" : "New Menu Item"}
                </h3>
                <button
                  onClick={() => {
                    setShowItem(false);
                    resetItemForm();
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, category_id: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all"
                    required
                  >
                    <option value="">Select a category</option>
                    {visibleCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Item Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, name: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="e.g. Paneer Tikka"
                    required
                    autoFocus
                  />
                </div>
                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, description: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                    rows={2}
                    placeholder="Describe the dish..."
                  />
                </div>
                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₹) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemForm.price}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, price: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${itemForm.is_vegetarian ? "border-green-500 bg-green-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
                  >
                    <input
                      type="checkbox"
                      checked={itemForm.is_vegetarian}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          is_vegetarian: e.target.checked,
                        })
                      }
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${itemForm.is_vegetarian ? "border-green-600 bg-green-600" : "border-gray-300"}`}
                    >
                      {itemForm.is_vegetarian && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      🌱 Vegetarian
                    </span>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${itemForm.is_available ? "border-emerald-500 bg-emerald-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}
                  >
                    <input
                      type="checkbox"
                      checked={itemForm.is_available}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          is_available: e.target.checked,
                        })
                      }
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${itemForm.is_available ? "border-emerald-600 bg-emerald-600" : "border-gray-300"}`}
                    >
                      {itemForm.is_available && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      ✓ Available
                    </span>
                  </label>
                </div>
                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowItem(false);
                      resetItemForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : editingItem ? (
                      "Update Item"
                    ) : (
                      "Add to Menu"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Delete Confirm ── */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                Delete {deleteConfirm.type === "item" ? "Item" : "Category"}?
              </h3>
              <p className="text-gray-400 text-sm text-center mb-1">
                <span className="font-semibold text-gray-600">
                  "{deleteConfirm.name}"
                </span>
              </p>
              <p className="text-gray-400 text-xs text-center mb-6">
                This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    deleteConfirm.type === "item"
                      ? deleteItem(deleteConfirm.id)
                      : deleteCategory(deleteConfirm.id)
                  }
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
