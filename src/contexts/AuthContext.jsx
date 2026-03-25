import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";























const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    // Only fetch user data on genuine auth events to avoid double-fetching on mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Only re-fetch profile/role on real auth state changes, not the initial trigger
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            setTimeout(() => {
              fetchUserData(session.user.id);
            }, 0);
          }
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session — this is the primary fetch path on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase.
      from("profiles").
      select("*").
      eq("user_id", userId).
      maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch role
      const { data: roleData } = await supabase.
      from("user_roles").
      select("role").
      eq("user_id", userId).
      maybeSingle();

      if (roleData) {
        setRole(roleData.role);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, name, role) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          role
        }
      }
    });

    return { error: error };
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error: error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut
      }}>
      
      {children}
    </AuthContext.Provider>);

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}