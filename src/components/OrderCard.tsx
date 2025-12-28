import React from "react";
import { Icon, Button, CircleTip } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { tw } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
import { Biqpod } from "@biqpod/app/ui/types";

export interface OrderCardProps {
  order: Biqpod.Snapbuy.Order;
  onViewDetails?: (orderId: string) => void;
  onTrackOrder?: (orderId: string) => void;
  onReorder?: (orderId: string) => void;
  compact?: boolean;
  showProducts?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onTrackOrder,
  onReorder,
  compact = false,
  showProducts = true,
}) => {
  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color and icon
  const getStatusInfo = (status: Biqpod.Snapbuy.Basic.OrderStatus) => {
    switch (status) {
      case "pending":
        return {
          color: "text-yellow-600 bg-yellow-100",
          icon: allIcons.solid.faClock,
          label: "Pending",
        };
      case "processing":
        return {
          color: "text-blue-600 bg-blue-100",
          icon: allIcons.solid.faCog,
          label: "Processing",
        };
      case "delivery":
        return {
          color: "text-purple-600 bg-purple-100",
          icon: allIcons.solid.faTruck,
          label: "In Delivery",
        };
      case "completed":
      case "done":
        return {
          color: "text-green-600 bg-green-100",
          icon: allIcons.solid.faCheck,
          label: "Delivered",
        };
      case "cancelled":
        return {
          color: "text-red-600 bg-red-100",
          icon: allIcons.solid.faTimes,
          label: "Cancelled",
        };
      default:
        return {
          color: "text-gray-600 bg-gray-100",
          icon: allIcons.solid.faQuestion,
          label: "Unknown",
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  // Calculate product count
  const productCount = Object.keys(order.products || {}).length;

  const handleViewDetails = () => {
    if (onViewDetails && order.id) {
      onViewDetails(order.id);
    }
  };

  const handleTrackOrder = () => {
    if (onTrackOrder && order.id) {
      onTrackOrder(order.id);
    }
  };

  const handleReorder = () => {
    if (onReorder && order.id) {
      onReorder(order.id);
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-[--biqpod-background-secondary] p-3 border border-[--biqpod-border] hover:border-[--biqpod-primary] rounded-lg transition-colors"
      >
        {/* Status Icon */}
        <div className={tw("flex-shrink-0 p-2 rounded-full", statusInfo.color)}>
          <Icon icon={statusInfo.icon} />
        </div>

        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">
            Order #{order.id?.slice(-8) || "Unknown"}
          </h4>
          <p className="text-[--biqpod-text-secondary] text-xs">
            {formatDate(order.createdAt)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={tw("text-xs px-2 py-0.5 rounded", statusInfo.color)}
            >
              {statusInfo.label}
            </span>
            {order.totalPrice && (
              <span className="font-semibold text-[--biqpod-primary] text-xs">
                ${order.totalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {order.status === "delivery" && onTrackOrder && (
            <CircleTip
              icon={allIcons.solid.faMapMarkerAlt}
              onClick={handleTrackOrder}
            />
          )}
          {onViewDetails && (
            <CircleTip
              icon={allIcons.solid.faEye}
              onClick={handleViewDetails}
            />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[--biqpod-background-secondary] border border-[--biqpod-border] hover:border-[--biqpod-primary] rounded-lg overflow-hidden transition-colors"
    >
      {/* Header */}
      <div className="p-4 border-[--biqpod-border] border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={tw("p-2 rounded-full", statusInfo.color)}>
              <Icon icon={statusInfo.icon} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Order #{order.id?.slice(-8) || "Unknown"}
              </h3>
              <p className="text-[--biqpod-text-secondary] text-sm">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <span
            className={tw(
              "px-3 py-1 rounded-full text-sm font-medium",
              statusInfo.color
            )}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <div className="p-4">
        {/* Customer/Client Info */}
        {(order.client || order.customer) && (
          <div className="mb-4">
            <h4 className="mb-2 font-medium text-sm">Customer Information</h4>
            <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
              {order.client ? (
                <div>
                  <p className="font-medium">
                    {order.client.firstname} {order.client.lastname}
                  </p>
                  <p className="text-[--biqpod-text-secondary] text-sm">
                    {order.client.phone}
                  </p>
                </div>
              ) : order.customer ? (
                <p className="font-medium">Customer ID: {order.customer}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Delivery Information */}
        {order.place && (
          <div className="mb-4">
            <h4 className="mb-2 font-medium text-sm">Delivery Address</h4>
            <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
              <p className="text-sm">{order.place.address}</p>
              <p className="text-[--biqpod-text-secondary] text-sm">
                {order.place.wilaya}
              </p>
            </div>
          </div>
        )}

        {/* Products Summary */}
        {showProducts && productCount > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 font-medium text-sm">
              Products ({productCount} items)
            </h4>
            <div className="space-y-2">
              {Object.entries(order.products || {})
                .slice(0, 3)
                .map(([productId, details]) => (
                  <div
                    key={productId}
                    className="flex justify-between items-center bg-[--biqpod-gray-opacity] p-2 rounded"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        Product #{productId.slice(-8)}
                      </p>
                      <p className="text-[--biqpod-text-secondary] text-xs">
                        Quantity: {details?.count || 1}
                      </p>
                    </div>
                    {details?.price && (
                      <span className="font-semibold text-sm">
                        $
                        {((details.price || 0) * (details.count || 1)).toFixed(
                          2
                        )}
                      </span>
                    )}
                  </div>
                ))}
              {productCount > 3 && (
                <p className="text-[--biqpod-text-secondary] text-xs text-center">
                  +{productCount - 3} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        {order.totalPrice && (
          <div className="bg-[--biqpod-primary-background] mb-4 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="font-bold text-[--biqpod-primary] text-xl">
                ${order.totalPrice.toFixed(2)}
              </span>
            </div>
            {order.discountAmount && (
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-green-600">Discount Applied</span>
                <span className="text-green-600">
                  -${order.discountAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Delivery Agent */}
        {order.delivery && order.status === "delivery" && (
          <div className="mb-4">
            <h4 className="mb-2 font-medium text-sm">Delivery Agent</h4>
            <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
              <p className="text-sm">
                Agent ID: {order.delivery.agentId || "Assigned"}
              </p>
              <p className="text-[--biqpod-text-secondary] text-xs">
                Assigned on {formatDate(order.delivery.assignedAt)}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onViewDetails && (
            <Button
              onClick={handleViewDetails}
              className="flex flex-1 justify-center items-center gap-2 bg-[--biqpod-primary] hover:opacity-90 text-white transition-opacity"
            >
              <Icon icon={allIcons.solid.faEye} />
              View Details
            </Button>
          )}

          {order.status === "delivery" && onTrackOrder && (
            <Button
              onClick={handleTrackOrder}
              className="flex flex-1 justify-center items-center gap-2 hover:bg-[--biqpod-primary-background] border border-[--biqpod-primary] text-[--biqpod-primary] transition-colors"
            >
              <Icon icon={allIcons.solid.faMapMarkerAlt} />
              Track Order
            </Button>
          )}

          {(order.status === "completed" || order.status === "done") &&
            onReorder && (
              <Button
                onClick={handleReorder}
                className="flex flex-1 justify-center items-center gap-2 hover:bg-[--biqpod-gray-opacity] border border-[--biqpod-border] text-[--biqpod-text-primary] transition-colors"
              >
                <Icon icon={allIcons.solid.faRedo} />
                Reorder
              </Button>
            )}
        </div>

        {/* Order Timeline (if delivered) */}
        {(order.status === "completed" || order.status === "done") && (
          <div className="mt-4 pt-4 border-[--biqpod-border] border-t">
            <h4 className="mb-3 font-medium text-sm">Order Timeline</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-green-500 rounded-full w-2 h-2"></div>
                <span className="text-[--biqpod-text-secondary]">
                  Order placed - {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-blue-500 rounded-full w-2 h-2"></div>
                <span className="text-[--biqpod-text-secondary]">
                  Processing started
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-purple-500 rounded-full w-2 h-2"></div>
                <span className="text-[--biqpod-text-secondary]">
                  Out for delivery
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-green-500 rounded-full w-2 h-2"></div>
                <span className="text-[--biqpod-text-secondary]">
                  Delivered - {formatDate(order.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrderCard;
