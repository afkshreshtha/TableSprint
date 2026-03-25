'use client';

// app/dashboard/theme/page.tsx

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ThemeEditor from '@/components/dashboard/ThemeEditor';
import { RestaurantTheme } from '@/types/theme';

interface RestaurantData {
  id: string;
  name: string;
  theme: Partial<RestaurantTheme> | null;
}

export default function ThemePage() {
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('restaurants')
        .select('id, name, theme')
        .eq('owner_id', user.id)
        .single();

      if (data) setRestaurant(data);
      setLoading(false);
    };

    fetchRestaurant();
  }, []);

  return (
    <DashboardLayout restaurantName={restaurant?.name}>
      {loading || !restaurant ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Loading theme editor…</p>
          </div>
        </div>
      ) : (
        <ThemeEditor
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          initialTheme={restaurant.theme ?? undefined}
        />
      )}
    </DashboardLayout>
  );
}