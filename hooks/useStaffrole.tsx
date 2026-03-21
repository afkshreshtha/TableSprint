// hooks/useStaffRole.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export type StaffRole = 'owner' | 'chef' | null;

interface UseStaffRoleReturn {
  role: StaffRole;
  restaurantId: string | null;
  loading: boolean;
}

export function useStaffRole(): UseStaffRoleReturn {
  const [role, setRole] = useState<StaffRole>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Check if owner first
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (restaurant) {
          setRole('owner');
          setRestaurantId(restaurant.id);
          setLoading(false);
          return;
        }

        // Check if staff (chef)
        const { data: staff } = await supabase
          .from('restaurant_staff')
          .select('role, restaurant_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (staff) {
          setRole(staff.role as StaffRole);
          setRestaurantId(staff.restaurant_id);
        }
      } catch (error) {
        console.error('Error getting staff role:', error);
      } finally {
        setLoading(false);
      }
    };

    getRole();
  }, []);

  return { role, restaurantId, loading };
}