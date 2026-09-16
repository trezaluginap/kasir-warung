// Mock de database layer — cartStore importeert simpanTransaksi van ../database/service
// React Native componenten (AsyncStorage, SQLite) draaien NIET in Jest (geen device).
// Daarom: vervang de echte module door een nep (mock) die wij controleren.
jest.mock("../database/service", () => ({
  simpanTransaksi: jest.fn(),
}));

// Mock productService — cartStore pakai updateStok & ambilProdukById
// saat checkout (validasi + decrement stok).
jest.mock("../database/productService", () => ({
  updateStok: jest.fn(),
  ambilProdukById: jest.fn(),
}));

// Mock recentStore — zelfde reden: AsyncStorage is een native RN module
jest.mock("../store/recentStore", () => ({
  useRecentStore: {
    getState: () => ({
      addRecent: jest.fn(),
    }),
  },
}));

import useCartStore from "../store/cartStore";
import { simpanTransaksi } from "../database/service";
import { updateStok, ambilProdukById } from "../database/productService";

// Reset state vóór elke test — anders lopen items van de vorige test door
beforeEach(() => {
  useCartStore.setState({ items: [], totalHarga: 0 });
  simpanTransaksi.mockReset();
  updateStok.mockReset();
  ambilProdukById.mockReset();
});

describe("cartStore — tambahProduk", () => {
  test("tambah produk nieuw", () => {
    useCartStore.getState().tambahProduk({
      id: 1,
      nama: "Indomie Goreng",
      harga: 3000,
    });

    const { items, totalHarga } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(1);
    expect(items[0].uniqueId).toBe("produk_1");
    expect(totalHarga).toBe(3000);
  });

  test("tambah produk zelfde id → qty +1, geen duplicaat", () => {
    const st = useCartStore.getState();
    st.tambahProduk({ id: 1, nama: "Teh Botol", harga: 4000 });
    st.tambahProduk({ id: 1, nama: "Teh Botol", harga: 4000 });

    const { items, totalHarga } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(2);
    expect(totalHarga).toBe(8000);
  });

  test("tambah jajanan zonder id", () => {
    useCartStore.getState().tambahJajanan(1000);
    useCartStore.getState().tambahJajanan(1000);
    useCartStore.getState().tambahJajanan(2000);

    const { items, totalHarga } = useCartStore.getState();
    expect(items).toHaveLength(2); // 1000 + 2000
    expect(items.find((i) => i.harga === 1000).qty).toBe(2);
    expect(totalHarga).toBe(4000);
  });
});

describe("cartStore — kurangiItem", () => {
  test("kurangi qty tot 0 → item verdwijnt", () => {
    const st = useCartStore.getState();
    st.tambahProduk({ id: 2, nama: "Telur", harga: 2500 });
    st.kurangiItem("produk_2");

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
    expect(useCartStore.getState().totalHarga).toBe(0);
  });
});

describe("cartStore — checkout", () => {
  test("checkout met lege keranjang faalt", async () => {
    const result = await useCartStore.getState().checkout();
    expect(result.success).toBe(false);
    expect(simpanTransaksi).not.toHaveBeenCalled();
  });

  test("checkout simpan transaksi + clear keranjang + kurangi stok", async () => {
    simpanTransaksi.mockResolvedValue({
      id: 99,
      totalHarga: 10000,
      daftarBarang: [],
      waktuTransaksi: "2026-09-15T00:00:00.000Z",
    });
    // Stok produk id=3 cukup (10)
    ambilProdukById.mockResolvedValue({ id: 3, nama: "Chitato", stok: 10 });

    const st = useCartStore.getState();
    st.tambahProduk({ id: 3, nama: "Chitato", harga: 8000 });
    st.tambahJajanan(2000);

    const result = await st.checkout(20000, 10000);

    expect(result.success).toBe(true);
    expect(simpanTransaksi).toHaveBeenCalledTimes(1);
    expect(simpanTransaksi).toHaveBeenCalledWith(
      10000,
      expect.arrayContaining([
        expect.objectContaining({ nama: "Chitato", qty: 1, harga: 8000 }),
        expect.objectContaining({ nama: "Jajanan Rp 2.000", qty: 1, harga: 2000 }),
      ]),
      20000,
      10000,
    );

    // Stok produk dikurangi (Chitato qty 1 -> -1)
    expect(updateStok).toHaveBeenCalledWith(3, -1);

    // Keranjang leeg na succesvolle checkout
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().totalHarga).toBe(0);
  });

  test("checkout batal kalau stok tidak cukup", async () => {
    ambilProdukById.mockResolvedValue({ id: 5, nama: "Indomie", stok: 1 });

    const st = useCartStore.getState();
    st.tambahProduk({ id: 5, nama: "Indomie", harga: 3000 });
    // Tambah qty sampai 3 (lebih dari stok 1)
    st.tambahProduk({ id: 5, nama: "Indomie", harga: 3000 });
    st.tambahProduk({ id: 5, nama: "Indomie", harga: 3000 });

    const result = await st.checkout(10000, 1000);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/tidak cukup/i);
    expect(simpanTransaksi).not.toHaveBeenCalled();
    expect(updateStok).not.toHaveBeenCalled();
    // Keranjang tetap
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  test("checkout faalt als database faalt → keranjang blijft", async () => {
    simpanTransaksi.mockRejectedValue(new Error("disk vol"));
    ambilProdukById.mockResolvedValue({ id: 4, nama: "Gula 1kg", stok: 5 });

    const st = useCartStore.getState();
    st.tambahProduk({ id: 4, nama: "Gula 1kg", harga: 15000 });

    const result = await st.checkout();
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/disk vol/);
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});