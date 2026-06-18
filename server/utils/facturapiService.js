const axios = require('axios');
const prisma = require('../lib/prisma');

/**
 * Servicio para interactuar con Facturapi
 * Documentación: https://www.facturapi.io/docs
 */
class FacturapiService {
    constructor(apiKey) {
        this.client = axios.create({
            baseURL: 'https://www.facturapi.io/v2',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Registra o actualiza un cliente en Facturapi (Cumple CFDI 4.0)
     */
    async upsertCustomer(data) {
        try {
            // Validar RFC genérico para público en general si aplica
            const isGeneric = data.rfc === 'XAXX010101000' || data.rfc === 'XEXX010101000';

            const payload = {
                full_name: data.razonSocial || data.nombre,
                tax_id: data.rfc,
                tax_system: data.regimenFiscal || (isGeneric ? '616' : '601'),
                address: {
                    zip: data.codigoPostal || '00000'
                }
            };

            if (data.facturapiId) {
                // Actualizar si ya existe
                const res = await this.client.put(`/customers/${data.facturapiId}`, payload);
                return res.data;
            }

            // Crear nuevo cliente
            const res = await this.client.post('/customers', payload);
            return res.data;
        } catch (error) {
            console.error('[Facturapi] Error upsertCustomer:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Crea una factura CFDI 4.0 a partir de un Pedido con parámetros dinámicos
     */
    async createInvoiceFromPedido(pedido, customerData, options = {}) {
        try {
            // 1. Asegurar que el cliente existe en Facturapi
            const apiCustomer = await this.upsertCustomer(customerData);

            // 2. Mapear items del pedido al formato Facturapi usando las claves SAT del modelo
            const items = pedido.items.map(item => {
                const productSource = item.product || item.servicePrice;
                return {
                    quantity: item.quantity,
                    product: {
                        description: item.product?.name || item.servicePrice?.name || 'Consumo Agua',
                        price: item.price,
                        taxes: [
                            {
                                type: 'IVA',
                                rate: 0.16, // En el futuro esto vendrá de ContableImpuesto
                            }
                        ],
                        product_key: productSource?.satProductKey || '50202306',
                        unit_key: productSource?.satUnitKey || 'H87'
                    }
                };
            });

            // 3. Preparar datos de la factura
            const invoiceData = {
                customer: apiCustomer.id,
                items,
                payment_form: options.payment_form || '01', // Efectivo por defecto
                payment_method: options.payment_method || 'PUE',
                use: options.use || 'G03', // Gastos en general
                folio_number: parseInt(pedido.customId.replace(/\D/g, '')) || undefined,
                series: options.series || 'DAR'
            };

            const res = await this.client.post('/invoices', invoiceData);
            return res.data;
        } catch (error) {
            console.error('[Facturapi] Error createInvoice:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Cancela una factura
     */
    async cancelInvoice(invoiceId, motive = '02') {
        try {
            const res = await this.client.delete(`/invoices/${invoiceId}`, {
                params: { motive }
            });
            return res.data;
        } catch (error) {
            console.error('[Facturapi] Error cancelInvoice:', error.response?.data || error.message);
            throw error;
        }
    }
}

/**
 * Servicio simulado para pruebas cuando no hay API Key configurada
 */
class FacturapiSimulationService {
    async createInvoiceFromPedido(pedido, customerData, options = {}) {
        console.log('[Facturapi] MODO SIMULACIÓN: Creando factura para', customerData.razonSocial);
        const simId = `sim_inv_${Date.now()}`;
        return {
            id: simId,
            uuid: `SIMULADO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            folio_number: parseInt(pedido.customId.replace(/\D/g, '')) || Math.floor(Math.random() * 1000),
            series: 'SIM',
            total: pedido.total,
            status: 'valid'
        };
    }

    async cancelInvoice(invoiceId, motive) {
        console.log('[Facturapi] MODO SIMULACIÓN: Cancelando factura', invoiceId);
        return { status: 'canceled' };
    }
}

/**
 * Helper para instanciar el servicio
 */
async function getFacturapiClient(empresaId) {
    const empresa = await prisma.contableEmpresa.findUnique({
        where: { id: empresaId }
    });
    
    if (!empresa?.facturapiApiKey) {
        console.warn(`[Facturapi] Empresa ${empresa?.nombre} no tiene API Key. Usando Modo Simulación.`);
        return new FacturapiSimulationService();
    }
    
    return new FacturapiService(empresa.facturapiApiKey);
}

module.exports = { FacturapiService, FacturapiSimulationService, getFacturapiClient };
