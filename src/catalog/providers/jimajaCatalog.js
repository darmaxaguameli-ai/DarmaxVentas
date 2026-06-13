// src/catalog/providers/jimajaCatalog.js

export const PROVIDERS = [
  { id: "jimaja", label: "Comercializadora JIMAJA" },
];

export const PRODUCTS = [
  {
    id: "membrana_xlp_4040",
    internoNombre: "Membrana ósmosis 4x40 XLP Keensen",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "12-MEM4X40XLE",
        nombre: "MEMBRANA 4X40 XLP KEENSEN",
        precio: 1517.241379,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 27/01/2026",
      },
    },
  },
  {
    id: "tanque_9x48_hdt",
    internoNombre: "Tanque 9x48 entrada 2.5 (HDT)",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "TANQUE ZAO",
        nombre: "TANQUE 9X48 ENTRADA 2.5 AZUL ZAO",
        precio: 575.862068,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "tanque_8x44_hdt",
    internoNombre: "Tanque 8x44 entrada 2.5 (HDT)",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "01-8X44HDT",
        nombre: "TANQUE 8X44 ENTRADA 2.5 HDT",
        precio: 685.34,
      },
    },
  },
  {
    id: "tanque_salmuera_70l",
    internoNombre: "Tanque de salmuera 70 L",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "06SALM70L",
        nombre: "TANQUE DE SALMUERA 70 LTS",
        precio: 758.620689,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "carbon_coco_12_5kg",
    internoNombre: "Carbón concha de coco 12.5 kg (AW)",
    unidad: "saco",
    proveedores: {
      jimaja: {
        clave: "26-COCO-AW",
        nombre: "CARBON CONCHA DE COCO 12.5 KGS. AW",
        precio: 603.448275,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "zeolita_21kg",
    internoNombre: "Zeolita malla 6-12 21 kg",
    unidad: "saco",
    proveedores: {
      jimaja: {
        clave: "26-ZEOLITA",
        nombre: "ZEOLITA MALLA6-12 SACO 1 PIE (21 KGS) AW",
        precio: 172.413793,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "resina_001x7_na",
    internoNombre: "Resina catiónica 001x7 Na FG (AW)",
    unidad: "saco",
    proveedores: {
      jimaja: {
        clave: "RESINA AW",
        nombre: "RESINA AMERICA WATER 001X7 Na FG",
        precio: 775.862068,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "multivalvula_1_filtro",
    internoNombre: 'Multiválvula 1" para filtro',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "F64A1",
        nombre: 'MULTIVÁLVULA 1" PARA FILTRO',
        precio: 215.517241,
        incluyeIva: false,
      },
    },
  },
  {
    id: "multivalvula_1_suavizador",
    internoNombre: 'Multiválvula 1" para suavizador',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "11-F56A1",
        nombre: 'MULTIVÁLVULA 1" PARA SUAVIZADOR',
        precio: 387.931034,
        incluyeIva: false,
      },
    },
  },
  {
    id: "lampara_uv_25w",
    internoNombre: "Lámpara UV 25W Hidrotek",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "11-25-HIDROTEK",
        nombre: "LAMPARA 25 WTTS HIDROTEK",
        precio: 818.965517,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "foco_uv_6w_philips",
    internoNombre: "Foco UV 6W Philips 2 pines",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "18-TUV-6WPHILIPS",
        nombre: "FOCO DE 6 WATTS PHILIPS 2 PINES",
        precio: 143.44,
      },
    },
  },
  {
    id: "ventury_3_4_hdt",
    internoNombre: "Ventury 3/4 HDT",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "30-V3/4",
        nombre: "VENTURY 3/4 POLYPROPILENO HDT",
        precio: 280.1724,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },

  // ===== JIMAJA 2026-01-23 =====
  {
    id: "rotametro_0_5_hydrotek",
    internoNombre: "Rotámetro 0–5 Hydrotek",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "12-ROTAMETRO",
        nombre: "ROTAMETRO 0 A 5 HYDROTEK",
        precio: 206.896551,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 27/01/2026",
      },
    },
  },
  {
    id: "ozono_domestico_gl_2186",
    internoNombre: "Ozono doméstico GL-2186",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "30-OZONO",
        nombre: "OZONO DOMESTICO GL-2186",
        precio: 724.137931,
        incluyeIva: false,
      },
    },
  },
  {
    id: "ozono_acero_gl_3211",
    internoNombre: "Generador de ozono acero GL-3211",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "MOD.GL-3211",
        nombre: "GENERADOR DE OZONO ACERO MOD GL-3211",
        precio: 1163.793103,
        incluyeIva: false,
      },
    },
  },
  {
    id: "porta_membrana_4040_inox",
    internoNombre: "Porta membrana 4x40 acero inoxidable",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "12-PORT4X40HD",
        nombre: "PORTAMEMBRANA 4X40 ACERO INOX",
        precio: 1077.586206,
        incluyeIva: false,
      },
    },
  },
  {
    id: "manometro_0_100_hdt",
    internoNombre: "Manómetro 0–100 PSI HDT",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "MAN 0-100 HDT",
        nombre: "MANÓMETRO 0-100 PARA OSMOSIS HDT",
        precio: 120.689655,
        incluyeIva: false,
      },
    },
  },
  {
    id: "manometro_0_300_hdt",
    internoNombre: "Manómetro 0–300 PSI HDT",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "MAN 0-300 HDT",
        nombre: "MANÓMETRO 0-300 PARA OSMOSIS HDT",
        precio: 120.689655,
        incluyeIva: false,
      },
    },
  },
  {
    id: "conector_macho_1_2x1_2",
    internoNombre: 'Conector macho 1/2" x 1/2"',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "PENDIENTE",
        nombre: "CONECTOR MACHO 1/2X1/2",
        precio: 25.0,
        incluyeIva: true,
        fuente: "CFDI JIMAJA 2026-01-23 (F 61167)",
      },
    },
  },
  {
    id: "conector_macho_1_4x1_4_hdt",
    internoNombre: 'Conector macho 1/4" x 1/4" HDT',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "PENDIENTE",
        nombre: "CONECTOR MACHO 1/4 X 1/4 HDT",
        precio: 6.0,
        incluyeIva: true,
        fuente: "CFDI JIMAJA 2026-01-23 (F 61167)",
      },
    },
  },
  {
    id: "adaptador_hembra_1_4x1_4",
    internoNombre: 'Adaptador hembra 1/4" x 1/4"',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "PENDIENTE",
        nombre: "ADAPTADOR HEMBRA 1/4X1/4",
        precio: 6.7,
        incluyeIva: true,
        fuente: "CFDI JIMAJA 2026-01-23 (F 61167)",
      },
    },
  },
  {
    id: "adaptador_hembra_3_8x1_2_hdt",
    internoNombre: 'Adaptador hembra 3/8" x 1/2" HDT',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "PENDIENTE",
        nombre: "ADAPTADOR HEMBRA 3/8 X 1/2 HDT",
        precio: 21.0,
        incluyeIva: true,
        fuente: "CFDI JIMAJA 2026-01-23 (F 61167)",
      },
    },
  },
  {
    id: "macho_1_2x1_4_dcc_012e",
    internoNombre: 'Macho 1/2" x 1/4" DCC-012E',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "PENDIENTE",
        nombre: "MACHO 1/2X1/4 DCC-012E",
        precio: 22.55,
        incluyeIva: true,
        fuente: "CFDI JIMAJA 2026-01-23 (F 61167)",
      },
    },
  },

  // ===== NUEVOS / ACTUALIZADOS JIMAJA 04/06/2026 =====
  {
    id: "tee_sch40_1",
    internoNombre: 'Tee SCH40 1"',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "D4-711-25",
        nombre: 'TEE SCH40 1"',
        precio: 8.0,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "valvula_esfera_sch40_3_4",
    internoNombre: 'Válvula esfera SCH40 3/4 cementar',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "XS4B-20-19",
        nombre: "VALVULA ESFERA SCH40 3/4 CEMENTAR",
        precio: 14.0,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "t_union_sch40_3_4",
    internoNombre: 'T unión SCH40 3/4 cementar',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "T4-11-19",
        nombre: "T.UNION SCH40 3/4 CEMENTAR",
        precio: 9.9,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "codo_90_sch40_3_4",
    internoNombre: 'Codo 90° SCH40 3/4',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "A-",
        nombre: "CODO 90X3/4 CED 40 (A)",
        precio: 3.31,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "tee_sch40_3_4",
    internoNombre: 'Tee SCH40 3/4"',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "D4-711-19",
        nombre: 'TEE SCH40 3/4"',
        precio: 4.5,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "macho_sch40_3_4",
    internoNombre: "Macho 3/4 CED40",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "A-",
        nombre: "MACHO 3/4 CED40 (A)",
        precio: 2.1,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "cople_sch40_3_4",
    internoNombre: "Cople SCH40 3/4",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "XSP4-10-19",
        nombre: "COPLE SCH40 3/4",
        precio: 2.25,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "hembra_sch40_3_4",
    internoNombre: "Hembra SCH40 3/4",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "XSI4-20-19",
        nombre: "HEMBRA SCH40 3/4 (A)",
        precio: 3.1,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "tubo_1_ced40",
    internoNombre: 'Tubo PVC 1" Cédula 40',
    unidad: "tramo",
    proveedores: {
      jimaja: {
        clave: '15-TUB1"C 40',
        nombre: 'TUBO 1" CED 40',
        precio: 26.724137,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "tubo_3_4_ced40",
    internoNombre: 'Tubo PVC 3/4" Cédula 40',
    unidad: "tramo",
    proveedores: {
      jimaja: {
        clave: "TUBO 3/4 CED.40",
        nombre: 'TUBO 3/4" CED. 40',
        precio: 22.413793,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "tubo_rd26_3_4_cresco",
    internoNombre: 'Tubo RD26 3/4" Cresco',
    unidad: "tramo",
    proveedores: {
      jimaja: {
        clave: '15-TUBO3/4"RD21',
        nombre: 'TUBO RD26 3/4" CRESCO',
        precio: 12.156,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "tubo_2_ced40",
    internoNombre: 'Tubo PVC 2" Cédula 40',
    unidad: "tramo",
    proveedores: {
      jimaja: {
        clave: '15-TUB2"CED.40',
        nombre: 'TUBO 2"',
        precio: 60.344827,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
  {
    id: "manguera_blanca_1_4_osmosis",
    internoNombre: 'Manguera blanca 1/4 para ósmosis',
    unidad: "metro",
    proveedores: {
      jimaja: {
        clave: "MANGUERA",
        nombre: "MANGUERA BLANCA 1/4 P/OSMOSIS",
        precio: 8.620689,
        incluyeIva: false,
        fuente: "Cotización JIMAJA 04/06/2026",
      },
    },
  },
];