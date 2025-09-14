# Phase 3: Buyer Escrow & Orders (UI)

Routes added (protected):
- /orders — list your orders with search/pagination/status filter/CSV export
- /orders/new — multi-step creation flow (seller, details, confirm)
- /orders/:orderId — order detail with status timeline and delivery confirmation/rejection

Key files:
- src/types/order.ts — order models and payloads
- src/services/ordersService.ts — API wrappers under /orders
- src/components/orders/OrderCreateStepper.tsx — creation form
- src/components/orders/OrderStatusTimeline.tsx — enhanced visual timeline with Material-UI Stepper
- src/components/orders/DeliveryDecisionDialog.tsx — enhanced rejection dialog with reason templates
- src/pages/orders/OrderListPage.tsx — orders list with filters and export
- src/pages/orders/NewOrderPage.tsx — create order
- src/pages/orders/OrderDetailsPage.tsx — order detail with shipping info

## Enhanced Features:

### OrderStatusTimeline
- Visual stepper with icons for each status (payment, shipping, delivery, etc.)
- Handles both normal flow and special cases (rejected, disputed, cancelled)
- Shows timestamps and notes from backend tracking API
- Graceful fallback to default timeline if tracking endpoint fails

### DeliveryDecisionDialog 
- Pre-defined reason templates for common rejection scenarios
- Custom reason input for detailed explanations
- Evidence URL collection with helpful placeholder text
- Form validation and submission states
- Clear preview of final reason before submission

### OrderListPage
- Status filter dropdown with all order statuses
- Debounced search and filter reload
- CSV export functionality for order records
- Responsive design for mobile and desktop

Notes:
- The seller selector uses mocked options; plug into backend later.
- Tracking endpoint is optional; if missing, a sensible default timeline renders.
- Confirm button is enabled when status === 'delivered' (adjust per backend logic).
- All components handle loading states and error fallbacks gracefully.
