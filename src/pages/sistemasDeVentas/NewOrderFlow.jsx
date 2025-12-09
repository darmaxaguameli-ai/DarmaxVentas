import React, { useState, useMemo } from 'react';
import ProductGrid from "./ProductGrid";
import PosRefillGrid from "./PosRefillGrid";
import PosBuyGrid from "./PosBuyGrid";
import OrderSummary from "./OrderSummary";
import CustomerModal from "./CustomerModal";
import PaymentModal from "./PaymentModal";
import DeliveryModal from "./DeliveryModal";
import Swal from 'sweetalert2';

const NewOrderFlow = ({ onExit }) => {
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
    const [activeTab, setActiveTab] = useState('refill'); // Tab for product selection

    // Memoized calculations (from old VentaMostrador)
    const subtotal = useMemo(() => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [orderItems]);
    const shippingCost = useMemo(() => (deliveryInfo.method === 'domicilio' && deliveryInfo.collectEmptyJugs) ? 10 : 0, [deliveryInfo]);
    const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

    // Handlers for order items (from old VentaMostrador)
    const handleProductSelect = (product) => {
        setOrderItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevItems, { ...product, quantity: 1 }];
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
    };
    const handleCustomerAdd = (customerData) => {
        setCustomer(customerData);
        setIsCustomerModalOpen(false); // Close modal after adding customer
    };
    const handleSaveDeliveryInfo = (newDeliveryInfo) => {
        setDeliveryInfo(newDeliveryInfo);
        setIsDeliveryModalOpen(false); // Close modal after saving delivery info
    };

    const handlePaymentConfirm = (paymentData) => {
        // TODO: This is where the actual API call to create the order will go
        console.log("Creating new order from seller:", { orderItems, customer, deliveryInfo, total, paymentData });
        Swal.fire('Pedido Creado', `Pedido para ${customer?.name || 'Cliente sin nombre'} registrado.`, 'success');
        // Reset state and go back to dashboard
        setOrderItems([]);
        setCustomer(null);
        setDeliveryInfo({ method: 'domicilio', collectEmptyJugs: false, deliveryDetails: null });
        setIsPaymentModalOpen(false);
        onExit(); // Go back to the dashboard view
    };

    const getTabClassName = (tabName) => `px-4 sm:px-6 py-3 font-semibold rounded-t-md transition-colors text-sm sm:text-base focus:outline-none ${activeTab === tabName ? 'bg-white dark:bg-gray-800 text-primary' : 'bg-transparent text-gray-500 hover:text-primary dark:hover:text-gray-300'}`;

    return (
        <div className="animate-fade-in">
             <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Selection Area */}
                <div className="lg:col-span-2 flex flex-col">
                    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex gap-2">
                            <button onClick={() => setActiveTab('refill')} className={getTabClassName('refill')}>Recargas</button>
                            <button onClick={() => setActiveTab('buyNew')} className={getTabClassName('buyNew')}>Garrafones Nuevos</button>
                            <button onClick={() => setActiveTab('directSale')} className={getTabClassName('directSale')}>Otros Productos</button>
                        </nav>
                    </div>
                    <div className="flex-1 py-4">
                        {activeTab === 'directSale' && <ProductGrid onProductSelect={handleProductSelect} />}
                        {activeTab === 'refill' && <PosRefillGrid onProductSelect={handleProductSelect} />}
                        {activeTab === 'buyNew' && <PosBuyGrid onProductSelect={handleProductSelect} />}
                    </div>
                </div>

                {/* Order Summary Area */}
                <div className="lg:col-span-1 h-full">
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

            {/* Modals for new order flow */}
            <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onCustomerAdd={handleCustomerAdd} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} total={total} onPaymentConfirm={handlePaymentConfirm} />
            <DeliveryModal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} onSave={handleSaveDeliveryInfo} initialData={deliveryInfo} />
        </div>
    );
};

export default NewOrderFlow;
