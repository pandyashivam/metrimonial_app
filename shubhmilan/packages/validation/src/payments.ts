import { z } from 'zod';

export const CreateOrderInput = z
  .object({
    planId: z.string().min(1),
  })
  .strict();

export const VerifyPaymentInput = z
  .object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  })
  .strict();
