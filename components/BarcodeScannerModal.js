import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Vibration,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { cariProdukByBarcode } from "../database/productService";
import useCartStore from "../store/cartStore";
import { MaterialIcon } from "./MaterialIcon";
import { showWarning, showError } from "../utils/alertHelper";

const BARCODE_TYPES = [
  "ean13",
  "ean8",
  "upc_a",
  "code128",
  "qr",
]; // 5 tipe umum — covers ~95% barcode warung; ringan frame analyzer

const SCAN_REARM_DELAY = 400;

export default function BarcodeScannerModal({ visible, onClose, onProductFound, onScanCode }) {
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const cartItems = useCartStore((s) => s.items);

  const [scanned, setScanned] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0.2); // Default 2.0x
  const [layoutSize, setLayoutSize] = useState({ w: width, h: height });
  const [successProduct, setSuccessProduct] = useState(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const successTimerRef = useRef(null);
  const rearmTimerRef = useRef(null);

  const activeW = layoutSize.w || width;
  const activeH = layoutSize.h || height;
  const boxSize = Math.min(activeW * 0.72, 280);
  const boxTop = (activeH - boxSize) / 2;
  const boxLeft = (activeW - boxSize) / 2;

  const totalCartJenis = cartItems.length;
  const totalCartPcs = cartItems.reduce((s, i) => s + (i.qty || 0), 0);

  useEffect(() => {
    if (visible) {
      // Reset scanner state each open; state changes are intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScanned(false);
      setLastScanned("");
      setTorch(false);
      setZoom(0.2);
      setSuccessVisible(false);
      setSuccessProduct(null);
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
      if (rearmTimerRef.current) {
        clearTimeout(rearmTimerRef.current);
        rearmTimerRef.current = null;
      }
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      if (rearmTimerRef.current) {
        clearTimeout(rearmTimerRef.current);
      }
    };
  }, []);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.permissionContainer}>
          <MaterialIcon name="camera-off" size={64} color="#A8A29E" />
          <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
          <Text style={styles.permissionText}>
            Aplikasi membutuhkan akses kamera untuk scan barcode produk.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Izinkan Akses Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const scanCodeMode = typeof onScanCode === "function";

  const handleBarcodeScan = async (result) => {
    if (scanned || result.data === lastScanned) return;

    setScanned(true);
    setLastScanned(result.data);

    if (scanCodeMode) {
      onScanCode(result.data);
      onClose();
      return;
    }

    try {
      const product = await cariProdukByBarcode(result.data);

      if (product) {
        setSuccessProduct(product);
        setSuccessVisible(true);
        Vibration.vibrate(60);
        onProductFound(product);

        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
        }
        successTimerRef.current = setTimeout(() => {
          setSuccessVisible(false);
          successTimerRef.current = null;
        }, 1400);

        // Re-arm scanner after delay for continuous scanning
        if (rearmTimerRef.current) {
          clearTimeout(rearmTimerRef.current);
        }
        rearmTimerRef.current = setTimeout(() => {
          setScanned(false);
          setLastScanned("");
          rearmTimerRef.current = null;
        }, SCAN_REARM_DELAY);
      } else {
        showWarning("Produk Tidak Ditemukan", `Barcode: ${result.data}\n\nProduk belum terdaftar di database.`, {
          confirmText: "Scan Lagi",
          onConfirm: () => {
            setScanned(false);
            setLastScanned("");
          },
          cancelText: "Tutup",
          onCancel: onClose,
        });
      }
    } catch (error) {
      console.error("Error scan barcode:", error);
      showError("Error", "Gagal mencari produk. Coba lagi.", {
        confirmText: "OK",
        onConfirm: () => {
          setScanned(false);
          setLastScanned("");
        },
      });
    }
  };

  return (
    <>
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={styles.container}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w && h) setLayoutSize({ w, h });
        }}
      >
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torch}
          zoom={zoom}
          active={visible}
          barcodeScannerSettings={{
            barcodeTypes: BARCODE_TYPES,
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
        />
        
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Centered Scan Area (Explicit Pixel Math Center) */}
          <View
            style={[
              styles.scanBox,
              {
                position: "absolute",
                top: boxTop,
                left: boxLeft,
                width: boxSize,
                height: boxSize,
              },
            ]}
          >
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Header (Absolute Top - Simple & Clean) */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan Barcode Produk</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <MaterialIcon name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Controls & Footer (Absolute Bottom) */}
          <View style={styles.footer}>
            {/* Control Row: Flash + Zoom */}
            <View style={styles.controlRow}>
              {/* Flash Button (Large & Unmissable) */}
              <TouchableOpacity
                style={[styles.flashBtn, torch && styles.flashBtnOn]}
                onPress={() => setTorch((t) => !t)}
                activeOpacity={0.8}
              >
                <MaterialIcon
                  name={torch ? "flashlight" : "flashlight_off"}
                  size={20}
                  color={torch ? "#059669" : "#FFFFFF"}
                />
                <Text style={[styles.flashText, torch && styles.flashTextOn]}>
                  {torch ? "Flash ON" : "Flash"}
                </Text>
              </TouchableOpacity>

              {/* Zoom Controls */}
              <View style={styles.zoomRow}>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoom((z) => Math.max(0, parseFloat((z - 0.2).toFixed(1))))}
                >
                  <MaterialIcon name="magnify_minus" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.zoomText}>Zoom {(zoom * 5 + 1).toFixed(1)}x</Text>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoom((z) => Math.min(1, parseFloat((z + 0.2).toFixed(1))))}
                >
                  <MaterialIcon name="magnify_plus" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footerText}>
              Arahkan kamera ke barcode produk
            </Text>
          </View>

        </View>
      </View>
    </Modal>

    {/* Success Notification (Separate Top-Level Modal - Never Blocked) */}
    <Modal
      transparent
      visible={successVisible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setSuccessVisible(false)}
    >
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>
          <View style={styles.successCircle}>
            <MaterialIcon name="check" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle} numberOfLines={1}>
            {successProduct?.nama} berhasil ditambahkan
          </Text>
          <Text style={styles.successSub}>
            Keranjang: {totalCartJenis} jenis ({totalCartPcs} pcs)
          </Text>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: "center",
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1917",
    textAlign: "center",
  },
  successSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "#57534E",
    marginTop: 4,
  },
  scanArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  scanBox: {
    position: "relative",
    backgroundColor: "transparent",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 44,
    height: 44,
    borderColor: "#10B981",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    gap: 12,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flashBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flashBtnOn: {
    backgroundColor: "#F59E0B",
  },
  flashText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  flashTextOn: {
    color: "#059669",
  },
  zoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footerText: {
    fontSize: 13,
    color: "#D6D3D1",
    textAlign: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#FAF7F4",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1917",
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: "#57534E",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
  },
  grantButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  grantButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  closeButtonText: {
    color: "#57534E",
    fontSize: 15,
    fontWeight: "500",
  },
});
