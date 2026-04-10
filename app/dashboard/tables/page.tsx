"use client";

import { useEffect, useState, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/lib/utils/protectedRoute";
import {
  Plus,
  QrCode,
  Printer,
  Download,
  Edit2,
  Trash2,
  X,
  Lock,
  Zap,
  Users,
  ToggleLeft,
  ToggleRight,
  Palette,
  ChevronRight,
  AlertCircle,
  Check,
} from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  is_active: boolean;
}

interface QRBranding {
  restaurantName: string;
  tagline: string;
  primaryColor: string;
  showLogo: boolean;
  showUrl: boolean;
  borderStyle: "none" | "simple" | "elegant" | "bold";
}

const FREE_TABLE_LIMIT = 5;

const DEFAULT_BRANDING: QRBranding = {
  restaurantName: "",
  tagline: "Scan to order",
  primaryColor: "#ea580c",
  showLogo: false,
  showUrl: true,
  borderStyle: "elegant",
};

export default function TablesPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  const [showAddTable, setShowAddTable] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Table | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBrandingPanel, setShowBrandingPanel] = useState(false);

  const [tableForm, setTableForm] = useState({
    table_number: "",
    capacity: "4",
  });
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  const [branding, setBranding] = useState<QRBranding>(DEFAULT_BRANDING);
  const [tempBranding, setTempBranding] =
    useState<QRBranding>(DEFAULT_BRANDING);

  const qrRef = useRef<QRCodeStyling | null>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, slug, name")
        .eq("owner_id", user.id)
        .single();
      if (!restaurant) return;

      setRestaurantId(restaurant.id);
      setRestaurantSlug(restaurant.slug);
      setRestaurantName(restaurant.name || "");

      const { data: sub } = await supabase
        .from("restaurant_subscriptions")
        .select("status")
        .eq("restaurant_id", restaurant.id)
        .single();
      const pro = ["active", "trialing"].includes(sub?.status || "");
      setIsPro(pro);

      // Load saved branding from DB if pro
      if (pro) {
        const { data: settings } = await supabase
          .from("restaurants")
          .select("qr_branding")
          .eq("id", restaurant.id)
          .single();
        if (settings?.qr_branding) {
          setBranding({
            ...DEFAULT_BRANDING,
            restaurantName: restaurant.name || "",
            ...settings.qr_branding,
          });
          setTempBranding({
            ...DEFAULT_BRANDING,
            restaurantName: restaurant.name || "",
            ...settings.qr_branding,
          });
        } else {
          setBranding((b) => ({ ...b, restaurantName: restaurant.name || "" }));
          setTempBranding((b) => ({
            ...b,
            restaurantName: restaurant.name || "",
          }));
        }
      } else {
        setBranding((b) => ({ ...b, restaurantName: restaurant.name || "" }));
        setTempBranding((b) => ({
          ...b,
          restaurantName: restaurant.name || "",
        }));
      }

      const { data: tablesData } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurant.id)

        .order("created_at", { ascending: true });
      const allTables = tablesData || [];
      setTables(allTables);
      setLoading(false);
    };
    init();
  }, []);

  const fetchTables = async () => {
    if (!restaurantId) return;
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("table_number");
    setTables(data || []);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.table_number || !tableForm.capacity) return;
    setSaving(true);
    if (editingTableId) {
      await supabase
        .from("tables")
        .update({
          table_number: parseInt(tableForm.table_number),
          capacity: parseInt(tableForm.capacity),
        })
        .eq("id", editingTableId);
    } else {
      await supabase.from("tables").insert({
        table_number: parseInt(tableForm.table_number),
        capacity: parseInt(tableForm.capacity),
        is_active: true,
        restaurant_id: restaurantId,
      });
    }
    setSaving(false);
    setShowAddTable(false);
    setEditingTableId(null);
    setTableForm({ table_number: "", capacity: "4" });
    fetchTables();
  };

  const deleteTable = async (tableId: string) => {
    await supabase.from("tables").delete().eq("id", tableId);
    setDeleteConfirm(null);
    fetchTables();
  };

  const toggleTableStatus = async (tableId: string, current: boolean) => {
    await supabase
      .from("tables")
      .update({ is_active: !current })
      .eq("id", tableId);
    fetchTables();
  };

  const handleAddTable = () => {
    if (!isPro && tables.length >= FREE_TABLE_LIMIT) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingTableId(null);
    setTableForm({ table_number: "", capacity: "4" });
    setShowAddTable(true);
  };

  const openEditTable = (table: Table) => {
    setEditingTableId(table.id);
    setTableForm({
      table_number: table.table_number.toString(),
      capacity: table.capacity.toString(),
    });
    setShowAddTable(true);
  };

  const generateQR = (table: Table, customBranding?: QRBranding) => {
    const b = customBranding || branding;
    const url = `${window.location.origin}/r/${restaurantSlug}/table/${table.table_number}`;
    const qr = new QRCodeStyling({
      width: 300,
      height: 300,
      data: url,
      margin: 12,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: { color: b.primaryColor, type: "rounded" },
      backgroundOptions: { color: "#ffffff" },
      cornersSquareOptions: { color: b.primaryColor, type: "extra-rounded" },
      cornersDotOptions: { color: b.primaryColor, type: "dot" },
    });
    return qr;
  };

  const openQRModal = (table: Table) => {
    setSelectedTable(table);
    setShowQRModal(true);
    setTimeout(() => {
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = "";
        const qr = generateQR(table);
        qrRef.current = qr;
        qr.append(qrContainerRef.current);
      }
    }, 100);
  };

  const refreshQR = () => {
    if (!selectedTable || !qrContainerRef.current) return;
    qrContainerRef.current.innerHTML = "";
    const qr = generateQR(selectedTable, tempBranding);
    qrRef.current = qr;
    qr.append(qrContainerRef.current);
  };

  useEffect(() => {
    if (showQRModal && selectedTable) refreshQR();
  }, [tempBranding]);

  const saveBranding = async () => {
    setBranding(tempBranding);
    if (restaurantId && isPro) {
      await supabase
        .from("restaurants")
        .update({ qr_branding: tempBranding })
        .eq("id", restaurantId);
    }
    setShowBrandingPanel(false);
  };

  const downloadQR = () => {
    if (qrRef.current && selectedTable) {
      qrRef.current.download({
        name: `table-${selectedTable.table_number}-qr`,
        extension: "png",
      });
    }
  };

  const printQR = () => {
    const url = `${window.location.origin}/r/${restaurantSlug}/table/${selectedTable?.table_number}`;
    const b = branding;
    const borderStyles: Record<string, string> = {
      none: "",
      simple: "border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px;",
      elegant: `border: 3px solid ${b.primaryColor}; border-radius: 16px; padding: 24px; box-shadow: 0 0 0 6px ${b.primaryColor}20;`,
      bold: `border: 6px solid ${b.primaryColor}; border-radius: 8px; padding: 20px;`,
    };
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Table ${selectedTable?.table_number} QR Code</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 360px; ${borderStyles[b.borderStyle]} }
          .restaurant-name { font-size: 22px; font-weight: 800; color: ${b.primaryColor}; margin-bottom: 4px; letter-spacing: -0.5px; }
          .tagline { font-size: 13px; color: #6b7280; margin-bottom: 16px; font-weight: 500; }
          .qr-wrapper { margin: 8px 0 16px; }
          .table-badge { background: ${b.primaryColor}; color: white; padding: 6px 20px; border-radius: 100px; font-size: 15px; font-weight: 700; margin-bottom: 12px; display: inline-block; }
          .url { font-size: 9px; color: #9ca3af; font-family: monospace; word-break: break-all; max-width: 280px; margin-top: 8px; }
          .powered { font-size: 9px; color: #d1d5db; margin-top: 12px; }
          img { display: block; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="card">
${
  isPro
    ? `${b.restaurantName ? `<div class="restaurant-name">${b.restaurantName}</div>` : ""}
     ${b.tagline ? `<div class="tagline">${b.tagline}</div>` : ""}`
    : `<div class="restaurant-name" style="color:#ea580c">Tabrova</div>
     <div class="tagline">QR Ordering App</div>`
}
          <div id="qr-print" class="qr-wrapper"></div>
          <div class="table-badge">Table ${selectedTable?.table_number}</div>
          ${b.showUrl ? `<div class="url">${url}</div>` : ""}
          <div class="powered">Powered by Tabrova</div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js"></script>
        <script>
          const qr = new QRCodeStyling({
            width: 260, height: 260, data: "${url}", margin: 10,
            qrOptions: { errorCorrectionLevel: "H" },
            dotsOptions: { color: "${b.primaryColor}", type: "rounded" },
            backgroundOptions: { color: "#ffffff" },
            cornersSquareOptions: { color: "${b.primaryColor}", type: "extra-rounded" },
            cornersDotOptions: { color: "${b.primaryColor}", type: "dot" },
          });
          qr.append(document.getElementById("qr-print"));
          setTimeout(() => window.print(), 800);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };
  const visibleTables = isPro ? tables : tables.slice(0, FREE_TABLE_LIMIT); // oldest 5 due to created_at ASC sort

  const hiddenCount = tables.length - visibleTables.length;
  const tablesAtLimit = !isPro && tables.length >= FREE_TABLE_LIMIT;

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["owner"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-7 h-7 text-orange-600 animate-pulse" />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                Loading tables…
              </p>
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
              Tables
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {tables.length} table{tables.length !== 1 ? "s" : ""} · QR
              ordering enabled
            </p>
          </div>
          <div className="flex gap-2">
            {isPro && (
              <button
                onClick={() => {
                  setTempBranding(branding);
                  setShowBrandingPanel(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all"
              >
                <Palette className="w-4 h-4 text-orange-500" />
                QR Branding
              </button>
            )}
            <button
              onClick={handleAddTable}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tablesAtLimit
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  : "bg-orange-600 text-white hover:bg-orange-700 shadow-sm shadow-orange-200"
              }`}
            >
              {tablesAtLimit ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Table
              {tablesAtLimit && (
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700">
                  Tables ({visibleTables.length}/{FREE_TABLE_LIMIT} shown)
                </span>
              </div>
              <Link
                href="/dashboard/pricing"
                className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                Upgrade for unlimited <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  tables.length >= FREE_TABLE_LIMIT
                    ? "bg-orange-500"
                    : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min((visibleTables.length / FREE_TABLE_LIMIT) * 100, 100)}%`,
                }}
              />
            </div>
            {hiddenCount > 0 && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <p className="text-xs text-orange-700 font-medium">
                  {hiddenCount} table{hiddenCount > 1 ? "s are" : " is"} hidden
                  — your subscription has ended.{" "}
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
            {tables.length >= FREE_TABLE_LIMIT && hiddenCount === 0 && (
              <p className="text-xs text-orange-600 mt-1.5 font-medium">
                Limit reached · Upgrade to Pro for unlimited tables
              </p>
            )}
          </div>
        )}

        {/* ── Tables Grid ── */}
        {tables.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
              <QrCode className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold mb-1">No tables yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Add your first table to generate QR codes
            </p>
            <button
              onClick={handleAddTable}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add First Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleTables.map((table) => (
              <div
                key={table.id}
                className={`group bg-white border rounded-2xl p-5 flex flex-col transition-all duration-200 hover:shadow-md ${table.is_active ? "border-gray-100 hover:border-gray-200" : "border-gray-200 bg-gray-50/50"}`}
              >
                {/* Top */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        Table {table.table_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500 font-medium">
                        {table.capacity} seats
                      </span>
                    </div>
                  </div>
                  {/* Active toggle */}
                  <button
                    onClick={() => toggleTableStatus(table.id, table.is_active)}
                    className="flex items-center gap-1.5 transition-colors"
                    title={table.is_active ? "Deactivate" : "Activate"}
                  >
                    {table.is_active ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-gray-300" />
                    )}
                  </button>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${table.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {table.is_active ? "● Active" : "○ Inactive"}
                  </span>
                </div>

                {/* QR Button */}
                <button
                  onClick={() => openQRModal(table)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors mb-2 shadow-sm shadow-orange-100"
                >
                  <QrCode className="w-4 h-4" /> View QR Code
                </button>

                {/* Edit / Delete */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditTable(table)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(table)}
                    className="flex items-center justify-center w-9 py-2 border border-red-100 text-red-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Ghost locked card */}
            {isPro === false && tables.length >= FREE_TABLE_LIMIT && (
              <div
                onClick={() => setShowUpgradeModal(true)}
                className="border-2 border-dashed border-orange-200 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50 transition-colors group min-h-[200px]"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <Lock className="w-5 h-5 text-orange-600" />
                </div>
                {hiddenCount > 0 ? (
                  <>
                    <p className="text-sm font-bold text-orange-700 mb-1">
                      +{hiddenCount} Hidden Table{hiddenCount > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-orange-500 text-center">
                      Resubscribe to restore all your tables
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-orange-700 mb-1">
                      Add More Tables
                    </p>
                    <p className="text-xs text-orange-500 text-center">
                      Upgrade for unlimited tables + custom QR branding
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── QR Modal ── */}
        {showQRModal && selectedTable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Table {selectedTable.table_number} — QR Code
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Download or print for your table
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedTable(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* QR Preview Card */}
              <div className="p-6">
                <div
                  style={{
                    border:
                      branding.borderStyle === "none"
                        ? "none"
                        : branding.borderStyle === "simple"
                          ? "2px solid #e5e7eb"
                          : branding.borderStyle === "elegant"
                            ? `3px solid ${branding.primaryColor}`
                            : `6px solid ${branding.primaryColor}`,
                    borderRadius: branding.borderStyle === "bold" ? 8 : 16,
                    padding: 24,
                    boxShadow:
                      branding.borderStyle === "elegant"
                        ? `0 0 0 6px ${branding.primaryColor}20`
                        : "0 2px 16px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    background: "#fff",
                  }}
                >
                  {isPro ? (
                    <>
                      {branding.restaurantName && (
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: branding.primaryColor,
                            marginBottom: 2,
                            letterSpacing: "-0.5px",
                          }}
                        >
                          {branding.restaurantName}
                        </p>
                      )}
                      {branding.tagline && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            marginBottom: 12,
                            fontWeight: 500,
                          }}
                        >
                          {branding.tagline}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: "#ea580c",
                          marginBottom: 2,
                          letterSpacing: "-0.5px",
                        }}
                      >
                        Tabrova
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          marginBottom: 12,
                          fontWeight: 500,
                        }}
                      >
                        QR Ordering App
                      </p>
                    </>
                  )}
                  {branding.tagline && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginBottom: 12,
                        fontWeight: 500,
                      }}
                    >
                      {branding.tagline}
                    </p>
                  )}
                  <div ref={qrContainerRef} style={{ margin: "4px 0 12px" }} />
                  <span
                    style={{
                      background: branding.primaryColor,
                      color: "#fff",
                      padding: "5px 18px",
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Table {selectedTable.table_number}
                  </span>
                  {branding.showUrl && (
                    <p
                      style={{
                        fontSize: 9,
                        color: "#9ca3af",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                        maxWidth: 240,
                        marginTop: 6,
                      }}
                    >
                      {window.location.origin}/r/{restaurantSlug}/table/
                      {selectedTable.table_number}
                    </p>
                  )}
                </div>

                {/* Pro branding toggle */}
                {isPro ? (
                  <button
                    onClick={() => {
                      setTempBranding(branding);
                      setShowBrandingPanel(true);
                    }}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border border-dashed border-orange-300 text-orange-600 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-colors"
                  >
                    <Palette className="w-4 h-4" /> Customize Branding
                  </button>
                ) : (
                  <Link
                    href="/dashboard/pricing"
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-orange-200 text-orange-500 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-colors"
                  >
                    <Lock className="w-4 h-4" /> Custom branding available on
                    Pro
                  </Link>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={downloadQR}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button
                    onClick={printQR}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── QR Branding Panel ── */}
        {showBrandingPanel && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    QR Code Branding
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Customize how your QR codes look when printed
                  </p>
                </div>
                <button
                  onClick={() => setShowBrandingPanel(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Restaurant Name on QR
                  </label>
                  <input
                    type="text"
                    value={tempBranding.restaurantName}
                    onChange={(e) =>
                      setTempBranding((b) => ({
                        ...b,
                        restaurantName: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="Your Restaurant Name"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={tempBranding.tagline}
                    onChange={(e) =>
                      setTempBranding((b) => ({
                        ...b,
                        tagline: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="Scan to order · Enjoy your meal"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={tempBranding.primaryColor}
                      onChange={(e) =>
                        setTempBranding((b) => ({
                          ...b,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {[
                        "#ea580c",
                        "#dc2626",
                        "#7c3aed",
                        "#2563eb",
                        "#059669",
                        "#d97706",
                        "#0f172a",
                      ].map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            setTempBranding((b) => ({ ...b, primaryColor: c }))
                          }
                          className="w-7 h-7 rounded-lg border-2 transition-all"
                          style={{
                            background: c,
                            borderColor:
                              tempBranding.primaryColor === c
                                ? "#111"
                                : "transparent",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Border Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Border Style
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["none", "simple", "elegant", "bold"] as const).map(
                      (style) => (
                        <button
                          key={style}
                          onClick={() =>
                            setTempBranding((b) => ({
                              ...b,
                              borderStyle: style,
                            }))
                          }
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                            tempBranding.borderStyle === style
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {style}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <span className="text-sm font-semibold text-gray-700">
                      Show URL below QR
                    </span>
                    <button
                      onClick={() =>
                        setTempBranding((b) => ({ ...b, showUrl: !b.showUrl }))
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative ${tempBranding.showUrl ? "bg-orange-500" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${tempBranding.showUrl ? "left-6" : "left-1"}`}
                      />
                    </button>
                  </label>
                </div>

                {/* Save */}
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setShowBrandingPanel(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveBranding}
                    className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save Branding
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Add/Edit Table Modal ── */}
        {showAddTable && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingTableId ? "Edit Table" : "New Table"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddTable(false);
                    setEditingTableId(null);
                    setTableForm({ table_number: "", capacity: "4" });
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <form
                onSubmit={
                  editingTableId
                    ? async (e) => {
                        e.preventDefault();
                        await handleSaveTable(e);
                      }
                    : handleSaveTable
                }
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Table Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    autoFocus
                    value={tableForm.table_number}
                    onChange={(e) =>
                      setTableForm({
                        ...tableForm,
                        table_number: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="e.g. 1, 2, 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Seating Capacity <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[2, 4, 6, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setTableForm({ ...tableForm, capacity: n.toString() })
                        }
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${tableForm.capacity === n.toString() ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={tableForm.capacity}
                    onChange={(e) =>
                      setTableForm({ ...tableForm, capacity: e.target.value })
                    }
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="Or enter custom number"
                  />
                </div>
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTable(false);
                      setEditingTableId(null);
                    }}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : editingTableId ? (
                      "Update Table"
                    ) : (
                      "Add Table"
                    )}
                  </button>
                </div>
              </form>
            </div>
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
                {hiddenCount > 0
                  ? `${hiddenCount} Tables Hidden`
                  : `${FREE_TABLE_LIMIT} Table Limit Reached`}
              </h3>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                {hiddenCount > 0
                  ? `Your subscription has ended. Resubscribe to Pro to restore your ${hiddenCount} hidden table${hiddenCount > 1 ? "s" : ""} and resume full access.`
                  : `Free plan includes up to ${FREE_TABLE_LIMIT} tables. Upgrade to Pro for unlimited tables and custom QR branding.`}
              </p>
              <div className="bg-orange-50 rounded-xl p-4 mb-5 text-left space-y-2">
                {[
                  "Unlimited tables",
                  "Custom QR branding (logo, colors, border)",
                  "Restaurant name on printed QR",
                  "Unlimited menu items",
                  "Full analytics history",
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
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Maybe later
                </button>
                <Link
                  href="/dashboard/pricing"
                  className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Upgrade Now
                </Link>
              </div>
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
                Delete Table {deleteConfirm.table_number}?
              </h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                This will permanently remove the table and its QR code.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTable(deleteConfirm.id)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
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
