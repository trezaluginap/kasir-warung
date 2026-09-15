// Test de authStore — specifiek de OFFLINE login mode (geen Supabase env)
// en de fallback gedrag bij netwerkfout.
//
// Waarom mock? authStore importeert ../utils/supabaseClient (createClient van
// @supabase/supabase-js — externe HTTP client die niets doet in Jest zonder
// netwerk) en ../utils/authSession (AsyncStorage native RN module).
// Wij vervangen beide door fakes die wij 100% controleren.

// BELANGRIJK: jest.mock factories worden GEHOISTED (naar boven geplaatst).
// Daarom kunnen ze geen externe variabelen refereren die later gedefinieerd
// worden — elke jest.fn() moet INLINE in de factory aangemaakt worden.
jest.mock("../utils/authSession", () => ({
  getSession: jest.fn().mockResolvedValue(null),
  setSession: jest.fn().mockResolvedValue(true),
  clearSession: jest.fn().mockResolvedValue(true),
}));

// Supabase mock — de echte module wordt nooit aangeroepen in offline mode,
// maar moet bestaan zodat de import niet crasht.
jest.mock("../utils/supabaseClient", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

// BELANGRIJK: we verwijderen de env vars vóór de test, zodat de store in
// OFFLINE mode draait (de code-pad dat ook op een device zonder internet loopt).
beforeAll(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = "";
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "";
});

import useAuthStore from "../store/authStore";
import * as authSession from "../utils/authSession";

// Zustand store is singleton — state blijft tussen tests bestaan.
// Daarom resetten we de session vóór elke test.
beforeEach(() => {
  useAuthStore.setState({ session: null, isAuthReady: false });
});

describe("authStore — offline mode (geen SUPABASE env)", () => {
  test("login met juiste admin PIN slaagt", async () => {
    const result = await useAuthStore.getState().loginWithUsernamePin("admin", "1234");
    expect(result.success).toBe(true);
    expect(result.data.isOfflineMode).toBe(true);
    expect(useAuthStore.getState().session).not.toBeNull();
  });

  test("login met fout PIN faalt", async () => {
    const result = await useAuthStore.getState().loginWithUsernamePin("admin", "9999");
    expect(result.success).toBe(false);
    expect(useAuthStore.getState().session).toBeNull();
  });

  test("login met lege velden faalt validatie", async () => {
    const result = await useAuthStore.getState().loginWithUsernamePin("", "");
    expect(result.success).toBe(false);
  });

  test("logout wist session", async () => {
    await useAuthStore.getState().loginWithUsernamePin("admin", "1234");
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().session).toBeNull();
    expect(authSession.clearSession).toHaveBeenCalled();
  });
});