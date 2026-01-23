import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const money = (n) => {
  const num = Number(n || 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2, // Mantener decimales para precios de proveedor
  }).format(num);
};

const styles = StyleSheet.create({
  page: {
    position: "relative",
    fontSize: 11,
    paddingTop: 105,     // Ajustado para bajar todo el contenido, similar a DarmaxQuote
    paddingBottom: 80,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    objectFit: "fill",
  },
  spacer: {                                                                                                    
    height: 30,
  },
  titleContainer: {
    position: 'absolute',
    top: 45,
    left: 160,
    textAlign: "left",
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111",
  },
  subTitle: {
    fontSize: 14,
    fontWeight: 400,
    color: "#444",
    marginTop: 2,
  },

  folioContainer: {
    position: 'absolute',
    top: 35, // Ajustado para que quede sobre el folio del fondo
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelWhite: { fontSize: 10, color: "white", fontWeight: "bold", marginRight: 4 },
  valueWhite: { fontSize: 11, color: "white" },

  dateContainer: {
    position: 'absolute',
    top: 120, // Ajustado para que quede donde la fecha en el fondo
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelRight: { fontSize: 10, color: "black", fontWeight: "bold", marginRight: 4 },
  valueRight: { fontSize: 11, color: "black" },

  label: { fontSize: 10, color: "#111", fontWeight: "bold" },
  value: { fontSize: 11, flex: 1 },

  section: {
    marginTop: 10,
    paddingTop: 8,
  },

  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10, // react-pdf usa un gap diferente
  },
  gridItem: {
    width: "48%",
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  gridItemFull: {
    width: "100%",
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  card: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },

  h2: { fontSize: 12, fontWeight: 700, marginBottom: 8 },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
    paddingBottom: 6,
    marginBottom: 6,
  },
  th: { fontSize: 10, fontWeight: 700 },
  td: { fontSize: 10, paddingVertical: 6 },
  cellCantidad: { width: 50, textAlign: "center" },
  cellClave: { width: 100 },
  cellDescripcion: { flex: 1 },
  cellPrecio: { width: 70, textAlign: "right" },
  cellImporte: { width: 70, textAlign: "right" },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E6E6E6",
  },
  totalLabel: { fontSize: 12, fontWeight: 700 },
  totalValue: { fontSize: 12, fontWeight: 700 },

  notes: {
    marginTop: 15,
    fontSize: 9,
    color: "#444",
  }
});

export default function CotizadorDistribuidoresPDF({ data }) {
  const { folio, fecha, billingInfo, items, mode, providerLabel, notes } = data;
  const total = items.reduce((acc, it) => acc + (it.precio || 0) * it.qty, 0);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Fondo membretado */}
        <Image 
            style={styles.bg} 
            src={window.location.origin + "/template/coti_darm.jpg"} 
            fixed 
        />

        {/* Folio absoluto en la esquina superior derecha (Blanco) */}
        <View style={styles.folioContainer}>
            <Text style={styles.labelWhite}>Folio:</Text>
            <Text style={styles.valueWhite}>{folio ? String(folio).padStart(4, '0') : "N/A"}</Text>
        </View>

        {/* Fecha absoluta en la esquina superior derecha (Negro) */}
        <View style={styles.dateContainer}>
            <Text style={styles.labelRight}>Fecha:</Text>
            <Text style={styles.valueRight}>{fecha || ""}</Text>
        </View>

        <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Solicitud de Productos</Text>
            <Text style={styles.subTitle}>para Distribuidores</Text>
        </View>

        {/* Espaciador para empujar el contenido solo en la primera página */}
        <View style={styles.spacer} /> 

        {/* Datos de facturación */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.h2}>Datos para Facturación</Text>
          <View style={styles.grid2}>
            <View style={styles.gridItemFull}>
              <Text style={styles.label}>Empresa: </Text>
              <Text style={styles.value}>{billingInfo.nombre || ""}</Text>
            </View>
            <View style={styles.gridItemFull}>
              <Text style={styles.label}>RFC: </Text>
              <Text style={styles.value}>{billingInfo.rfc || ""}</Text>
            </View>
            <View style={styles.gridItemFull}>
              <Text style={styles.label}>C.P.: </Text>
              <Text style={styles.value}>{billingInfo.cp || ""}</Text>
            </View>
            <View style={styles.gridItemFull}>
              <Text style={styles.label}>Régimen Fiscal: </Text>
              <Text style={styles.value}>{billingInfo.regimenFiscal || ""}</Text>
            </View>
          </View>
        </View>

        {/* Productos */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.h2}>Productos (proveedor {providerLabel})</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.cellCantidad]}>Cant</Text>
            <Text style={[styles.th, styles.cellClave]}>Clave/SKU</Text>
            <Text style={[styles.th, styles.cellDescripcion]}>Descripción</Text>
            {mode === "cotizacion" && <Text style={[styles.th, styles.cellPrecio]}>P/U</Text>}
            {mode === "cotizacion" && <Text style={[styles.th, styles.cellImporte]}>Importe</Text>}
          </View>

          {items.map((it) => {
            const importe = (it.precio || 0) * it.qty;
            return (
              <View key={it.productId} style={{ flexDirection: "row", alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6", paddingVertical: 4 }}>
                <Text style={[styles.td, styles.cellCantidad]}>{it.qty}</Text>
                <Text style={[styles.td, styles.cellClave]}>{it.clave}</Text>
                <View style={[styles.td, styles.cellDescripcion]}>
                  <Text>{it.proveedorNombre}</Text>
                  <Text style={{ fontSize: 8, color: '#6B7280' }}>Ref interna: {it.internoNombre}</Text>
                </View>
                {mode === "cotizacion" && <Text style={[styles.td, styles.cellPrecio]}>{money(it.precio)}</Text>}
                {mode === "cotizacion" && <Text style={[styles.td, styles.cellImporte]}>{money(importe)}</Text>}
              </View>
            );
          })}

          {mode === "cotizacion" && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          )}

        </View>

        {/* Notas */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.h2}>Notas</Text>
          <Text style={styles.notes}>{notes}</Text>
        </View>

      </Page>
    </Document>
  );
}
