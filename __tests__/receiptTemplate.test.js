import buildReceiptHtml from "../utils/receiptTemplate";

describe("receiptTemplate", () => {
  const mockTransaksi = {
    id: 7,
    totalHarga: 17500,
    waktuTransaksi: "2026-09-15T10:00:00.000Z",
    daftarBarang: [
      { nama: "Indomie Goreng", qty: 2, harga: 3000 },
      { nama: "Teh Botol Sosro", qty: 1, harga: 4000 },
    ],
  };

  test("render struk dengan data transaksi", () => {
    const html = buildReceiptHtml(mockTransaksi, {
      storeName: "WARUNG TEST",
      storeAddress: "Jl. Test 1",
      storePhone: "Telp. 0800-000-0000",
    });

    expect(html).toContain("#7");
    expect(html).toContain("WARUNG TEST");
    expect(html).toContain("Indomie Goreng");
    expect(html).toContain("Rp 3.000 x 2");
    expect(html).toContain("Rp 17.500");
    expect(html).toContain("TERIMA KASIH");
  });

  test("total item = suma qty", () => {
    const html = buildReceiptHtml(mockTransaksi);
    expect(html).toContain("3 pcs");
  });

  test("subtotal item = harga x qty", () => {
    const html = buildReceiptHtml({
      ...mockTransaksi,
      daftarBarang: [{ nama: "Susu Ultra 250ml", qty: 3, harga: 5000 }],
    });
    expect(html).toContain("Rp 5.000 x 3");
    expect(html).toContain("Rp 15.000");
  });

  test("storeInfo default as fallback", () => {
    const html = buildReceiptHtml(mockTransaksi);
    expect(html).toContain("WARUNG POS");
  });
});