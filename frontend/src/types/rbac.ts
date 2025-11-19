export type PermissionName =
  | 'product.create'
  | 'product.read'
  | 'product.update'
  | 'product.delete'
  | 'category.create'
  | 'category.read'
  | 'category.update'
  | 'category.delete'
  | 'customer.create'
  | 'customer.read'
  | 'customer.update'
  | 'customer.delete'
  | 'rbac.manage.roles'
  | 'rbac.manage.userRoles'
  | 'dashboard.view.products'
  | 'dashboard.view.categories'
  | 'dashboard.view.kpis';

export interface Permission {
  id: string;
  name: PermissionName | string;
  description?: string;
  resource?: string;
  action?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Widget {
  id: string;
  name: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  email: string;
  fullName?: string;
  isEnabled?: boolean;
  createdAt?: string;
  roles?: Role[];
  permissions?: string[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  widgetType: 'kpi' | 'chart' | 'table' | 'list';
  description?: string;
  dataKey?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  categoryId: string;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Customer {
  id: string;
  externalId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  loyaltyTier?: string;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Sale {
  id: string;
  customerId: string;
  total: number;
  createdAt: string;
  items: SaleItem[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roles: string[];
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

export interface UpdateUserStatusRequest {
  isEnabled: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
}

export interface UpdateRoleRequest {
  name: string;
  description: string;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
}

export interface UpdateRolePermissionsRequest {
  permissions: string[];
}

export interface UpdateRoleWidgetsRequest {
  widgets: string[];
}

export interface ErrorResponse {
  message: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}
