import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "warungpos_session";

export const getSession = async () => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Gagal baca session:", error);
    return null;
  }
};

export const setSession = async (session) => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error("Gagal simpan session:", error);
    return false;
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    return true;
  } catch (error) {
    console.error("Gagal hapus session:", error);
    return false;
  }
};
