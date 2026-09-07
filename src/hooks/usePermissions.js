import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

// ── usePermissions ────────────────────────────────────────────────────────────
// Returns helper functions to check what the current user is allowed to do.
//
// Usage:
//   const { can, isAdmin, loading } = usePermissions();
//   if (can('gallery_upload')) { ... }
//
// Permissions live in members.permissions (jsonb array).
// Admins (fezaclub@gmail.com) bypass all permission checks automatically.

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email === 'fezaclub@gmail.com';

  useEffect(() => {
    if (!user) { setPermissions([]); setLoading(false); return; }
    if (isAdmin) { setLoading(false); return; } // admins skip the query

    const fetch = async () => {
      const { data } = await supabase
        .from('members')
        .select('permissions')
        .eq('user_id', user.id)
        .maybeSingle();

      setPermissions(data?.permissions || []);
      setLoading(false);
    };
    fetch();
  }, [user?.id, isAdmin]);

  // can('gallery_upload') → true if admin OR permission is in the array
  const can = (permission) => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  return { can, isAdmin, permissions, loading };
};