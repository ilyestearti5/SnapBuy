import { snapbuyApi } from "../apis";
// Type for unified client/customer information display
export interface OrderClientInfo {
  firstname?: string;
  lastname?: string;
  phone: string;
  address?: string;
  wilaya?: string;
  latitude?: number;
  longitude?: number;
  isCustomer: boolean; // true if data comes from customer, false if from client
}
// Utility function to get client or customer information from an order
export const getOrderClientInfo = async (
  order: SnapBuy.Order
): Promise<OrderClientInfo | null> => {
  try {
    // If order has client information, use it directly
    if (order.customer) {
      const customer = await snapbuyApi.getCustomer(order.customer);
      if (customer) {
        return {
          firstname: customer.firstname,
          lastname: customer.lastname,
          phone: customer.phone,
          isCustomer: true,
          ...order.place,
        };
      }
    }
    if (order.client) {
      return {
        firstname: order.client.firstname,
        lastname: order.client.lastname,
        phone: order.client.phone,
        isCustomer: false,
        ...order.place,
      };
    }
    // If order has customer ID, fetch customer information
    return null;
  } catch (error) {
    console.error("Error getting order client info:", error);
    return null;
  }
};
// Helper function to get display name
export const getOrderClientDisplayName = (
  clientInfo: OrderClientInfo | null
): string => {
  if (!clientInfo) return "Unknown Client";
  const { firstname, lastname } = clientInfo;
  if (firstname && lastname) {
    return `${firstname} ${lastname}`;
  }
  if (firstname) {
    return firstname;
  }
  if (lastname) {
    return lastname;
  }
  return "Unknown Client";
};
// Helper function to get address display
export const getOrderClientAddress = (
  clientInfo: OrderClientInfo | null
): string => {
  if (!clientInfo) return "";
  const parts = [];
  if (clientInfo.address) parts.push(clientInfo.address);
  if (clientInfo.wilaya) parts.push(clientInfo.wilaya);
  return parts.join(", ");
};
