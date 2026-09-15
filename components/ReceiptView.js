import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ReceiptView({ transaksi, items, totalBayar, kembalian }) {
  const formatRupiah = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={s.receipt}>
      <Text style={s.storeName}>TOKO TRITOP JAYA</Text>
      <Text style={s.storeInfo}>Jl. CIAMBAR</Text>
      <Text style={s.storeInfo}>Telp: 0812-3456-7890</Text>
      <Text style={s.divider}>========================================</Text>

      <Text style={s.meta}>{dateStr} {timeStr}</Text>
      <Text style={s.meta}>Kasir: Admin</Text>
      <Text style={s.divider}>========================================</Text>

      {items.map((item, idx) => (
        <View key={idx}>
          <Text style={s.itemName}>{item.nama}</Text>
          <View style={s.itemRow}>
            <Text style={s.itemQty}>{item.qty} x {formatRupiah(item.harga)}</Text>
            <Text style={s.itemSubtotal}>{formatRupiah(item.qty * item.harga)}</Text>
          </View>
        </View>
      ))}

      <Text style={s.divider}>========================================</Text>

      <View style={s.totalRow}>
        <Text style={s.totalLabel}>TOTAL</Text>
        <Text style={s.totalValue}>{formatRupiah(transaksi.total)}</Text>
      </View>

      <View style={s.totalRow}>
        <Text style={s.totalLabel}>BAYAR</Text>
        <Text style={s.totalValue}>{formatRupiah(totalBayar)}</Text>
      </View>

      <View style={s.totalRow}>
        <Text style={s.totalLabel}>KEMBALI</Text>
        <Text style={s.totalValue}>{formatRupiah(kembalian)}</Text>
      </View>

      <Text style={s.divider}>========================================</Text>
      <Text style={s.footer}>Terima Kasih</Text>
      <Text style={s.footer}>Selamat Berbelanja Kembali</Text>
    </View>
  );
}

const s = StyleSheet.create({
  receipt: {
    width: 640,
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    paddingHorizontal: 28,
  },
  storeName: {
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "Courier",
    marginBottom: 8,
  },
  storeInfo: {
    fontSize: 24,
    textAlign: "center",
    fontFamily: "Courier",
    marginBottom: 4,
  },
  divider: {
    fontSize: 22,
    fontFamily: "Courier",
    marginVertical: 8,
    letterSpacing: 2,
  },
  meta: {
    fontSize: 24,
    fontFamily: "Courier",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 26,
    fontWeight: "600",
    fontFamily: "Courier",
    marginTop: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  itemQty: {
    fontSize: 22,
    fontFamily: "Courier",
  },
  itemSubtotal: {
    fontSize: 22,
    fontFamily: "Courier",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Courier",
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Courier",
  },
  footer: {
    fontSize: 22,
    textAlign: "center",
    fontFamily: "Courier",
    marginTop: 8,
  },
});