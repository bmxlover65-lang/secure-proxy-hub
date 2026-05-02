import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "reseller";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: Role[];
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);

  const loadRoles = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setRoles([]);
      return;
    }
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error) {
      console.error("Failed to load user roles", error.message);
      setRoles([]);
      return;
    }
    setRoles((data ?? []).map((r) => r.role as Role));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setRolesLoading(true);
      setTimeout(() => {
        loadRoles(s?.user?.id).finally(() => {
          setAuthReady(true);
          setRolesLoading(false);
        });
      }, 0);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthReady(true);
      setRolesLoading(true);
      loadRoles(s?.user?.id).finally(() => setRolesLoading(false));
    });
    return () => sub.subscription.unsubscribe();
  }, [loadRoles]);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    roles,
    loading: !authReady || rolesLoading,
    isAdmin: roles.includes("admin"),
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshRoles: async () => {
      setRolesLoading(true);
      await loadRoles(session?.user?.id).finally(() => setRolesLoading(false));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}