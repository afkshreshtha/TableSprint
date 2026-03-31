"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Save, Upload, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  upi_id: string;
  upi_qr_url?: string;
  service_charge_percent: number;
  tax_percent: number;
  opening_time: string;
  closing_time: string;
}

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    address: "",
    phone: "",
    upi_id: "",
    service_charge_percent: "5",
    tax_percent: "5",
    opening_time: "09:00",
    closing_time: "22:00",
  });

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      // ── Use maybeSingle() instead of single() so it returns null instead of erroring ──
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();                          // ← KEY CHANGE

      if (error) throw error;

      if (data) {
        // Restaurant exists — populate form
        setRestaurant(data);
        setForm({
          name: data.name || "",
          slug: data.slug || "",
          address: data.address || "",
          phone: data.phone || "",
          upi_id: data.upi_id || "",
          service_charge_percent: data.service_charge_percent?.toString() || "5",
          tax_percent: data.tax_percent?.toString() || "5",
          opening_time: data.opening_time || "09:00",
          closing_time: data.closing_time || "22:00",
        });
      } else {
        // ── No restaurant found — create one automatically ──
        const defaultSlug = user.email
          ?.split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-") ?? "my-restaurant";

        const { data: created, error: createError } = await supabase
          .from("restaurants")
          .insert({
            owner_id: user.id,
            name: user.user_metadata?.full_name
              ? `${user.user_metadata.full_name}'s Restaurant`
              : "My Restaurant",
            slug: defaultSlug,
            email: user.email,
            service_charge_percent: 5,
            tax_percent: 5,
            opening_time: "09:00",
            closing_time: "22:00",
          })
          .select()
          .single();

        if (createError) throw createError;

        setRestaurant(created);
        setForm({
          name: created.name || "",
          slug: created.slug || "",
          address: created.address || "",
          phone: created.phone || "",
          upi_id: created.upi_id || "",
          service_charge_percent: created.service_charge_percent?.toString() || "5",
          tax_percent: created.tax_percent?.toString() || "5",
          opening_time: created.opening_time || "09:00",
          closing_time: created.closing_time || "22:00",
        });
      }
    } catch (error) {
      console.error("Error fetching/creating restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const updates = {
        name: form.name,
        slug: form.slug,
        address: form.address,
        phone: form.phone,
        upi_id: form.upi_id,
        service_charge_percent: parseFloat(form.service_charge_percent),
        tax_percent: parseFloat(form.tax_percent),
        opening_time: form.opening_time,
        closing_time: form.closing_time,
      };

      const { error } = await supabase
        .from("restaurants")
        .update(updates)
        .eq("owner_id", user.id);

      if (error) throw error;

      alert("Settings saved successfully!");
      fetchRestaurant();
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Restaurant Settings
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your restaurant information and preferences
          </p>
        </div>

        <form onSubmit={saveSettings} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="Your Restaurant Name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">tabrova.com/r/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-"),
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                    placeholder="your-restaurant"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This will be your restaurant's URL. Only lowercase letters,
                  numbers, and hyphens.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="Full address"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Operating Hours</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={form.opening_time}
                  onChange={(e) =>
                    setForm({ ...form, opening_time: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={form.closing_time}
                  onChange={(e) =>
                    setForm({ ...form, closing_time: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="yourname@upi"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Used for generating UPI payment links
                </p>
              </div>


            </div>
          </div>

          {/* Pricing Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Charge (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.service_charge_percent}
                  onChange={(e) =>
                    setForm({ ...form, service_charge_percent: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="5"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax / GST (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tax_percent}
                  onChange={(e) =>
                    setForm({ ...form, tax_percent: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-transparent"
                  placeholder="5"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}