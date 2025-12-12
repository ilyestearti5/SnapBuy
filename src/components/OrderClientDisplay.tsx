import React from "react";
import { useAsyncMemo, showPopup } from "@biqpod/app/ui/hooks";
import {
  EmptyComponent,
  Translate,
  CircleTip,
  Card,
  CardHeaderForPopup,
  Line,
  Map,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  getOrderClientInfo,
  getOrderClientDisplayName,
  getOrderClientAddress,
} from "../utils/orderClientInfo";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { mergeArray } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
import { FadeIn, HoverScale, AnimatedCard } from "../animations/components";
import { Biqpod } from "@biqpod/app/ui/types";
interface OrderClientDisplayProps {
  order: Biqpod.Snapbuy.Order;
  showAddress?: boolean;
  showPhone?: boolean;
  showCustomerBadge?: boolean;
  showActions?: boolean;
  className?: string;
  children?: (clientInfo: any) => React.ReactNode;
}
export const OrderClientDisplay = ({
  order,
  showAddress = false,
  showPhone = false,
  showCustomerBadge = false,
  showActions = false,
  className = "",
  children,
}: OrderClientDisplayProps) => {
  const clientInfo = useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);
  if (!clientInfo) {
    return (
      <span className={className}>
        <Translate content="loading" />
        ...
      </span>
    );
  }
  if (children) {
    return <EmptyComponent>{children(clientInfo)}</EmptyComponent>;
  }
  const displayName = getOrderClientDisplayName(clientInfo);
  const address = getOrderClientAddress(clientInfo);
  return (
    <FadeIn className={className}>
      <span>{displayName}</span>
      {showPhone && <span> ({clientInfo.phone})</span>}
      {showAddress && address && (
        <div className="text-gray-600 text-sm">{address}</div>
      )}
      {showCustomerBadge && (
        <EmptyComponent>
          {clientInfo.isCustomer ? (
            <motion.span
              className="bg-green-500/25 ml-2 px-2 py-1 rounded-full font-medium text-green-500 text-xs"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <Translate content="customer" />
            </motion.span>
          ) : (
            <motion.span
              className="bg-orange-500/25 ml-2 px-2 py-1 rounded-full font-medium text-orange-500 text-xs"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <Translate content="guest" />
            </motion.span>
          )}
        </EmptyComponent>
      )}
      {showActions && (
        <div className="flex items-center gap-2 mt-2">
          <HoverScale scale={1.2}>
            <CircleTip
              icon={allIcons.solid.faPhone}
              onClick={() => {
                var a = document.createElement("a");
                a.href = `tel:${clientInfo.phone}`;
                a.click();
              }}
            />
          </HoverScale>
          {clientInfo.latitude && clientInfo.longitude && (
            <HoverScale scale={1.2}>
              <CircleTip
                icon={allIcons.solid.faLocationDot}
                onClick={() => {
                  showPopup(
                    <AnimatedCard className="w-2/3 overflow-hidden">
                      <Card className="overflow-hidden">
                        <CardHeaderForPopup title="Client Location" />
                        <Line />
                        <div className="relative w-full h-[400px]">
                          <MapContainer
                            center={[
                              clientInfo.latitude!,
                              clientInfo.longitude!,
                            ]}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker
                              position={[
                                clientInfo.latitude!,
                                clientInfo.longitude!,
                              ]}
                            >
                              <Popup>
                                {displayName}
                                <br />
                                {clientInfo.wilaya}
                              </Popup>
                            </Marker>
                          </MapContainer>
                        </div>
                      </Card>
                    </AnimatedCard>
                  );
                }}
              />
            </HoverScale>
          )}
        </div>
      )}
    </FadeIn>
  );
};
// Component for displaying wilaya/address only
export const OrderClientLocation = ({
  order,
}: {
  order: Biqpod.Snapbuy.Order;
}) => {
  const clientInfo = useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);
  if (!clientInfo) {
    return <span>...</span>;
  }
  return (
    <span className="italic">
      {clientInfo.wilaya || clientInfo.address || "No location"}
    </span>
  );
};
// Component for actions (phone, map)
export const OrderClientActions = ({
  order,
}: {
  order: Biqpod.Snapbuy.Order;
}) => {
  const clientInfo = useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);
  if (!clientInfo) {
    return null;
  }
  return (
    <div className="flex items-center">
      <HoverScale scale={1.2}>
        <CircleTip
          icon={allIcons.solid.faPhone}
          onClick={() => {
            var a = document.createElement("a");
            a.href = `tel:${clientInfo.phone}`;
            a.click();
          }}
        />
      </HoverScale>
      {clientInfo.latitude && clientInfo.longitude && (
        <HoverScale scale={1.2}>
          <CircleTip
            icon={allIcons.solid.faLocationDot}
            onClick={() => {
              showPopup(
                <AnimatedCard className="w-2/3 overflow-hidden">
                  <Card className="overflow-hidden">
                    <CardHeaderForPopup title="Client Location" />
                    <Line />
                    <div className="relative w-full h-[400px]">
                      <MapContainer
                        center={[clientInfo.latitude!, clientInfo.longitude!]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker
                          position={[
                            clientInfo.latitude!,
                            clientInfo.longitude!,
                          ]}
                        >
                          <Popup>
                            {getOrderClientDisplayName(clientInfo)}
                            <br />
                            {clientInfo.wilaya}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </Card>
                </AnimatedCard>
              );
            }}
          />
        </HoverScale>
      )}
    </div>
  );
};
// Component for displaying phone
export const OrderClientPhone = ({
  order,
}: {
  order: Biqpod.Snapbuy.Order;
}) => {
  const clientInfo = useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);
  if (!clientInfo) {
    return <span>...</span>;
  }
  return <span>{clientInfo.phone}</span>;
};
// Component for displaying address
export const OrderClientAddress = ({
  order,
}: {
  order: Biqpod.Snapbuy.Order;
}) => {
  const clientInfo = useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);
  if (!clientInfo) {
    return <span>...</span>;
  }
  return <span>{clientInfo.address || "No address available"}</span>;
};
// Component for displaying wilaya
export const OrderClientWilaya = ({
  order,
}: {
  order: Biqpod.Snapbuy.Order;
}) => {
  const clientInfo = useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);
  if (!clientInfo || !clientInfo.wilaya) {
    return null;
  }
  return (
    <p>
      <strong>
        <Translate content="wilaya" />:
      </strong>{" "}
      {clientInfo.wilaya}
    </p>
  );
};
// Component for order menu actions (call, maps, etc.)
export const OrderClientMenuActions = ({
  order,
  onViewOrder,
  onAssignAgent,
}: {
  order: Biqpod.Snapbuy.Order;
  onViewOrder?: () => void;
  onAssignAgent?: () => void;
}) => {
  const clientInfo = useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);
  const getMenuItems = () => {
    if (!clientInfo) return [];
    const items = [];
    // View Order Details
    if (onViewOrder) {
      items.push({
        label: "View Order Details",
        defaultIcon: allIcons.solid.faBook,
        click: onViewOrder,
      });
    }
    // Separator
    if (items.length > 0) {
      items.push({ type: "separator" as const });
    }
    // Assign Delivery Agent
    if (onAssignAgent) {
      items.push({
        label: "Assign Delivery Agent",
        defaultIcon: allIcons.solid.faUserPlus,
        click: onAssignAgent,
      });
    }
    // Separator
    if (items.length > 1) {
      items.push({ type: "separator" as const });
    }
    // Call
    items.push({
      label: "Call",
      defaultIcon: allIcons.solid.faPhone,
      click: () => {
        const tel = document.createElement("a");
        tel.href = `tel:${clientInfo.phone}`;
        tel.click();
      },
    });
    // Open in Maps (only if location available)
    if (clientInfo.latitude && clientInfo.longitude) {
      items.push({
        label: "Open in Maps",
        defaultIcon: allIcons.solid.faMapMarkerAlt,
        click: () => {
          showPopup(
            <Card className="w-2/3 overflow-hidden">
              <CardHeaderForPopup title="Client Location" />
              <Line />
              <div className="relative w-full h-[400px]">
                <Map
                  apiKey="7Serp5w3OFR9WkWfsTEW"
                  location={{
                    x: clientInfo.longitude!,
                    y: clientInfo.latitude!,
                  }}
                  zoom={17}
                />
              </div>
            </Card>
          );
        },
      });
    }
    return mergeArray(...items);
  };
  return (
    <CircleTip
      icon={allIcons.solid.faEllipsisV}
      onClick={async ({ clientX, clientY }) => {
        const { openMenu } = await import("@biqpod/app/ui/hooks");
        openMenu({
          x: clientX,
          y: clientY,
          menu: getMenuItems(),
        });
      }}
    />
  );
};
// Simple hook to get client info for custom usage
export const useOrderClientInfo = (order: Biqpod.Snapbuy.Order) => {
  return useAsyncMemo(async () => {
    return await getOrderClientInfo(order);
  }, [order]);
};
