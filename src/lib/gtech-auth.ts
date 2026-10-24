import { supabase } from "@/integrations/external-supabase/client";

export type AppRole = "teacher" | "parent" | "student";

const DEMO_ACCOUNT_ROLES: Record<string, AppRole> = {
  "teacher@gtech.com": "teacher",
  "student@gtech.com": "student",
  "parent@gtech.com": "parent",
};

export function getDemoAccountRole(email: string): AppRole | null {
  return DEMO_ACCOUNT_ROLES[email.trim().toLowerCase()] ?? null;
}

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  school_name: string;
  role: AppRole;
  student_id: number | null;
};

const WHITELIST_MESSAGE =
  "This email is not on the school's authorized users list. Ask the school administrator to add you.";

function isWhitelistError(message: string | undefined | null) {
  if (!message) return false;
  return message.includes("ACCESS_DENIED") || message.toLowerCase().includes("authorized users list");
}

/** Fetch the signed-in user's profile (role + linked student). */
export async function fetchProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, school_name, role, student_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Profile | null) ?? null;
}

/**
 * Sign up. The database rejects any email that is not on the
 * `authorized_users` whitelist, so external people cannot register.
 */
export async function signUpWhitelisted(params: {
  email: string;
  password: string;
  fullName: string;
  schoolName: string;
  /** Destination portal chosen before sign-up; restored after email confirmation. */
  role?: AppRole;
}): Promise<{ profile: Profile | null; needsEmailConfirmation: boolean }> {
  const email = params.email.trim().toLowerCase();

  const redirectTo = params.role
    ? `${window.location.origin}/?role=${params.role}`
    : window.location.origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: params.password,
    options: {
      emailRedirectTo: redirectTo,
      data: { full_name: params.fullName, school_name: params.schoolName },
    },
  });
  if (error) {
    throw new Error(isWhitelistError(error.message) ? WHITELIST_MESSAGE : error.message);
  }
  if (!data.user) throw new Error("Sign-up failed. Please try again.");

  // No session yet (email confirmation pending) — the profile row is created
  // on first successful sign-in instead.
  if (!data.session) return { profile: null, needsEmailConfirmation: true };

  const profile = await ensureProfile({
    userId: data.user.id,
    email,
    fullName: params.fullName,
    schoolName: params.schoolName,
  });
  return { profile, needsEmailConfirmation: false };
}

/** Sign in and return the whitelisted profile. */
export async function signInWhitelisted(params: {
  email: string;
  password: string;
  schoolName: string;
}): Promise<Profile> {
  const email = params.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: params.password,
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("database error")) {
      throw new Error(
        "The database isn't set up yet, so no account could be created. Run supabase-FIX-LOGIN-run-this-first.sql then supabase-schema-for-your-project.sql in your Supabase SQL Editor.",
      );
    }
    if (msg.includes("invalid login credentials")) {
      throw new Error(
        "No account matches this email and password. If you never completed sign-up, create the account first (or use Forgot password).",
      );
    }
    throw new Error(error.message);
  }
  if (!data.user) throw new Error("Sign-in failed. Please try again.");

  const demoRole = getDemoAccountRole(email);
  const fullName =
    (data.user.user_metadata?.["full_name"] as string | undefined) ?? email.split("@")[0];

  if (demoRole) {
    let existingProfile: Profile | null = null;
    try {
      existingProfile = await fetchProfile();
    } catch (profileError) {
      console.warn(
        `[Auth] Could not load the profile for authenticated demo account ${email}; using its configured demo role.`,
        profileError,
      );
    }
    if (!existingProfile) {
      console.warn(
        `[Auth] No profile was found for authenticated demo account ${email}; using its configured demo role.`,
      );
    }

    return {
      id: data.user.id,
      email: existingProfile?.email ?? email,
      full_name: existingProfile?.full_name || fullName,
      school_name: existingProfile?.school_name || params.schoolName,
      role: demoRole,
      student_id: existingProfile?.student_id ?? null,
    };
  }

  const profile = await ensureProfile({
    userId: data.user.id,
    email,
    fullName,
    schoolName: params.schoolName,
  });
  if (!profile) throw new Error(WHITELIST_MESSAGE);
  return profile;
}

/**
 * Creates the profile row if missing. The `profiles_enforce_whitelist`
 * trigger blocks the insert (and assigns the correct role + student link)
 * when the email is not whitelisted.
 */
async function ensureProfile(params: {
  userId: string;
  email: string;
  fullName: string;
  schoolName: string;
}): Promise<Profile> {
  const existing = await fetchProfile();
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: params.userId,
      email: params.email,
      full_name: params.fullName,
      school_name: params.schoolName,
      // Overwritten by the whitelist trigger with the authorized values.
      role: "student",
    })
    .select("id, email, full_name, school_name, role, student_id")
    .single();

  if (error) {
    await supabase.auth.signOut();
    throw new Error(isWhitelistError(error.message) ? WHITELIST_MESSAGE : error.message);
  }
  return data as Profile;
}

export async function signOut() {
  await supabase.auth.signOut();
}

const NOT_REGISTERED_MESSAGE =
  "No account exists for this email. Please enter the exact email address you used to register the app.";

/** True when an account already exists for this email. */
export async function emailIsRegistered(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase();
  const { data, error } = await supabase.rpc("email_is_registered", { p_email: clean });
  if (error) {
    throw new Error(
      "Unable to verify this email right now. Please try again later or contact the school administrator.",
    );
  }
  return data === true;
}

/** Send a password-reset link — only to an email that already has an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  const clean = email.trim().toLowerCase();

  const registered = await emailIsRegistered(clean);
  if (!registered) throw new Error(NOT_REGISTERED_MESSAGE);

  const { error } = await supabase.auth.resetPasswordForEmail(clean, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}


/** Set a new password for the currently recovering/signed-in user. */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
