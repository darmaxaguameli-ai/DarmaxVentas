// src/catalog/providers/jimajaCatalog.js

export const PROVIDERS = [
  { id: "jimaja", label: "Comercializadora JIMAJA" },
];

// Catálogo normalizado (interno) con mapeo a JIMAJA
export const PRODUCTS = [
  {
    id: "membrana_xlp_4040",
    internoNombre: 'Membrana ósmosis 4040 baja presión (XLP4040)',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "23-XLP-4040",
        nombre: "MEMBRANA XLP4040 ULTRA BAJA PRESIÓN",
        precio: 1517.24,
      },
    },
  },
  {
    id: "tanque_9x48_hdt",
    internoNombre: "Tanque 9x48 entrada 2.5 (HDT)",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "01-09X48HDT",
        nombre: "TANQUE 9X48 ENTRADA 2.5 HDT",
        // último precio visto (dic 2025)
        precio: 715.52,
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
    internoNombre: "Tanque de salmuera 70 L (negro)",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "02-BTS-70L",
        nombre: "TANQUE DE SALMUERA NEGRO 70 LTS.",
        precio: 762.07,
      },
    },
  },
  {
    id: "carbon_coco_12_5kg",
    internoNombre: "Carbón concha de coco 12.5 kg (A.W.)",
    unidad: "saco",
    proveedores: {
      jimaja: {
        clave: "27-COCO12.5KG",
        nombre: "CARBON CONCHA DE COCO 12.5 KG A.W.",
        precio: 560.34,
      },
    },
  },
  {
    id: "zeolita_21kg",
    internoNombre: "Zeolita malla 6-12 (21 kg) (A.W.)",
    unidad: "saco",
    proveedores: {
      jimaja: {
        clave: "27-ZEOLITA AW",
        nombre: "ZEOLITA MALLA 6-12 SACO 1 PIE (21 KGS) AW",
        precio: 172.41,
      },
    },
  },
  {
    id: "resina_001x7_na",
    internoNombre: "Resina 001x7 Na FG (catiónica)",
    unidad: "saco",
    proveedores: {
      jimaja: {
        clave: "27-RCSUQING / 27-RCSUQINGAWT / 27-R001X8H",
        nombre:
          'RESINA (SUQING / AMERICA WATER / 001x7 Na FG / 001X8 H CATIONICA)',
        precio: 861.0,
      },
    },
  },
  {
    id: "multivalvula_1_filtro",
    internoNombre: 'Multiválvula 1" para filtro',
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "11-F64A1",
        nombre: 'MULTIVALVULA 1" PARA FILTRO',
        // en dic 2025 aparece a 237.07; en jun 2025 aparece a 215.52
        precio: 237.07,
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
        nombre: 'MULTIVALVULA 1" PARA SUAVIZADOR',
        precio: 426.72,
      },
    },
  },
  {
    id: "lampara_uv_25w",
    internoNombre: "Lámpara UV 25W (HDT)",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "18-UV25WTHDT",
        nombre: "LAMPARA DE UV 25 WATTS HDT",
        precio: 818.97,
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
    id: "ventury_3_4_jd609",
    internoNombre: "Ventury 3/4 (JD609) (HDT)",
    unidad: "pieza",
    proveedores: {
      jimaja: {
        clave: "35-JD609 (3/4)",
        nombre: "VENTURY DE 3/4 HDT",
        precio: 266.38,
      },
    },
  },

  // Nota: conexiones PVC (codos, tees, reducciones, tubos) conviene meterlas después
  // como una familia paramétrica (tipo + diámetro) por la cantidad de variantes.
];
