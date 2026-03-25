"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Download, Search, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Order {
  id: string;
  order_number: string;
  table_number: number;
  status: string;
  payment_method: string;
  payment_status: string;
  total: number;
  created_at: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Step 1: get restaurant ID once on mount
  useEffect(() => {
    const getRestaurantId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (data) setRestaurantId(data.id);
    };

    getRestaurantId();
  }, []);

  // Step 2: fetch orders only after restaurantId is ready
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);

      let query = supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId) // ← KEY FIX
        .order("created_at", { ascending: false });

      const now = new Date();
      if (dateFilter === "today") {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startOfDay.toISOString());
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("created_at", weekAgo.toISOString());
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte("created_at", monthAgo.toISOString());
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, dateFilter, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table_number.toString().includes(searchTerm),
  );
  const cancelledOrders = filteredOrders.filter(
    (o) => o.status === "cancelled",
  );
  const activeOrders = filteredOrders.filter((o) => o.status !== "cancelled");

  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const lostRevenue = cancelledOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue =
    activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

  const exportToCSV = () => {
    const headers = [
      "Order Number",
      "Table",
      "Status",
      "Payment",
      "Total",
      "Date",
    ];
    const rows = filteredOrders.map((o) => [
      o.order_number,
      o.table_number,
      o.status,
      o.payment_method,
      o.total,
      new Date(o.created_at).toLocaleString("en-IN"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const formatCurrency = (n: number) => `₹${n.toFixed(2)}`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    ready: "bg-green-100 text-green-800",
    served: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <p className="text-gray-600 mt-1">View and analyze past orders</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">
            {filteredOrders.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {cancelledOrders.length} cancelled
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {activeOrders.length} completed
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Avg Order Value</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(avgOrderValue)}
          </p>
          <p className="text-xs text-gray-400 mt-1">excl. cancelled</p>
        </div>

        {/* Loss card — only shown if there are cancellations */}
        {lostRevenue > 0 ? (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <p className="text-xs text-red-500 mb-1 font-medium">
              Lost Revenue
            </p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(lostRevenue)}
            </p>
            <p className="text-xs text-red-400 mt-1">
              from {cancelledOrders.length} cancellation
              {cancelledOrders.length > 1 ? "s" : ""}
            </p>
          </div>
        ) : (
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <p className="text-xs text-green-600 mb-1 font-medium">
              Lost Revenue
            </p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(0)}
            </p>
            <p className="text-xs text-green-500 mt-1">no cancellations</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order number or table..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
            />
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    "Order",
                    "Table",
                    "Date & Time",
                    "Status",
                    "Payment",
                    "Total",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        h === "Total" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      #{order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      Table {order.table_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">
                        {formatDate(order.created_at)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(order.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 capitalize">
                          {order.payment_method}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            order.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
