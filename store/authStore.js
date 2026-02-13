import { create } from "zustand";
import { clearSession, getSession, setSession } from "../utils/authSession";
import { supabase } from "../utils/supabaseClient";

const useAuthStore = create((set) => ({
  session: null,
  isAuthReady: false,

  loadSession: async () => {
    const session = await getSession();
    set({ session, isAuthReady: true });
  },

  loginWithUsernamePin: async (username, pin) => {
    const cleanUsername = String(username || "").trim();
    const cleanPin = String(pin || "").trim();

    if (!cleanUsername || !cleanPin) {
      return { success: false, message: "Username dan PIN wajib diisi" };
    }

    if (
      !process.env.EXPO_PUBLIC_SUPABASE_URL ||
      !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return { success: false, message: "Supabase belum dikonfigurasi" };
    }

    const { data, error } = await supabase.rpc("login_user", {
      p_username: cleanUsername,
      p_pin: cleanPin,
    });

    if (error) {
      return { success: false, message: "Login gagal: " + error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, message: "Username atau PIN salah" };
    }

    const user = {
      id: data[0].id,
      username: data[0].username,
      loginAt: new Date().toISOString(),
    };

    await setSession(user);
    set({ session: user });

    return { success: true, data: user };
  },

  logout: async () => {
    await clearSession();
    set({ session: null });
  },
}));

export default useAuthStore;
