'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/lib/utils/protectedRoute';
import { supabase } from '@/lib/supabase/client';
import { UserPlus, Trash2, ChefHat, Mail, Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  name: string;
  email: string;
  created_at: string;
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', name: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!restaurant) return;

      setRestaurantId(restaurant.id);

      // ── Pro check ──────────────────────────────────────────
      const { data: sub } = await supabase
        .from('restaurant_subscriptions')
        .select('status')
        .eq('restaurant_id', restaurant.id)
        .single();

      const proStatuses = ['active', 'trialing'];
      const userIsPro = proStatuses.includes(sub?.status || '');
      setIsPro(userIsPro);

      if (!userIsPro) {
        setLoading(false);
        return; // Don't fetch staff data for free users
      }
      // ───────────────────────────────────────────────────────

      fetchStaff(restaurant.id);
    };
    init();
  }, []);

  const fetchStaff = async (resId: string) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_staff')
        .select('*')
        .eq('restaurant_id', resId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !isPro) return;

    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: alreadyAdded } = await supabase
        .from('restaurant_staff')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('email', form.email)
        .maybeSingle();

      if (alreadyAdded) {
        setError('This person is already on your staff.');
        setAdding(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('restaurant_staff')
        .insert({
          restaurant_id: restaurantId,
          role: 'chef',
          name: form.name,
          email: form.email,
        });

      if (insertError) throw insertError;

      setSuccess(`${form.name} added as Chef. They can now log in with Google using ${form.email}.`);
      setForm({ email: '', name: '' });
      setShowAddForm(false);
      fetchStaff(restaurantId);
    } catch (err: any) {
      console.error('Error adding staff:', err);
      setError(err.message || 'Failed to add staff member.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStaff = async (staffId: string, name: string) => {
    if (!restaurantId || !isPro) return;
    if (!confirm(`Remove ${name} from your staff?`)) return;

    setDeleting(staffId);
    try {
      const { error } = await supabase
        .from('restaurant_staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
      setStaff((prev) => prev.filter((s) => s.id !== staffId));
    } catch (err) {
      console.error('Error removing staff:', err);
      alert('Failed to remove staff member.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Upgrade wall ────────────────────────────────────────────
  if (isPro === false) {
    return (
      <ProtectedRoute allowedRoles={['owner']}>
        <DashboardLayout>
          <div className="max-w-lg mx-auto mt-16 text-center px-4">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pro Feature</h2>
            <p className="text-gray-500 mb-2">
              Staff management is available on the <strong>Pro plan</strong>.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Add chef accounts so your kitchen staff can access the Kitchen Display without seeing your full dashboard.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6 text-left space-y-2.5">
              {[
                'Add unlimited chef accounts',
                'Chefs only see Kitchen Display',
                'Remove staff anytime',
                'Secure Google login for each chef',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-orange-800">
                  <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
            >
              <Zap className="w-5 h-5" />
              Upgrade to Pro
            </Link>
            <p className="text-xs text-gray-400 mt-3">
              Start with a 14-day free trial · No credit card required
            </p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  // ────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute allowedRoles={['owner']}>
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
            <p className="text-gray-500 mt-1">Add chefs who can access the kitchen display</p>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setError(null); setSuccess(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Add Chef
          </button>
        </div>

        {/* Success / Error messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
            ❌ {error}
          </div>
        )}

        {/* Add Staff Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              Add New Chef
            </h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="chef@gmail.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chef must log in using this exact Google account.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {adding ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" />Add Chef</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setError(null); }}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Your Staff ({staff.length})</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading staff...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center">
              <ChefHat className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No staff added yet</p>
              <p className="text-gray-400 text-sm mt-1">Add a chef to give them kitchen access</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail className="w-3.5 h-3.5" />
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold capitalize">
                      {member.role}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.user_id ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {member.user_id ? '● Active' : '○ Not logged in yet'}
                    </span>
                    <button
                      onClick={() => handleRemoveStaff(member.id, member.name)}
                      disabled={deleting === member.id}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <p className="font-semibold mb-1">How it works</p>
          <p>1. Add your chef's name and Google email above.</p>
          <p>2. Chef goes to <strong>tablesprint.com/login</strong> and signs in with Google.</p>
          <p>3. They are automatically redirected to the Kitchen Display — no dashboard access.</p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}