import React, { useState, useMemo } from 'react';
import ProductGrid from "./ProductGrid";
import PosRefillGrid from "./PosRefillGrid";
import PosBuyGrid from "./PosBuyGrid";
import OrderSummary from "./OrderSummary";
import CustomerModal from "./CustomerModal";
import PaymentModal from "./PaymentModal";
import DeliveryModal from "./DeliveryModal";
import Swal from 'sweetalert2';
import { createOrder, createUser } from '../../api/apiClient';
import { MdShoppingCart, MdClose, MdExpandLess } from 'react-icons/md';
import { useHaptic } from '../../hooks/useHaptic';

const NewOrderFlow = ({ onExit }) => {
    const { selection, impact } = useHaptic();
    // Re-introduce states from the old VentaMostrador for new order creation
    const [orderItems, setOrderItems] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [deliveryInfo, setDeliveryInfo] = useState({
        method: 'domicilio', // Default for new orders via seller
        collectEmptyJugs: false,
        deliveryDetails: null,
    });
    
    // Modals state
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false); // New Mobile State
    const [activeTab, setActiveTab] = useState('refill'); // Tab for product selection

    // Memoized calculations (from old VentaMostrador)
    const subtotal = useMemo(() => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [orderItems]);
    const shippingCost = useMemo(() => (deliveryInfo.method === 'domicilio' && deliveryInfo.collectEmptyJugs) ? 10 : 0, [deliveryInfo]);
    const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);
    const totalItems = useMemo(() => orderItems.reduce((sum, item) => sum + item.quantity, 0), [orderItems]);

    // Handlers for order items (from old VentaMostrador)
    const handleProductSelect = (product, quantity = 1) => {
        setOrderItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
            }
            return [...prevItems, { ...product, quantity: quantity }];
        });
    };
    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(productId);
            return;
        }
        setOrderItems(prevItems => prevItems.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
    };
    const handleRemoveItem = (productId) => {
        setOrderItems(prevItems => prevItems.filter(item => item.id !== productId));
        if (orderItems.length <= 1) {
            setIsMobileSummaryOpen(false); // Close mobile summary if empty
        }
    };
    const handleCustomerAdd = (customerData) => {
        setCustomer(customerData);
        setIsCustomerModalOpen(false); // Close modal after adding customer
    };
    const handleSaveDeliveryInfo = (newDeliveryInfo) => {
        setDeliveryInfo(newDeliveryInfo);
        setIsDeliveryModalOpen(false); // Close modal after saving delivery info
    };

    const handlePaymentConfirm = async (paymentData) => {
        try {
            Swal.fire({
                title: 'Procesando Pedido...',
                text: 'Por favor espere.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // 1. Resolve Customer ID
            let finalCustomerId = customer?.id;

            // If customer is marked as new (from CustomerModal) or we have delivery details but no ID
            if ((customer?.isNew || !finalCustomerId) && deliveryInfo.deliveryDetails?.name) {
                try {
                    // Create the user first
                    const newUserData = {
                        name: deliveryInfo.deliveryDetails.name,
                        phone: deliveryInfo.deliveryDetails.phone || customer?.phone || '',
                        street: deliveryInfo.deliveryDetails.address || '',
                        neighborhood: '', // Simplified for now
                        references: deliveryInfo.deliveryDetails.references || '',
                        // Role will be forced to CLIENTE by backend
                    };
                    
                    // Only create if we have at least a name
                    if (newUserData.name) {
                        const createdUser = await createUser(newUserData);
                        finalCustomerId = createdUser.id;
                    }
                } catch (err) {
                    console.error("Error creating new user:", err);
                    // Continue? We might fail if delivery requires user.
                    // But backend allows guest (null id).
                    // If it's delivery, we really want the address saved on the user or at least accessible.
                    // For now, if creation fails, we might proceed as guest or throw.
                    // Let's throw to warn the seller.
                    throw new Error("No se pudo registrar el nuevo cliente. Verifique los datos (teléfono duplicado?).");
                }
            }

            // 2. Construct Payload
            const orderPayload = {
                clienteId: finalCustomerId || null,
                items: orderItems.map(item => ({
                    quantity: item.quantity,
                    price: item.price,
                    servicePriceId: item.servicePriceId || undefined,
                    productId: item.productId || item.id, // Fallback to id
                    jugBrandId: item.jugBrandId || undefined,
                    jugBrandName: item.jugBrandName || undefined,
                    jugBrandImageUrl: item.jugBrandImageUrl || undefined
                })),
                total: total,
                deliveryMethod: deliveryInfo.method === 'domicilio' ? 'delivery' : 'pickup',
                paymentMethod: paymentData.method === 'cash' ? 'Efectivo' : 'Tarjeta',
                paymentStatus: 'PAGADO', // POS assumes immediate payment or commitment
            };

            // 3. Call API
            await createOrder(orderPayload);

            // 4. Success
            triggerImpact('heavy');
            Swal.fire('Pedido Creado', `Pedido registrado exitosamente.`, 'success');
            
            // Reset state and go back to dashboard
            setOrderItems([]);
            setCustomer(null);
            setDeliveryInfo({ method: 'domicilio', collectEmptyJugs: false, deliveryDetails: null });
            setIsPaymentModalOpen(false);
            onExit(); // Go back to the dashboard view

        } catch (error) {
            console.error("Error creating order:", error);
            Swal.fire('Error', 'No se pudo crear el pedido: ' + error.message, 'error');
        }
    };

    const getTabClassName = (tabName) => `flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === tabName ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:text-gray-700'}`;

    return (
        <div className="animate-fade-in pb-24 lg:pb-0 h-full flex flex-col">
             <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Product Selection Area */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    <div className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                        <nav className="flex">
                            <button onClick={() => { selection(); setActiveTab('refill'); }} className={getTabClassName('refill')}>Recargas</button>
                            <button onClick={() => { selection(); setActiveTab('buyNew'); }} className={getTabClassName('buyNew')}>Nuevos</button>
                            <button onClick={() => { selection(); setActiveTab('directSale'); }} className={getTabClassName('directSale')}>Otros</button>
                        </nav>
                    </div>
                    <div className="flex-1 py-4 overflow-y-auto">
                        {activeTab === 'directSale' && <ProductGrid onProductSelect={handleProductSelect} />}
                        {activeTab === 'refill' && <PosRefillGrid onProductSelect={handleProductSelect} defaultDeliveryMethod={deliveryInfo.method} />}
                        {activeTab === 'buyNew' && <PosBuyGrid onProductSelect={handleProductSelect} />}
                    </div>
                </div>

                {/* Desktop Order Summary (Sidebar) */}
                <div className="hidden lg:block lg:col-span-1 h-full">
                    <OrderSummary 
                        orderItems={orderItems}
                        customer={customer}
                        deliveryMethod={deliveryInfo.method}
                        onQuantityChange={handleQuantityChange}
                        onRemoveItem={handleRemoveItem}
                        subtotal={subtotal}
                        shippingCost={shippingCost}
                        total={total}
                        onCheckout={() => setIsPaymentModalOpen(true)}
                        onCustomerSelect={() => setIsCustomerModalOpen(true)}
                        onDeliverySelect={() => setIsDeliveryModalOpen(true)}
                        onRemoveCustomer={() => setCustomer(null)}
                    />
                </div>
            </main>

            {/* Mobile Floating Cart Bar */}
            {orderItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden animate-slide-up">
                    <button 
                        onClick={() => { selection(); setIsMobileSummaryOpen(true); }}
                        className="w-full bg-primary text-white h-14 rounded-xl flex items-center justify-between px-6 shadow-lg active:scale-95 transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold">
                                {totalItems}
                            </div>
                            <span className="font-bold text-lg">Ver Carrito</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black">${total.toFixed(2)}</span>
                            <MdExpandLess className="text-2xl" />
                        </div>
                    </button>
                </div>
            )}

            {/* Mobile Summary Modal (Full Screen Sheet) */}
            {isMobileSummaryOpen && (
                <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col animate-fade-in lg:hidden">
                    <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-4 shadow-sm border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-black text-gray-800 dark:text-white">Resumen</h2>
                        <button 
                            onClick={() => setIsMobileSummaryOpen(false)}
                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200"
                        >
                            <MdClose className="text-2xl" />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        <OrderSummary 
                            orderItems={orderItems}
                            customer={customer}
                            deliveryMethod={deliveryInfo.method}
                            onQuantityChange={handleQuantityChange}
                            onRemoveItem={handleRemoveItem}
                            subtotal={subtotal}
                            shippingCost={shippingCost}
                            total={total}
                            onCheckout={() => setIsPaymentModalOpen(true)}
                            onCustomerSelect={() => setIsCustomerModalOpen(true)}
                            onDeliverySelect={() => setIsDeliveryModalOpen(true)}
                            onRemoveCustomer={() => setCustomer(null)}
                            isMobileView={true} // Prop to remove duplicate headers inside component if needed
                        />
                    </div>
                </div>
            )}

            {/* Modals for new order flow */}
            <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onCustomerAdd={handleCustomerAdd} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} total={total} onPaymentConfirm={handlePaymentConfirm} />
            <DeliveryModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} onSave={handleSaveDeliveryInfo} initialData={deliveryInfo} />
        </div>
    );
};

export default NewOrderFlow;
