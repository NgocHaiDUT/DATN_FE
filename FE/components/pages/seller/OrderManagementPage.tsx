"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  AlertCircle,
  DollarSign,
  Eye,
  Loader2
} from "lucide-react";
import { useShop } from "@/features/shop/useShop";
import { useShopOrders, useUpdateOrderStatus } from "@/features/seller/useShopOrders";
import { OrderDetailModal } from "./OrderDetailModal";
import { useI18n } from "@/lib/i18n/I18nContext";

export function OrderManagementPage() {
  const { t } = useI18n();
  const { shop } = useShop();
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  const {
    data: ordersData,
    isLoading,
  } = useShopOrders(shop?.id, {
    page: pagination.page,
    limit: pagination.limit,
    status: filterStatus,
  });

  const orders = ordersData?.orders || [];
  const paginationData = ordersData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 10,
  };

  const updateStatusMutation = useUpdateOrderStatus();

  // Calculate stats from orders
  const stats = useMemo(() => {
    const newStats = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach((order: any) => {
      if (newStats.hasOwnProperty(order.status)) {
        (newStats as any)[order.status]++;
      }
    });

    return newStats;
  }, [orders]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const result: any = await updateStatusMutation.mutateAsync({ orderId, status: newStatus });
      if (result?.success === false || Number(result?.status || result?.statusCode || 0) >= 400) {
        throw new Error(result?.message || t('seller.orders.updateError'));
      }
      alert(t('seller.orders.updateSuccess'));

      // If the modal is open for this order, update its data
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : prev
        );
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || t('seller.orders.updateError'));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: t('orderStatus.pending') },
      confirmed: { color: 'bg-cyan-100 text-cyan-800', icon: CheckCircle, label: t('orderStatus.confirmed') },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Package, label: t('orderStatus.processing') },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck, label: t('orderStatus.shipped') },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: t('orderStatus.delivered') },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: t('orderStatus.cancelled') },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: DollarSign, label: t('orderStatus.refunded') },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      unpaid: { color: 'bg-red-100 text-red-800', label: t('seller.orders.paymentStatus.unpaid') },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: t('seller.orders.paymentStatus.pending') },
      paid: { color: 'bg-green-100 text-green-800', label: t('seller.orders.paymentStatus.paid') },
      failed: { color: 'bg-red-100 text-red-800', label: t('seller.orders.paymentStatus.failed') },
      refunded: { color: 'bg-gray-100 text-gray-800', label: t('seller.orders.paymentStatus.refunded') },
    };

    const config = statusConfig[paymentStatus] || { color: 'bg-gray-100 text-gray-800', label: paymentStatus };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canSellerActOnPendingOrder = (order: any) => {
    const paymentStatus = order.payment_status?.toLowerCase();
    const isPaid = paymentStatus === 'paid';
    const isCodOrder = order.payments?.some(
      (payment: any) => payment?.provider?.toLowerCase() === 'cod'
    );

    return isPaid || Boolean(isCodOrder);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#c27aff] mx-auto mb-4" />
          <p className="text-gray-500">{t('seller.orders.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('seller.orders.title')}</h1>
          <p className="text-gray-600">{t('seller.orders.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('seller.orders.filterLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('seller.orders.allOrders')}</SelectItem>
              <SelectItem value="pending">{t('orderStatus.pending')}</SelectItem>
              <SelectItem value="confirmed">{t('orderStatus.confirmed')}</SelectItem>
              <SelectItem value="processing">{t('orderStatus.processing')}</SelectItem>
              <SelectItem value="shipped">{t('orderStatus.shipped')}</SelectItem>
              <SelectItem value="delivered">{t('orderStatus.delivered')}</SelectItem>
              <SelectItem value="cancelled">{t('orderStatus.cancelled')}</SelectItem>
              <SelectItem value="refunded">{t('orderStatus.refunded')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-gray-600">{t('orderStatus.pending')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.confirmed}</div>
              <div className="text-sm text-gray-600">{t('orderStatus.confirmed')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.processing}</div>
              <div className="text-sm text-gray-600">{t('orderStatus.processing')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Truck className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats.shipped}</div>
              <div className="text-sm text-gray-600">{t('orderStatus.shipped')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterStatus === 'all' ? t('seller.orders.allOrders') : `${t('seller.orders.order')} ${filterStatus}`}
            <span className="text-sm text-gray-500 ml-2">({orders.length} {t('seller.orders.order').toLowerCase()})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('seller.orders.empty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const itemCount = order.order_items?.length || 0;
                const customerName = order.user?.full_name || order.user?.username || 'Unknown';
                const canActOnPendingOrder = canSellerActOnPendingOrder(order);

                return (
                  <div key={order.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#c27aff]/20 to-[#fb64b6]/20 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-5 h-5 text-[#c27aff]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{t('seller.orders.order')} #{order.id}</p>
                            {getStatusBadge(order.status)}
                            {getPaymentStatusBadge(order.payment_status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {t('seller.orders.customer')}: <span className="font-medium">{customerName}</span>
                          </p>
                          <p className="text-sm text-gray-500">
                            {t('seller.orders.items', { count: itemCount })} • {formatDate(order.created_at)}
                          </p>
                          {order.note && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              {t('seller.orders.note')}: {order.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900 mb-2">
                          {formatCurrency(order.total_amount)}
                        </p>

                        <div className="flex gap-2">
                          {order.status === 'pending' && canActOnPendingOrder && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              className="text-xs"
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id && (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              )}
                              {t('seller.orders.btnConfirm')}
                            </Button>
                          )}
                          {order.status === 'pending' && !canActOnPendingOrder && (
                            <span className="text-xs font-medium text-amber-600 px-2 py-1 rounded bg-amber-50">
                              Chờ thanh toán
                            </span>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(order.id, 'processing')}
                              className="text-xs"
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id && (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              )}
                              {t('seller.orders.btnProcess')}
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              className="text-xs"
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id && (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              )}
                              {t('seller.orders.btnShip')}
                            </Button>
                          )}
                          {((order.status === 'pending' && canActOnPendingOrder) || order.status === 'confirmed') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              className="text-xs"
                              disabled={updateStatusMutation.isPending}
                            >
                              {updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id && (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              )}
                              {t('seller.orders.btnCancel')}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs bg-gradient-to-r from-[#c27aff]/10 to-[#fb64b6]/10 hover:from-[#c27aff]/20 hover:to-[#fb64b6]/20"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {t('seller.orders.btnView')}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">{t('seller.orders.products')}:</p>
                        <div className="space-y-1">
                          {order.order_items.slice(0, 3).map((item: any, idx: number) => (
                            <p key={idx} className="text-sm text-gray-600">
                              {item.name_snapshot || t('seller.orders.products')}
                              {item.variant_snapshot && ` (${item.variant_snapshot})`}
                              {' '}x{item.quantity} - {formatCurrency(item.line_total)}
                            </p>
                          ))}
                          {order.order_items.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{order.order_items.length - 3} {t('seller.orders.products').toLowerCase()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {paginationData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                {t('seller.orders.pagination', { page: paginationData.page, total: paginationData.totalPages, count: paginationData.total })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationData.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  {t('common.prev')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationData.page === paginationData.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          getStatusBadge={getStatusBadge}
          getPaymentStatusBadge={getPaymentStatusBadge}
          isUpdating={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
}

