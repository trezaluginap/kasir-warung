/**
 * ============================================
 * RECEIPT TEMPLATE - THERMAL PRINTER 58MM
 * ============================================
 *
 * Template untuk struk thermal printer ukuran 58mm
 * Optimal untuk printer POS/Kasir
 */

/**
 * Build HTML untuk struk thermal printer 58mm
 * @param {Object} transaksi - Data transaksi
 * @param {Object} storeInfo - Info toko (storeName, storeAddress, storePhone)
 * @returns {string} HTML string
 */
export const buildReceiptHtml = (transaksi, storeInfo = {}) => {
  const {
    storeName = "WARUNG POS",
    storeAddress = "Jl. Warung No. 1",
    storePhone = "Telp. 08xx-xxxx-xxxx",
  } = storeInfo;

  // Format tanggal dan waktu
  const tanggal = new Date(transaksi.waktuTransaksi);
  const formatTanggal = tanggal.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formatJam = tanggal.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format rupiah
  const formatRupiah = (angka) => {
    return `Rp ${angka.toLocaleString("id-ID")}`;
  };

  // Generate items HTML
  const itemsHtml = transaksi.daftarBarang
    .map((item, index) => {
      const subtotal = item.harga * item.qty;
      return `
        <tr>
          <td colspan="3" style="padding: 4px 0; border-bottom: 1px dashed #ddd;">
            <div style="font-weight: bold; margin-bottom: 2px;">${item.nama}</div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>${formatRupiah(item.harga)} x ${item.qty}</span>
              <span style="font-weight: bold;">${formatRupiah(subtotal)}</span>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  // Calculate total items
  const totalItems = transaksi.daftarBarang.reduce(
    (sum, item) => sum + item.qty,
    0,
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Struk #${transaksi.id}</title>
      <style>
        @page {
          size: 58mm auto;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: #fff;
          width: 58mm;
          padding: 8px;
        }
        
        .receipt {
          width: 100%;
        }
        
        .header {
          text-align: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #000;
        }
        
        .store-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        
        .store-info {
          font-size: 10px;
          line-height: 1.3;
          margin-bottom: 2px;
        }
        
        .divider {
          border-bottom: 1px dashed #000;
          margin: 8px 0;
        }
        
        .divider-solid {
          border-bottom: 2px solid #000;
          margin: 8px 0;
        }
        
        .transaction-info {
          margin-bottom: 8px;
          font-size: 11px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .info-label {
          font-weight: normal;
        }
        
        .info-value {
          font-weight: bold;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }
        
        .items-header {
          font-weight: bold;
          text-align: left;
          padding: 6px 0;
          border-top: 2px solid #000;
          border-bottom: 1px solid #000;
        }
        
        .item-row {
          padding: 4px 0;
        }
        
        .total-section {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 2px solid #000;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 11px;
        }
        
        .grand-total {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: bold;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed #000;
        }
        
        .footer {
          text-align: center;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 2px solid #000;
          font-size: 10px;
        }
        
        .thank-you {
          font-weight: bold;
          margin-bottom: 4px;
          font-size: 12px;
        }
        
        .footer-note {
          margin-top: 4px;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="header">
          <div class="store-name">${storeName}</div>
          <div class="store-info">${storeAddress}</div>
          <div class="store-info">${storePhone}</div>
        </div>
        
        <!-- Transaction Info -->
        <div class="transaction-info">
          <div class="info-row">
            <span class="info-label">No. Transaksi</span>
            <span class="info-value">#${transaksi.id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tanggal</span>
            <span class="info-value">${formatTanggal}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Waktu</span>
            <span class="info-value">${formatJam}</span>
          </div>
        </div>
        
        <div class="divider-solid"></div>
        
        <!-- Items -->
        <table>
          <thead>
            <tr>
              <th colspan="3" class="items-header">DAFTAR BELANJA</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <!-- Total Section -->
        <div class="total-section">
          <div class="total-row">
            <span>Total Item:</span>
            <span style="font-weight: bold;">${totalItems} pcs</span>
          </div>
          <div class="grand-total">
            <span>TOTAL BAYAR</span>
            <span>${formatRupiah(transaksi.totalHarga)}</span>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">TERIMA KASIH</div>
          <div class="footer-note">Barang yang sudah dibeli<br/>tidak dapat dikembalikan</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Export default juga untuk kemudahan import
export default buildReceiptHtml;
