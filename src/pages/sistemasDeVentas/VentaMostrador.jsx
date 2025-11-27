import { useState, useMemo } from "react";
import ProductGrid from "./ProductGrid";
import PosRefillGrid from "./PosRefillGrid";
import PosBuyGrid from "./PosBuyGrid";
import OrderSummary from "./OrderSummary";
import CustomerModal from "./CustomerModal";
import PaymentModal from "./PaymentModal";
import DeliveryModal from "./DeliveryModal";
import PosHeader from "./PosHeader";
import CashDrawerModal from "./CashDrawerModal";
import CloseRegisterModal from "./CloseRegisterModal";
import StartDayModal from "./StartDayModal";
import PasswordModal from "./PasswordModal";
import { useOrders } from "./hooks/useOrders";

const VentaMostrador = () => {
    // Session state
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [openingCash, setOpeningCash] = useState(0);
    const [transactions, setTransactions] = useState([]);

    // Order state
    const [orderItems, setOrderItems] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [deliveryInfo, setDeliveryInfo] = useState({
        method: 'mostrador',
        collectEmptyJugs: false,
        deliveryDetails: null,
    });
    
    // UI state
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isCashDrawerModalOpen, setIsCashDrawerModalOpen] = useState(false);
    const [cashDrawerActionType, setCashDrawerActionType] = useState('in');
    const [isCloseRegisterModalOpen, setIsCloseRegisterModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('directSale'); // 'directSale', 'refill', 'buyNew'
    
    // Get addOrder from context
    const { addOrder } = useOrders();

    // Memoized calculations
    const subtotal = useMemo(() => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [orderItems]);
    const shippingCost = useMemo(() => (deliveryInfo.method === 'domicilio' && deliveryInfo.collectEmptyJugs) ? 10 : 0, [deliveryInfo]);
    const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

    const cashInDrawer = useMemo(() => {
        return transactions.reduce((acc, t) => {
            if (t.type === 'sale' && t.paymentMethod === 'cash') return acc + t.amount;
            if (t.type === 'pay_in') return acc + t.amount;
            if (t.type === 'pay_out') return acc - t.amount;
            return acc;
        }, openingCash);
    }, [transactions, openingCash]);

    // Handlers
    const handleStartSession = (startingAmount) => {
        setOpeningCash(startingAmount);
        setTransactions([]);
        setIsSessionActive(true);
    };

    const handleEndSession = () => {
        setIsSessionActive(false);
        setOpeningCash(0);
        setTransactions([]); // Clear transactions for next session
        setOrderItems([]);
        setCustomer(null);
        setDeliveryInfo({ method: 'mostrador', collectEmptyJugs: false, deliveryDetails: null });
    };

    const handleProductSelect = (product) => {
        setOrderItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };
    
    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(productId);
            return;
        }
        setOrderItems(prevItems =>
            prevItems.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const handleRemoveItem = (productId) => {
        setOrderItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const handleCustomerAdd = (customerData) => {
        setCustomer(customerData);
    };

    const handleSaveDeliveryInfo = (newDeliveryInfo) => {
        setDeliveryInfo(newDeliveryInfo);
    };

    const handlePaymentConfirm = (paymentData) => {
        if (deliveryInfo.method === 'domicilio') {
            addOrder({
                orderItems,
                customer,
                deliveryInfo,
                total,
                shippingCost,
            });
        }
        
        // This part runs for both delivery and non-delivery orders
        const newTransaction = {
            type: 'sale',
            description: `Venta de ${orderItems.length} productos`,
            amount: paymentData.total,
            paymentMethod: paymentData.method,
            timestamp: new Date(),
        };
        setTransactions(prev => [...prev, newTransaction]);
        
        // Reset state
        setOrderItems([]);
        setCustomer(null);
        setDeliveryInfo({ method: 'mostrador', collectEmptyJugs: false, deliveryDetails: null });
        setIsPaymentModalOpen(false);
    };

    const handleCashDrawerAction = (cashAction) => {
        const newTransaction = {
            type: cashAction.type === 'in' ? 'pay_in' : 'pay_out',
            description: cashAction.reason,
            amount: cashAction.amount,
            paymentMethod: 'cash',
            timestamp: new Date(),
        };
        setTransactions(prev => [...prev, newTransaction]);
        setIsCashDrawerModalOpen(false);
    };

    const handleOpenPayIn = () => {
        setCashDrawerActionType('in');
        setIsCashDrawerModalOpen(true);
    };

    const handleOpenPayOut = () => {
        setCashDrawerActionType('out');
        setIsCashDrawerModalOpen(true);
    };

    const handleRequestCloseRegister = () => {
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = () => {
        setIsPasswordModalOpen(false);
        setIsCloseRegisterModalOpen(true);
    };

    if (!isSessionActive) {
        return <StartDayModal onStartSession={handleStartSession} />;
    }

    const deliveryModalData = {
        method: deliveryInfo.method,
        collectEmptyJugs: deliveryInfo.collectEmptyJugs,
        deliveryDetails: customer || deliveryInfo.deliveryDetails
    };

    return (
        <div className="bg-light dark:bg-dark h-screen flex flex-col font-display text-[#111418] dark:text-white">
            <PosHeader 
                onPayIn={handleOpenPayIn}
                onPayOut={handleOpenPayOut}
                onCloseRegister={handleRequestCloseRegister} // Modified
            />
            <div className="flex flex-1 overflow-hidden p-6 pt-0">
                <div className="flex-1 pr-6 overflow-y-auto">
                    {/* Tabs for order type */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                        <button 
                            onClick={() => setActiveTab('directSale')}
                            className={`px-4 py-2 text-sm font-semibold ${activeTab === 'directSale' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                        >
                            Venta Directa
                        </button>
                        <button 
                            onClick={() => setActiveTab('refill')}
                            className={`px-4 py-2 text-sm font-semibold ${activeTab === 'refill' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                        >
                            Recarga de Garrafones
                        </button>
                        <button 
                            onClick={() => setActiveTab('buyNew')}
                            className={`px-4 py-2 text-sm font-semibold ${activeTab === 'buyNew' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                        >
                            Comprar Garrafones
                        </button>
                    </div>

                    {activeTab === 'directSale' && <ProductGrid onProductSelect={handleProductSelect} />}
                    {activeTab === 'refill' && <PosRefillGrid onProductSelect={handleProductSelect} />}
                    {activeTab === 'buyNew' && <PosBuyGrid onProductSelect={handleProductSelect} />}
                </div>
                <div className="w-96">
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
            </div>

            {/* Modals */}
            <CustomerModal 
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onCustomerAdd={handleCustomerAdd}
            />
            <PaymentModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                total={total}
                onPaymentConfirm={handlePaymentConfirm}
            />
            <DeliveryModal
                isOpen={isDeliveryModalOpen}
                onClose={() => setIsDeliveryModalOpen(false)}
                onSave={handleSaveDeliveryInfo}
                initialData={deliveryModalData}
            />
            <CashDrawerModal 
                isOpen={isCashDrawerModalOpen}
                onClose={() => setIsCashDrawerModalOpen(false)}
                onConfirm={handleCashDrawerAction}
                defaultType={cashDrawerActionType}
            />
            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            />
            <CloseRegisterModal 
                isOpen={isCloseRegisterModalOpen}
                onClose={() => setIsCloseRegisterModalOpen(false)}
                onEndSession={handleEndSession}
                sessionData={{
                    openingCash,
                    transactions,
                    expectedInDrawer: cashInDrawer,
                }}
            />
        </div>
    );
};

export default VentaMostrador;
