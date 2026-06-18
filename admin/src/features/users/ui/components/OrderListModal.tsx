import React, { useEffect, useState } from 'react';
import type { Order } from '../../domain/entities';

/**
 * OrderListModalProps defines the properties for OrderListModal component
 */
export interface OrderListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

/**
 * OrderListModal displays a list of orders for a specific user
 */
export const OrderListModal: React.FC<OrderListModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Mock data for development
      const mockOrders: Order[] = [
        {
          id: '1',
          userId: userId,
          orderNumber: 'ORD-2024-001',
          date: '2024-10-15T10:30:00',
          status: 'completed',
          total: 850000,
          items: [
            {
              id: '1',
              productName: 'Maybelline Fit Me Foundation',
              quantity: 2,
              price: 250000,
            },
            {
              id: '2',
              productName: 'MAC Lipstick Ruby Woo',
              quantity: 1,
              price: 350000,
            },
          ],
          shippingAddress: '123 Đường Lê Lợi, Q1, HCM',
          paymentMethod: 'Credit Card',
        },
        {
          id: '2',
          userId: userId,
          orderNumber: 'ORD-2024-002',
          date: '2024-10-10T14:20:00',
          status: 'processing',
          total: 1200000,
          items: [
            {
              id: '3',
              productName: 'Estée Lauder Double Wear',
              quantity: 1,
              price: 1200000,
            },
          ],
          shippingAddress: '123 Đường Lê Lợi, Q1, HCM',
          paymentMethod: 'COD',
        },
        {
          id: '3',
          userId: userId,
          orderNumber: 'ORD-2024-003',
          date: '2024-10-05T09:15:00',
          status: 'completed',
          total: 450000,
          items: [
            {
              id: '4',
              productName: 'Innisfree Green Tea Cleansing Foam',
              quantity: 3,
              price: 150000,
            },
          ],
          shippingAddress: '123 Đường Lê Lợi, Q1, HCM',
          paymentMethod: 'Bank Transfer',
        },
        {
          id: '4',
          userId: userId,
          orderNumber: 'ORD-2024-004',
          date: '2024-09-28T16:45:00',
          status: 'cancelled',
          total: 680000,
          items: [
            {
              id: '5',
              productName: 'NARS Blush Orgasm',
              quantity: 1,
              price: 680000,
            },
          ],
          shippingAddress: '123 Đường Lê Lợi, Q1, HCM',
          paymentMethod: 'Credit Card',
        },
        {
          id: '5',
          userId: userId,
          orderNumber: 'ORD-2024-005',
          date: '2024-09-20T11:00:00',
          status: 'completed',
          total: 320000,
          items: [
            {
              id: '6',
              productName: 'The Ordinary Niacinamide Serum',
              quantity: 2,
              price: 160000,
            },
          ],
          shippingAddress: '123 Đường Lê Lợi, Q1, HCM',
          paymentMethod: 'COD',
        },
      ];

      setTimeout(() => {
        setOrders(mockOrders);
        setLoading(false);
      }, 500);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
            <p className="text-sm text-gray-600 mt-1">
              Orders by <span className="font-medium">{userName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.date).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500">
                              Quantity: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.quantity * item.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="border-t border-gray-200 mt-4 pt-4 grid grid-cols-2 gap-4">
                    {order.shippingAddress && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Shipping Address</p>
                        <p className="text-sm text-gray-900">{order.shippingAddress}</p>
                      </div>
                    )}
                    {order.paymentMethod && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                        <p className="text-sm text-gray-900">{order.paymentMethod}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{orders.length}</span> orders
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
