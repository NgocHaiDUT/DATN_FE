"use client";

import { X, User, MapPin, Phone, Package, CreditCard, Truck, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { useI18n } from '@/lib/i18n/I18nContext';

interface OrderDetailModalProps {
  order: any;
  onClose: () => void;
  onUpdateStatus: (orderId: number, status: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getPaymentStatusBadge: (status: string) => React.ReactNode;
  isUpdating?: boolean;
}

export function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  getStatusBadge,
  getPaymentStatusBadge,
  isUpdating,
}: OrderDetailModalProps) {
  const { t } = useI18n();
  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const shippingAddress = order.shipping_address;
  const payment = order.payments?.[0];
  const shipment = order.shipments?.[0];
  const paymentStatus = order.payment_status?.toLowerCase();
  const isPaid = paymentStatus === 'paid';
  const isCodOrder = order.payments?.some(
    (item: any) => item?.provider?.toLowerCase() === 'cod'
  );
  const canActOnPendingOrder =
    isPaid || Boolean(isCodOrder);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('seller.orders.detail.title', { id: order.id })}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('seller.orders.detail.placedAt')}: {formatDate(order.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('seller.orders.detail.orderStatus')}:</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('seller.orders.detail.paymentStatus')}:</span>
                    {getPaymentStatusBadge(order.payment_status)}
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && canActOnPendingOrder && (
                    <Button
                      onClick={() => onUpdateStatus(order.id, 'confirmed')}
                      className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90"
                      disabled={isUpdating}
                    >
                      {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t('seller.orders.detail.btnConfirm')}
                    </Button>
                  )}
                  {order.status === 'pending' && !canActOnPendingOrder && (
                    <span className="text-sm font-medium text-amber-600 px-3 py-2 rounded bg-amber-50">
                      Chờ thanh toán
                    </span>
                  )}
                  {order.status === 'confirmed' && (
                    <Button
                      onClick={() => onUpdateStatus(order.id, 'processing')}
                      className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90"
                      disabled={isUpdating}
                    >
                      {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t('seller.orders.detail.btnProcess')}
                    </Button>
                  )}
                  {order.status === 'processing' && (
                    <Button
                      onClick={() => onUpdateStatus(order.id, 'shipped')}
                      className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90"
                      disabled={isUpdating}
                    >
                      {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t('seller.orders.detail.btnShip')}
                    </Button>
                  )}
                  {((order.status === 'pending' && canActOnPendingOrder) || order.status === 'confirmed') && (
                    <Button
                      variant="destructive"
                      onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      disabled={isUpdating}
                    >
                      {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t('seller.orders.detail.btnCancel')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('seller.orders.detail.customer')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  {order.user?.avatar_url && (
                    <ImageWithFallback
                      src={order.user.avatar_url}
                      alt={order.user.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{order.user?.full_name || 'N/A'}</p>
                    {order.user?.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {order.user.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t('seller.orders.detail.address')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shippingAddress ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">{shippingAddress.name}</p>
                    <p className="text-gray-600">{shippingAddress.phone}</p>
                    <p className="text-gray-600">
                      {shippingAddress.street}, {shippingAddress.ward}, {shippingAddress.district}, {shippingAddress.province}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">{t('seller.orders.detail.noAddress')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t('seller.orders.detail.orderItems')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    {item.variant?.product?.product_media?.[0]?.url && (
                      <ImageWithFallback
                        src={item.variant.product.product_media[0].url}
                        alt={item.name_snapshot || 'Sản phẩm'}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.name_snapshot || 'Sản phẩm'}</p>
                      {item.variant_snapshot && (
                        <p className="text-sm text-gray-600">{t('seller.orders.detail.variant')}: {item.variant_snapshot}</p>
                      )}
                      <p className="text-sm text-gray-500">{t('seller.orders.detail.qty')}: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.line_total)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.unit_price)} {t('seller.orders.detail.perItem')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment & Shipping Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t('seller.orders.detail.payment')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                      <span className="text-gray-600">{t('seller.orders.detail.method')}:</span>
                      <span className="font-medium">{payment.provider || 'N/A'}</span>
                    </div>
                    {payment.transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('seller.orders.detail.transactionId')}:</span>
                        <span className="font-medium">{payment.transaction_id}</span>
                      </div>
                    )}
                    {payment.paid_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('seller.orders.detail.paidAt')}:</span>
                      <span className="font-medium">{formatDate(payment.paid_at)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {shipment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    {t('seller.orders.detail.shipping')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {shipment.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('seller.orders.detail.trackingNumber')}:</span>
                      <span className="font-medium">{shipment.tracking_number}</span>
                    </div>
                  )}
                  {shipment.carrier && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('seller.orders.detail.carrier')}:</span>
                      <span className="font-medium">{shipment.carrier}</span>
                    </div>
                  )}
                  {order.ghn_expected_delivery_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('seller.orders.detail.expectedDelivery')}:</span>
                      <span className="font-medium text-emerald-600">
                        {formatDate(order.ghn_expected_delivery_time).split(' ')[0]}
                      </span>
                    </div>
                  )}
                  {shipment.shipped_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('seller.orders.detail.shippedAt')}:</span>
                      <span className="font-medium">{formatDate(shipment.shipped_at)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('seller.orders.detail.summary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('seller.orders.detail.subtotal')}:</span>
                  <span>{formatCurrency(order.subtotal || order.total_amount)}</span>
                </div>
                {order.shipping_fee !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('seller.orders.detail.shippingFee')}:</span>
                    <span>{formatCurrency(order.shipping_fee)}</span>
                  </div>
                )}
                {order.discount_amount !== undefined && order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('seller.orders.detail.discount')}:</span>
                    <span>-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-bold text-lg">
                  <span>{t('seller.orders.detail.total')}:</span>
                  <span className="text-[#c27aff]">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          {order.note && (
            <Card>
              <CardHeader>
                <CardTitle>{t('seller.orders.detail.note')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{order.note}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

