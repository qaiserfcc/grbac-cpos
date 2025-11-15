import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(3, "Identifier must be at least 3 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  fullName: z.string().min(1, "Full name is required"),
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

export const updateUserRolesSchema = z.object({
  roles: z.array(z.string().uuid()).min(1, "Select at least one role"),
});

export const updateUserStatusSchema = z.object({
  isEnabled: z.boolean(),
});

export const createRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
});

export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string().uuid()).min(1, "Select at least one permission"),
});

export const updateRoleWidgetsSchema = z.object({
  widgets: z.array(z.string().uuid()).min(1, "Select at least one widget"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ProductSchema = z.infer<typeof productSchema>;
export type CategorySchema = z.infer<typeof categorySchema>;
export type RoleSchema = z.infer<typeof roleSchema>;
export type UpdateUserRolesSchema = z.infer<typeof updateUserRolesSchema>;
export type UpdateUserStatusSchema = z.infer<typeof updateUserStatusSchema>;
export type CreateRoleSchema = z.infer<typeof createRoleSchema>;
export type UpdateRoleSchema = z.infer<typeof updateRoleSchema>;
export type AssignRoleSchema = z.infer<typeof assignRoleSchema>;
export type UpdateRolePermissionsSchema = z.infer<typeof updateRolePermissionsSchema>;
export type UpdateRoleWidgetsSchema = z.infer<typeof updateRoleWidgetsSchema>;
