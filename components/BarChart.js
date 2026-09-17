/**
 * ============================================
 * BAR CHART & TREND COMPONENT (Pure React Native)
 * ============================================
 * - Lightweight 0-install bar graph
 * - Calculates daily totals & peak hours
 */

import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const formatRupiahShort = (n) => {
  if (!n) return "Rp 0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}jt`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `Rp ${n}`;
};

const formatRupiah = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

export default function BarChart({ transaksiList = [], days = 7 }) {
  const [selectedBar, setSelectedBar] = useState(null);

  // Group transaksi per tanggal (YYYY-MM-DD)
  const chartData = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short" });

      const dayTrx = transaksiList.filter(
        (t) => (t.waktuTransaksi || "").slice(0, 10) === dateStr,
      );

      const omzet = dayTrx.reduce((sum, t) => sum + (t.totalHarga || 0), 0);
      const laba = dayTrx.reduce(
        (sum, t) => sum + ((t.totalHarga || 0) - (t.totalHpp || 0)),
        0,
      );

      result.push({
        dateStr,
        dayLabel,
        omzet,
        laba,
        count: dayTrx.length,
      });
    }
    return result;
  }, [transaksiList, days]);

  const maxOmzet = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.omzet), 0);
    return max === 0 ? 1 : max;
  }, [chartData]);

  // Hitung Jam Rame (Peak Hours)
  const peakHourStr = useMemo(() => {
    if (!transaksiList.length) return "Belum Ada Data";
    const hourCounts = new Array(24).fill(0);
    transaksiList.forEach((t) => {
      if (t.waktuTransaksi) {
        const hour = new Date(t.waktuTransaksi).getHours();
        if (hour >= 0 && hour < 24) hourCounts[hour]++;
      }
    });

    let maxHour = 0;
    let maxCount = 0;
    hourCounts.forEach((cnt, h) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxHour = h;
      }
    });

    if (maxCount === 0) return "Sore Hari";
    const startStr = `${String(maxHour).padStart(2, "0")}:00`;
    const endStr = `${String((maxHour + 2) % 24).padStart(2, "0")}:00`;
    return `${startStr} - ${endStr} (${maxCount} trx)`;
  }, [transaksiList]);

  return (
    <View style={s.card}>
      <View style={s.headRow}>
        <Text style={s.title}>TREND OMZET ({days} HARI)</Text>
        <View style={s.peakBadge}>
          <Text style={s.peakText}>⚡ Jam Rame: {peakHourStr}</Text>
        </View>
      </View>

      {/* Bar container */}
      <View style={s.chartBox}>
        {chartData.map((d, index) => {
          const heightPct = Math.max(12, Math.round((d.omzet / maxOmzet) * 100));
          const isSelected = selectedBar?.dateStr === d.dateStr;

          return (
            <TouchableOpacity
              key={d.dateStr}
              style={s.barCol}
              onPress={() => setSelectedBar(d)}
              activeOpacity={0.8}
            >
              <Text style={s.barTopVal}>
                {d.omzet > 0 ? formatRupiahShort(d.omzet) : ""}
              </Text>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    { height: `${heightPct}%` },
                    isSelected && s.barFillActive,
                    d.omzet === 0 && s.barFillEmpty,
                  ]}
                />
              </View>
              <Text style={[s.barDayLabel, isSelected && s.barDayLabelActive]}>
                {days === 7 ? d.dayLabel : d.dateStr.slice(8, 10)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Tooltip Detail */}
      {selectedBar ? (
        <View style={s.detailBox}>
          <Text style={s.detailTitle}>
            Rincian {selectedBar.dayLabel} ({selectedBar.dateStr}):
          </Text>
          <Text style={s.detailRow}>
            Omzet: <Text style={s.bold}>{formatRupiah(selectedBar.omzet)}</Text> •
            Laba: <Text style={s.greenBold}>+{formatRupiah(selectedBar.laba)}</Text> •
            Trx: <Text style={s.bold}>{selectedBar.count}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7E5E4",
    marginBottom: 16,
  },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 11, fontWeight: "700", color: "#A8A29E" },
  peakBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  peakText: { fontSize: 10, fontWeight: "700", color: "#D97706" },
  chartBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 6,
    paddingTop: 16,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barTopVal: { fontSize: 9, fontWeight: "600", color: "#57534E", marginBottom: 2 },
  barTrack: {
    width: "100%",
    height: "75%",
    backgroundColor: "#FAF7F4",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: "#059669",
    borderRadius: 6,
  },
  barFillActive: {
    backgroundColor: "#10B981",
  },
  barFillEmpty: {
    backgroundColor: "#E7E5E4",
  },
  barDayLabel: {
    fontSize: 10,
    color: "#A8A29E",
    marginTop: 6,
  },
  barDayLabelActive: {
    color: "#059669",
    fontWeight: "700",
  },
  detailBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F4",
  },
  detailTitle: { fontSize: 11, color: "#A8A29E", marginBottom: 2 },
  detailRow: { fontSize: 12, color: "#1C1917" },
  bold: { fontWeight: "700" },
  greenBold: { fontWeight: "700", color: "#059669" },
});