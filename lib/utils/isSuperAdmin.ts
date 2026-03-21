import { supabase } from '@/lib/supabase/client';

export async function isSuperAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: admin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    return !!admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}