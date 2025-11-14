export type PermissionName =
  | "product.create"
  | "product.read"
  | "product.update"
  | "product.delete"
  | "category.create"
  | "category.read"
  | "category.update"
  | "category.delete"
  | "rbac.manage.roles"
  | "rbac.manage.userRoles"
  | "dashboard.view.products"
  | "dashboard.view.categories"
  | "dashboard.view.kpis";

export interface Permission {
  id: string;
  name: PermissionName | string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  roles: {
    id: string;
    name: string;
    description?: string;
  }[];
  permissions: PermissionName[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  widgetType: "kpi" | "chart" | "table" | "list";
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}
