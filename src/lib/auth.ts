import { supabase } from "./supabase";
import type { User } from "./supabase";

export const authService = {
  // Sign up with email and password
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: "teacher" | "student" | "parent",
    schoolName: string
  ) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Create user profile
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          school_name: schoolName,
        });

      if (profileError) throw profileError;

      // Create role-specific record
      if (role === "teacher") {
        await supabase.from("teachers").insert({
          user_id: authData.user.id,
          name: `${firstName} ${lastName}`,
          school_id: schoolName,
        });
      } else if (role === "student") {
        await supabase.from("students").insert({
          user_id: authData.user.id,
          name: `${firstName} ${lastName}`,
          class: "10-A",
          school_id: schoolName,
        });
      }

      return { user: authData.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      return { user: profile, session: data.session, error: null };
    } catch (error) {
      return { user: null, session: null, error };
    }
  },

  // Sign in with Gmail (OAuth)
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { user: null, profile: null };

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      return { user, profile };
    } catch (error) {
      return { user: null, profile: null, error };
    }
  },

  // Get current session
  async getSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  // Reset password email
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};
