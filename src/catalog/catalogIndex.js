// src/catalog/catalogIndex.js
import { PROVIDERS as FERISA_PROVIDERS, PRODUCTS as FERISA_PRODUCTS } from "./providers/ferisaCatalog";
import { CHINA_PROVIDER, CHINA_PRODUCTS } from "./providers/chinaCatalog";
import { MOUNTAIN_LIFE_PROVIDER, MOUNTAIN_LIFE_PRODUCTS } from "./providers/mountainLifeCatalog";

// Proveedores separados
export const PROVIDERS = [
  ...FERISA_PROVIDERS,
  CHINA_PROVIDER,
  MOUNTAIN_LIFE_PROVIDER,
];

// Productos separados por proveedor
export const PRODUCTS_BY_PROVIDER = {
  ferisa: FERISA_PRODUCTS,
  china: CHINA_PRODUCTS,
  mountain_life: MOUNTAIN_LIFE_PRODUCTS,
};
