export type UserRole = 'customer' | 'admin' | 'kitchen' | 'delivery';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  label: 'Home' | 'Office' | 'Other';
  addressLine: string;
  apartment?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  displayOrder: number;
  active: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string[];
  price: number;
  discountedPrice?: number;
  preparationTime: number; // in minutes
  calories?: number;
  spicyLevel: 0 | 1 | 2 | 3;
  vegOrNonveg: 'veg' | 'non-veg';
  bestseller: boolean;
  featured: boolean;
  image: string;
  galleryImages: string[];
  active: boolean;
  rating?: number;
  createdAt: Date;
}

export interface Inventory {
  id: string;
  ingredientName: string;
  availableQuantity: number;
  unit: string; // e.g., 'kg', 'g', 'ml', 'pcs'
  minimumQuantity: number;
  reorderLevel: number;
  supplier?: string;
  updatedAt: Date;
}

export interface InventoryLog {
  id: string;
  inventoryId: string;
  quantityChanged: number;
  action: 'addition' | 'deduction' | 'correction';
  reason: string;
  adminId: string;
  timestamp: Date;
}

export type OrderStatus =
  | 'received'
  | 'accepted'
  | 'preparing'
  | 'packed'
  | 'out_for_delivery'
  | 'in_transit'
  | 'near_doorstep'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  couponId?: string;
  paymentStatus: PaymentStatus;
  paymentMethod: 'upi' | 'card' | 'net_banking' | 'wallet' | 'cod';
  orderStatus: OrderStatus;
  estimatedDelivery?: Date;
  notes?: string;
  otp?: string;
  cancellationReason?: string;
  items?: any[];
  customerName?: string;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  // Delivery address (joined from addresses table)
  addressLine?: string;
  apartment?: string;
  city?: string;
  pincode?: string;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: string;
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus: PaymentStatus;
  amount: number;
  method: string;
  createdAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  percentage: number;
  maxDiscount: number;
  expiryDate: Date;
  minimumOrder: number;
  active: boolean;
}

export interface Offer {
  id: string;
  title: string;
  subtitle?: string;
  bannerImage: string;
  startDate: Date;
  endDate: Date;
  active: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment?: string;
  images: string[];
  createdAt: Date;
}

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
}

export interface DeliveryPartner {
  id: string;
  fullName: string;
  phone: string;
  vehicleNumber: string;
  active: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  assignedOrders: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
