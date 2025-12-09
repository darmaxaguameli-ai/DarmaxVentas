# Planned Changes for `src/pages/Client/orders/OrderSummaryStepFour.jsx`

This document outlines the modifications to be implemented in `OrderSummaryStepFour.jsx` to enable the creation of refill orders.

## Objective
To integrate the order creation logic by fetching relevant service prices, calculating the order total, and sending the order data to the backend API.

## Modifications

1.  **Imports:**
    *   Import `useState` and `useEffect` from 'react'.
    *   Import `createOrder` and `fetchFilteredServicePrices` from `../../../api/apiClient`.
    *   Import `useAuth` from `../../../context/AuthContext`. (Needed to get `clienteId` for authenticated users).

2.  **State Variables:**
    *   `servicePrices`: `useState([])` - To store fetched service prices.
    *   `loadingPrices`: `useState(true)` - To manage loading state for service prices.
    *   `errorPrices`: `useState(null)` - To store any errors during service price fetching.
    *   `isSubmitting`: `useState(false)` - To manage the loading state of the confirmation button.
    *   `orderTotal`: `useState(0)` - To store the calculated total of the order.

3.  **`useEffect` for Fetching Service Prices:**
    *   This effect will run when `deliveryMethod` or `tiposAguaAsignados` (from `fromStepTwo`) changes.
    *   It will call `fetchFilteredServicePrices` with `method: deliveryMethod`, `name: "Recarga"`, and `waterTypeId` (iterating through `tiposAguaAsignados` to get each `waterTypeId`).
    *   It will match the fetched `ServicePrice` objects with the `tiposAguaAsignados` to determine the price for each item.
    *   Calculate `orderTotal` based on these prices and quantities.

4.  **`handleConfirm` Function Logic:**
    *   **Determine `clienteId`:**
        *   If an authenticated `user` exists (`useAuth`), use `user.id`.
        *   If `previousState.clientData` exists (for guest users), use `previousState.clientData.id`.
    *   **Construct `orderItems` payload:**
        *   Map `tiposAguaAsignados` to `PedidoItem` objects.
        *   Each `PedidoItem` should include `quantity`, `price` (from fetched `servicePrices`), and `servicePriceId` (from fetched `servicePrices`).
    *   **Create `orderPayload`:**
        *   `clienteId`: (determined above)
        *   `total`: `orderTotal`
        *   `deliveryMethod`: `deliveryMethod`
        *   `status`: Initial status, e.g., "PENDIENTE"
        *   `paymentStatus`: "NO_PAGADO" (or "PAGADO" if payment integrated here)
        *   `items`: `orderItems`
    *   **Call `createOrder(orderPayload)`:**
        *   Set `isSubmitting` to `true` before the call.
        *   Handle success: Navigate to a confirmation page with the new order ID.
        *   Handle error: Display an error message.
        *   Set `isSubmitting` to `false` after the call.

## Assumptions
*   The backend API endpoint `/service-prices` can accept `method`, `waterTypeId`, and `name` as query parameters for filtering.
*   The `name` for refill services is consistently "Recarga".
*   Authenticated user's ID is available via `useAuth().user.id`.
*   Guest user's ID is available via `previousState.clientData.id`.
