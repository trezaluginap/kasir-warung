import { isSupabaseConfigured, syncProdukUpload, syncProdukDownload } from "../services/syncService";
import { supabase } from "../utils/supabaseClient";

jest.mock("../utils/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("../database/productService", () => ({
  ambilSemuaProduk: jest.fn().mockResolvedValue([
    {
      id: 1,
      sync_id: "p_123",
      nama: "Rokok Sampoerna",
      harga: 30000,
      updated_at: "2026-09-14T10:00:00.000Z",
    },
  ]),
  tambahProduk: jest.fn().mockResolvedValue({ id: 2, sync_id: "p_456" }),
  updateProduk: jest.fn().mockResolvedValue(true),
  hapusProduk: jest.fn().mockResolvedValue(true),
}));

describe("syncService", () => {
  test("isSupabaseConfigured returns boolean", () => {
    expect(typeof isSupabaseConfigured()).toBe("boolean");
  });

  test("syncProdukUpload returns result object", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    });

    const res = await syncProdukUpload();
    expect(res).toHaveProperty("success");
  });

  test("syncProdukDownload returns result object", async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const res = await syncProdukDownload();
    expect(res).toHaveProperty("success");
  });
});