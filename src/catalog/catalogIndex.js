// src/catalog/catalogIndex.js
import { PROVIDERS as JIMAJA_PROVIDERS, PRODUCTS as JIMAJA_PRODUCTS } from "./providers/jimajaCatalog";
import { CHINA_PROVIDER, CHINA_PRODUCTS } from "./providers/chinaCatalog";
import { MOUNTAIN_LIFE_PROVIDER, MOUNTAIN_LIFE_PRODUCTS } from "./providers/mountainLifeCatalog";

// Proveedores separados
export const PROVIDERS = [
  ...JIMAJA_PROVIDERS,
  CHINA_PROVIDER,
  MOUNTAIN_LIFE_PROVIDER,
];

// Productos separados por proveedor
export const PRODUCTS_BY_PROVIDER = {
  jimaja: JIMAJA_PRODUCTS,
  china: CHINA_PRODUCTS,
  mountain_life: MOUNTAIN_LIFE_PRODUCTS,
};
