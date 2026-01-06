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
    minimumFractionDigits: 0,
  }).format(num);
};

const styles = StyleSheet.create({
  page: {
    position: "relative",
    fontSize: 11,
    paddingTop: 100,     // Aumentado para bajar todo el contenido
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
    objectFit: "fill", // Asegura que cubra toda la hoja carta
  },
  spacer: {                                                                                                    
    height: 55, // Espacio extra solo para la primera hoja (100 + 80 = 180)                                       │
  },
  titleContainer: {
    position: 'absolute',
    top: 45, // Ajustar según necesidad para alinear con tu imagen
    left: 160, // 48 (paddingH) + 110 (marginLeft anterior) aprox
    textAlign: "left",
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111",
  },
  subTitle: {
    fontSize: 14, // Más pequeño que el título principal
    fontWeight: 400,
    color: "#444",
    marginTop: 2,
  },

  dateContainer: {
    position: 'absolute',
    top: 125,
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelRight: { fontSize: 10, color: "black", fontWeight: "bold", marginRight: 4 },
  valueRight: { fontSize: 11, color: "black" },

  section: {
    marginTop: 10,
    paddingTop: 8,
  },

  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  gridItem: {
    width: "48%", // Casi la mitad para dejar espacio al gap
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
  cellConcepto: { flex: 1 },
  cellPrecio: { width: 140, textAlign: "right" },

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

  promoWrap: { flexDirection: 'row', gap: 15 },
  promoContent: { flex: 1 },
  promoImgBox: { 
    width: 150, 
    height: 110, 
    backgroundColor: '#F9FAFB', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden'
  },
  promoImg: {
    width: '90%',
    height: '90%',
    objectFit: "contain",
  },
  promoText: { fontSize: 10, marginTop: 4, lineHeight: 1.4, color: '#374151' },

  firmaWrap: { 
    marginTop: 20, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  firmaLine: {
    marginTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#999",
    width: 200,
  },
  firmaLabel: { 
    marginTop: 6, 
    fontSize: 10, 
    color: "#444",
    textAlign: "center"
  },

  validity: { marginTop: 10, fontSize: 9, color: "#444", textAlign: "center" },
});

export default function CotizacionDarmaxAguaPDF({ data }) {
  const extras = data?.extrasSeleccionados || [];
  const extrasCount = extras.length;
  const extrasLabel = extrasCount > 1 ? "Extras" : "Extra";

  const items = [
    { 
        key: "modelo", 
        title: "Modelo", 
        value: data?.costos?.modeloNombre || "", 
        price: data?.costos?.modelo 
    },
    // Añadir extras seleccionados dinámicamente
    ...extras.map((ex, index) => ({
        key: `extra-${ex.id}`,
        title: index === 0 ? extrasLabel : "", // Título solo en el primero
        value: ex.name,
        price: ex.basePrice
    })),
    { 
        key: "fleteTinacos", 
        title: "Flete (Tinacos)", 
        value: "", 
        price: data?.costos?.fleteTinacos 
    },
    {
      key: "viaticos",
      title: "Flete viáticos del instalador (se contemplan dos días)",
      value: "",
      price: data?.costos?.viaticos,
    },
  ];

  const total = items.reduce((acc, it) => acc + Number(it.price || 0), 0);
  // OJO: el regalo/promoción NO se suma al total (según tu requerimiento)
  const promoEnabled = Boolean(data?.promo?.texto || data?.promo?.imagenUrl);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Fondo membretado */}
        <Image 
            style={styles.bg} 
            src={window.location.origin + "/template/coti_mem.png"} 
            fixed 
        />

        {/* Fecha absoluta en la esquina superior derecha */}
        <View style={styles.dateContainer}>
            <Text style={styles.labelRight}>Fecha:</Text>
            <Text style={styles.valueRight}>{data?.fecha || ""}</Text>
        </View>

        <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Cotización</Text>
            <Text style={styles.subTitle}>Darmax Agua</Text>
        </View>

        {/* Espaciador para empujar el contenido solo en la primera página */}
        <View style={styles.spacer} /> 

        {/* Datos del cliente */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.h2}>Datos del cliente</Text>

          <View style={styles.grid2}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{data?.cliente?.nombre || ""}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Teléfono:</Text>
              <Text style={styles.value}>{data?.cliente?.telefono || ""}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Correo:</Text>
              <Text style={styles.value}>{data?.cliente?.correo || ""}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Código Postal:</Text>
              <Text style={styles.value}>{data?.cliente?.cp || ""}</Text>
            </View>
          </View>
        </View>

        {/* Cotización */}
        <View style={[styles.section, styles.card]}>
          <Text style={styles.h2}>Cotización</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.cellConcepto]}>Concepto</Text>
            <Text style={[styles.th, styles.cellPrecio]}>Precio</Text>
          </View>

          {items.map((it) => (
            <View key={it.key} style={{ flexDirection: "row", alignItems: 'center' }}>
              <View style={[styles.td, styles.cellConcepto, { flexDirection: 'row' }]}>
                <Text style={{ fontWeight: 'bold' }}>{it.title}: </Text>
                <Text>{it.value}</Text>
              </View>
              <Text style={[styles.td, styles.cellPrecio]}>{money(it.price)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(total)}</Text>
          </View>

          <Text style={{ marginTop: 6, fontSize: 9, color: "#444" }}>
            (El total no contempla la suma del regalo o promoción)
          </Text>
        </View>

        {/* Regalo / promoción */}
        {promoEnabled && (
          <View style={[styles.section, styles.card]}>
            <Text style={styles.h2}>Regalo o promoción</Text>

            <View style={styles.promoWrap}>
                <View style={styles.promoContent}>
                    {data?.promo?.costo !== undefined && data?.promo?.costo !== null && (
                      <View style={{ flexDirection: "row", gap: 5, marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, color: "#6B7280" }}>Valor referencial:</Text>
                        <Text style={{ fontSize: 10, fontWeight: 700, color: "#111827" }}>{money(data?.promo?.costo)}</Text>
                      </View>
                    )}

                    {!!data?.promo?.texto && (
                      <Text style={styles.promoText}>{data.promo.texto}</Text>
                    )}
                </View>

                {!!data?.promo?.imagenUrl && (
                  <View style={styles.promoImgBox}>
                    <Image 
                        style={styles.promoImg} 
                        src={data.promo.imagenUrl} 
                    />
                  </View>
                )}
            </View>
          </View>
        )}

        {/* Firma Centrada */}
        <View style={styles.firmaWrap}>
          {data?.firma && (
            <Image src={data.firma} style={{ width: 120, height: 50, marginBottom: -25 }} />
          )}
          <View style={styles.firmaLine} />
          <Text style={styles.firmaLabel}>Nombre y firma del asesor</Text>
        </View>

        {/* Validez */}
        <Text style={styles.validity}>Válido por 5 días a partir de la fecha de emisión.</Text>
      </Page>
    </Document>
  );
}
