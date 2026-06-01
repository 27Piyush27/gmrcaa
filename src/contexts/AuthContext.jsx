import { createContext, useContext, useEffect, useState, useRef } from "react";

import { supabase } from "@/integrations/supabase/client";























const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  // Guard against double-fetching when both getSession and onAuthStateChange fire
  const fetchingForRef = useRef(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    // Only fetch user data on genuine auth events to avoid double-fetching on mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // During password recovery, do NOT set the user/session so the
        // ResetPassword page stays visible instead of redirecting.
        if (event === "PASSWORD_RECOVERY") {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Only re-fetch profile/role on real auth state changes, not the initial trigger
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
            // Skip if we're already fetching for this exact user (race condition guard)
            if (fetchingForRef.current === session.user.id) return;
            setLoading(true);
            fetchUserData(session.user.id);
          }
        } else {
          fetchingForRef.current = null;
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
        // Only fetch if onAuthStateChange hasn't already started fetching
        if (fetchingForRef.current !== session.user.id) {
          fetchUserData(session.user.id);
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    fetchingForRef.current = userId;
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

  const signUp = async (email, password, name) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name }
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