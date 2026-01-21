// src/catalog/providers/chinaCatalog.js
// Precios base: CFDI (facturación) - IVA incluido
export const CHINA_PROVIDER = { id: "china", label: "Proveedor China (SST / Shanshui)" };

export const CHINA_PRODUCTS = [
  {
    id: "alcalino",
    internoNombre: "Alcalino (saco)",
    unidad: "saco",
    proveedores: {
      china: {
        sku: "SST-ALCALINA",
        nombre: "COSTAL ALCALINA",
        precio: 1293.1,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "carbon_coco_saco",
    internoNombre: "Carbón coco (saco)",
    unidad: "saco",
    proveedores: {
      china: {
        sku: "SST-CARBONCOCO",
        nombre: "CARBON",
        precio: 560.34,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "kit_cloro_ph",
    internoNombre: "Kit cloro y pH",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-KITCYPH",
        nombre: "KIT CLORO Y PH",
        precio: 206.9,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "kit_dureza",
    internoNombre: "Kit dureza",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-KITDEDUREZA",
        nombre: "ANALIZADOR DUREZA",
        precio: 258.62,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "lampara_uv_16w",
    internoNombre: "Lámpara UV 16W",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-UV16W",
        nombre: "UV16W",
        precio: 646.55,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "lampara_uv_25w",
    internoNombre: "Lámpara UV 25W",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-UV25W",
        nombre: "ESTERILIZADORES 25W",
        precio: 862.07,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "lampara_uv_6w",
    internoNombre: "Lámpara UV 6W",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-UV6W",
        nombre: "UV6W",
        precio: 431.03,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "membrana_ss_4040",
    internoNombre: "Membrana ósmosis SS4040",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-SS4040",
        nombre: "SST-SS4040",
        precio: 0.0,
        incluyeIva: true,
        fuente: "Pendiente CFDI (no viene en los CFDI subidos)",
      },
    },
  },
  {
    id: "membrana_xlp_4040",
    internoNombre: "Membrana ósmosis XLP4040",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-XLP4040",
        nombre: "SST-XLP4040",
        precio: 0.0,
        incluyeIva: true,
        fuente: "Pendiente CFDI (no viene en los CFDI subidos)",
      },
    },
  },
  {
    id: "ozono_500mg",
    internoNombre: "Generador ozono 500mg",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-OZONO005",
        nombre: "OZONO",
        precio: 1293.1,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "ph",
    internoNombre: "Medidor pH",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-PH",
        nombre: "SST-PH",
        precio: 0.0,
        incluyeIva: true,
        fuente: "Pendiente CFDI (no viene en los CFDI subidos)",
      },
    },
  },
  {
    id: "resina_saco",
    internoNombre: "Resina (saco)",
    unidad: "saco",
    proveedores: {
      china: {
        sku: "SST-RESCATION",
        nombre: "RESINA INTERCAMBIADORA DE IONES",
        precio: 775.86,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "rocontrol",
    internoNombre: "RO Control",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-ROCONTROL",
        nombre: "SST-ROCONTROL",
        precio: 0.0,
        incluyeIva: true,
        fuente: "Pendiente CFDI (no viene en los CFDI subidos)",
      },
    },
  },
  {
    id: "sst_100c",
    internoNombre: "Control 100C",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-100C",
        nombre: "SST-100C",
        precio: 0.0,
        incluyeIva: true,
        fuente: "Pendiente CFDI (no viene en los CFDI subidos)",
      },
    },
  },
  {
    id: "tanque_frp_948",
    internoNombre: "Tanque FRP 9x48",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-FRP 948",
        nombre: "TANQUE 948",
        precio: 603.45,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "tanque_salmuera_70l",
    internoNombre: "Tanque de salmuera 70 L",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-70L",
        nombre: "TANQUE 70L",
        precio: 775.86,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "tds",
    internoNombre: "Medidor TDS",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-TDS",
        nombre: "TDSP",
        precio: 129.31,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "vacia_t33",
    internoNombre: "Cartucho vacío T33",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-VACIA-T33",
        nombre: "VACIA T33",
        precio: 64.64,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "valvula_filtro_1",
    internoNombre: "Válvula filtro 1\"",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-F56AVF1",
        nombre: "SST-F56AVF1",
        precio: 0.0,
        incluyeIva: true,
        fuente: "Pendiente CFDI (no viene en los CFDI subidos)",
      },
    },
  },
  {
    id: "valvula_filtro_3_4",
    internoNombre: "Válvula filtro 3/4",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-F56EVF34",
        nombre: "vf34",
        precio: 193.97,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "valvula_suavizador_1",
    internoNombre: "Válvula suavizador 1\"",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-F64ACVS1",
        nombre: "VS1",
        precio: 387.94,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "valvula_suavizador_3_4",
    internoNombre: "Válvula suavizador 3/4",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-F64BVS34",
        nombre: "VS34",
        precio: 344.83,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "vd12",
    internoNombre: "VD12 (pieza)",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-VD12",
        nombre: "VD12",
        precio: 64.65,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
  {
    id: "ventury_3_4",
    internoNombre: "Ventury 3/4",
    unidad: "pieza",
    proveedores: {
      china: {
        sku: "SST-VENTURY",
        nombre: "VENTURY",
        precio: 258.62,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500192)",
      },
    },
  },
  {
    id: "zeolita_saco",
    internoNombre: "Zeolita (saco)",
    unidad: "saco",
    proveedores: {
      china: {
        sku: "SST-ZEOLITA",
        nombre: "ZEOLITA",
        precio: 224.14,
        incluyeIva: true,
        fuente: "CFDI SHANSHUI 2025-05-12 (M 202500191)",
      },
    },
  },
];
