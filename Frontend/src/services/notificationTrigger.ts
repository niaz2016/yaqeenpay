// src/services/notificationTrigger.ts
import notificationService from './notificationService';

/**
 * Service to trigger notifications based on backend actions and API responses
 * This service hooks into various operations to provide real-time notification feedback
 */
class NotificationTriggerService {
  
  // Order-related notifications
  async onOrderCreated(order: any, currentUserId?: string) {
    try {
      // Notify the seller that a new order has been created
      if (order.sellerId && order.sellerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.sellerId,
          type: 'order_created',
          title: 'New Order Received! 🎉',
          message: `You have received a new order worth ${order.currency} ${order.amount?.toLocaleString()} from ${order.buyerName || 'a customer'}.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            buyerName: order.buyerName,
            description: order.description
          }
        });
      }

      // If it's a seller request, notify the buyer
      if (order.buyerId && order.buyerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.buyerId,
          type: 'order_created',
          title: 'Order Request Created',
          message: `Your order request for ${order.description} has been created and is awaiting seller approval.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            sellerName: order.sellerName,
            description: order.description
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger order created notification:', error);
    }
  }

  async onOrderApproved(order: any, currentUserId?: string) {
    try {
      // Notify the buyer that their order has been approved
      if (order.buyerId && order.buyerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.buyerId,
          type: 'order_approved',
          title: 'Order Approved! ✅',
          message: `Your order for ${order.description} has been approved by ${order.sellerName || 'the seller'}. Please proceed with payment to secure your items.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            sellerName: order.sellerName,
            description: order.description
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger order approved notification:', error);
    }
  }

  async onOrderRejected(order: any, reason: string, currentUserId?: string) {
    try {
      // Notify the buyer that their order has been rejected
      if (order.buyerId && order.buyerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.buyerId,
          type: 'order_rejected',
          title: 'Order Rejected ❌',
          message: `Your order for ${order.description} has been rejected. Reason: ${reason}`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            sellerName: order.sellerName,
            description: order.description,
            rejectionReason: reason
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger order rejected notification:', error);
    }
  }

  async onEscrowFunded(order: any, currentUserId?: string) {
    try {
      // Notify the seller that buyer's funds are now in escrow
      if (order.sellerId && order.sellerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.sellerId,
          type: 'escrow_funded',
          title: 'Payment Received! 💰',
          message: `${order.currency} ${order.amount?.toLocaleString()} has been placed in escrow for order ${order.code || order.id}. Ship the items to complete the sale.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            buyerName: order.buyerName,
            description: order.description,
            frozenAmount: order.amount,
            withdrawable: false // Not yet withdrawable until delivery confirmed
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger escrow funded notification:', error);
    }
  }

  async onPaymentConfirmed(order: any, paymentDetails: any, currentUserId?: string) {
    try {
      // Notify the seller that payment has been confirmed
      if (order.sellerId && order.sellerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.sellerId,
          type: 'payment_confirmed',
          title: 'FrozenPayment received �',
          message: `FrozenPayment received amount ${order.currency} ${order.amount?.toLocaleString()} for order ${order.code}. Funds are now locked in escrow and will be released upon buyer delivery confirmation. Prepare the shipment.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            buyerName: order.buyerName,
            description: order.description,
            paymentMethod: paymentDetails?.method || 'wallet',
            frozen: true
          }
        });
      }

      // Notify the buyer that their payment was processed
      if (order.buyerId && order.buyerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.buyerId,
          type: 'payment_confirmed',
          title: 'Payment Successful ✅',
          message: `Your payment of ${order.currency} ${order.amount?.toLocaleString()} is now frozen in escrow for order ${order.code}. We'll notify you when the seller ships your order.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            sellerName: order.sellerName,
            description: order.description,
            frozen: true
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger payment confirmed notification:', error);
    }
  }

  async onOrderShipped(order: any, shippingDetails: any, currentUserId?: string) {
    try {
      // Notify the buyer that their order has been shipped
      if (order.buyerId && order.buyerId !== currentUserId) {
        const trackingInfo = shippingDetails?.trackingNumber ? 
          ` Tracking: ${shippingDetails.trackingNumber}` : '';
        
        await notificationService.sendNotification({
          recipientId: order.buyerId,
          type: 'order_shipped',
          title: 'Order Shipped! 📦',
          message: `Your order ${order.code} has been shipped by ${order.sellerName || 'the seller'}.${trackingInfo} You can confirm delivery once received.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            sellerName: order.sellerName,
            description: order.description,
            trackingNumber: shippingDetails?.trackingNumber,
            courier: shippingDetails?.courier
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger order shipped notification:', error);
    }
  }

  async onDeliveryConfirmed(order: any, currentUserId?: string) {
    try {
      // Notify the seller that delivery has been confirmed and payment will be released
      if (order.sellerId && order.sellerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.sellerId,
          type: 'payment_released',
          title: 'Payment Released! 💰',
          message: `Delivery confirmed! ${order.currency} ${order.amount?.toLocaleString()} has been released to your wallet for order ${order.code}.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            buyerName: order.buyerName,
            description: order.description
          }
        });

        // Follow-up notification explicitly stating funds are now active / withdrawable
        try {
          await notificationService.sendNotification({
            recipientId: order.sellerId,
            type: 'payment_released', // reuse existing type until a distinct enum exists
            title: 'Funds Now Withdrawable 🏦',
            message: `The previously frozen amount (${order.currency} ${order.amount?.toLocaleString()}) for order ${order.code} is now in your active wallet balance. You can create a withdrawal request anytime.`,
            data: {
              orderId: order.id,
              orderCode: order.code,
              amount: order.amount,
              currency: order.currency,
              withdrawable: true,
              releasedAt: new Date().toISOString()
            }
          });
        } catch (followErr) {
          console.warn('Failed to send secondary withdrawable funds notification:', followErr);
        }
      }

      // Notify the buyer that their order is complete
      if (order.buyerId && order.buyerId !== currentUserId) {
        await notificationService.sendNotification({
          recipientId: order.buyerId,
          type: 'order_created', // Using order_created as it's in the enum
          title: 'Order Complete! ✅',
          message: `Order ${order.code} has been completed successfully. Payment has been released to the seller.`,
          data: { 
            orderId: order.id, 
            orderCode: order.code,
            amount: order.amount, 
            currency: order.currency,
            sellerName: order.sellerName,
            description: order.description
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger delivery confirmed notification:', error);
    }
  }

  // Wallet-related notifications
  async onWalletTopUp(topUpDetails: any, currentUserId?: string) {
    try {
      if (currentUserId) {
        await notificationService.sendNotification({
          recipientId: currentUserId,
          type: 'payment_confirmed', // Using payment_confirmed as wallet type might not exist in legacy enum
          title: 'Wallet Top-up Successful! 💰',
          message: `${topUpDetails.currency} ${topUpDetails.amount?.toLocaleString()} has been added to your wallet successfully.`,
          data: { 
            amount: topUpDetails.amount,
            currency: topUpDetails.currency,
            method: topUpDetails.method || 'unknown',
            transactionId: topUpDetails.transactionId,
            newBalance: topUpDetails.newBalance
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger wallet top-up notification:', error);
    }
  }

  async onWalletTopUpFailed(topUpDetails: any, reason: string, currentUserId?: string) {
    try {
      if (currentUserId) {
        await notificationService.sendNotification({
          recipientId: currentUserId,
          type: 'payment_confirmed', // Using available enum value
          title: 'Wallet Top-up Failed ❌',
          message: `Your wallet top-up of ${topUpDetails.currency} ${topUpDetails.amount?.toLocaleString()} failed. Reason: ${reason}`,
          data: { 
            amount: topUpDetails.amount,
            currency: topUpDetails.currency,
            method: topUpDetails.method || 'unknown',
            reason: reason,
            transactionId: topUpDetails.transactionId
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger wallet top-up failed notification:', error);
    }
  }

  // Authentication-related notifications
  async onLoginSuccess(loginDetails: any, currentUserId?: string) {
    try {
      if (currentUserId) {
        const location = loginDetails.location || 'Unknown location';
        const device = loginDetails.device || 'Unknown device';
        
        await notificationService.sendNotification({
          recipientId: currentUserId,
          type: 'order_created', // Using available enum value
          title: 'New Login Detected 🔐',
          message: `New login to your account from ${device} at ${location}.`,
          data: { 
            location: location,
            device: device,
            timestamp: new Date().toISOString(),
            ipAddress: loginDetails.ipAddress
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger login notification:', error);
    }
  }

  // System notifications
  async onSystemError(errorDetails: any, currentUserId?: string) {
    try {
      if (currentUserId) {
        await notificationService.sendNotification({
          recipientId: currentUserId,
          type: 'order_created', // Using available enum value for system messages
          title: 'System Alert ⚠️',
          message: errorDetails.message || 'An error occurred in the system. Our team has been notified.',
          data: { 
            errorType: errorDetails.type,
            errorCode: errorDetails.code,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger system error notification:', error);
    }
  }

  // KYC notifications
  async onKycDocumentUploaded(documentDetails: any, currentUserId?: string) {
    try {
      if (currentUserId) {
        await notificationService.sendNotification({
          recipientId: currentUserId,
          type: 'order_created', // Using available enum value
          title: 'KYC Document Uploaded ✅',
          message: `Your ${documentDetails.type || 'KYC'} document has been uploaded successfully and is under review.`,
          data: { 
            documentType: documentDetails.type,
            documentId: documentDetails.id,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger KYC document uploaded notification:', error);
    }
  }

  async onKycStatusChanged(kycDetails: any, currentUserId?: string) {
    try {
      if (currentUserId) {
        const statusMessages = {
          approved: 'Your KYC verification has been approved! ✅',
          rejected: 'Your KYC verification was rejected. Please check the requirements and resubmit. ❌',
          pending: 'Your KYC documents are under review. We\'ll notify you once complete. ⏳'
        };

        const message = statusMessages[kycDetails.status as keyof typeof statusMessages] || 
                        `Your KYC status has been updated to: ${kycDetails.status}`;

        await notificationService.sendNotification({
          recipientId: currentUserId,
          type: 'order_created', // Using available enum value
          title: 'KYC Status Update',
          message: message,
          data: { 
            status: kycDetails.status,
            documentType: kycDetails.documentType,
            reason: kycDetails.reason,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to trigger KYC status change notification:', error);
    }
  }
}

// Create singleton instance
const notificationTrigger = new NotificationTriggerService();
export default notificationTrigger;