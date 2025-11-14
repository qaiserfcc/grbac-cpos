import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  fullName: z.string().min(1),
  roles: z.array(z.string()).min(1, "Select at least one role"),
});

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  categoryId: z.string().min(1, "Select a category"),
});

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()).nonempty(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ProductSchema = z.infer<typeof productSchema>;
export type CategorySchema = z.infer<typeof categorySchema>;
export type RoleSchema = z.infer<typeof roleSchema>;
