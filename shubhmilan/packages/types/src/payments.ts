export interface Plan {
  id: string;
  name: string;
  priceInr: number;
  durationDays: number;
  features: string[];
  active: boolean;
}

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: 'INR';
  receipt: string;
  keyId: string;
}
