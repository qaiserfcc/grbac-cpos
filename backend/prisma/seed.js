'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const client_1 = require('@prisma/client');
const bcryptjs_1 = __importDefault(require('bcryptjs'));
const prisma = new client_1.PrismaClient();
const roles = [
  { name: 'Super Admin', description: 'Full system access' },
  { name: 'Product Admin', description: 'Manage products and related widgets' },
  { name: 'Category Admin', description: 'Manage categories and related widgets' },
];
const permissions = [
  {
    name: 'product.create',
    module: 'product',
    action: 'create',
    description: 'Create new product',
  },
  { name: 'product.read', module: 'product', action: 'read', description: 'Read product data' },
  { name: 'product.update', module: 'product', action: 'update', description: 'Update product' },
  { name: 'product.delete', module: 'product', action: 'delete', description: 'Delete product' },
  {
    name: 'category.create',
    module: 'category',
    action: 'create',
    description: 'Create new category',
  },
  { name: 'category.read', module: 'category', action: 'read', description: 'Read category data' },
  { name: 'category.update', module: 'category', action: 'update', description: 'Update category' },
  { name: 'category.delete', module: 'category', action: 'delete', description: 'Delete category' },
  {
    name: 'rbac.manage.roles',
    module: 'rbac',
    action: 'manage',
    description: 'Manage system roles',
  },
  {
    name: 'rbac.manage.users',
    module: 'rbac',
    action: 'manage',
    description: 'Manage users and their roles',
  },
  {
    name: 'dashboard.view.products',
    module: 'dashboard',
    action: 'view',
    description: 'View product-related widgets',
  },
  {
    name: 'dashboard.view.categories',
    module: 'dashboard',
    action: 'view',
    description: 'View category-related widgets',
  },
];
const widgets = [
  {
    title: 'Top Selling Products',
    widgetKey: 'widget_products_top',
    widgetType: 'chart',
    dataSource: '/api/products/top',
    defaultVisible: true,
  },
  {
    title: 'Low Stock Alerts',
    widgetKey: 'widget_products_low_stock',
    widgetType: 'table',
    dataSource: '/api/products/lowstock',
    defaultVisible: true,
  },
  {
    title: 'Category Summary',
    widgetKey: 'widget_categories_summary',
    widgetType: 'chart',
    dataSource: '/api/categories/summary',
    defaultVisible: true,
  },
];
const rolePermissionAssignments = {
  'Super Admin': permissions.map((p) => p.name),
  'Product Admin': [
    'product.create',
    'product.read',
    'product.update',
    'product.delete',
    'dashboard.view.products',
  ],
  'Category Admin': [
    'category.create',
    'category.read',
    'category.update',
    'category.delete',
    'dashboard.view.categories',
  ],
};
const roleWidgetAssignments = {
  'Super Admin': widgets.map((w) => w.widgetKey),
  'Product Admin': ['widget_products_top', 'widget_products_low_stock'],
  'Category Admin': ['widget_categories_summary'],
};
async function main() {
  await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: role,
        create: role,
      }),
    ),
  );
  await Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission,
      }),
    ),
  );
  await Promise.all(
    widgets.map((widget) =>
      prisma.dashboardWidget.upsert({
        where: { widgetKey: widget.widgetKey },
        update: widget,
        create: widget,
      }),
    ),
  );
  const [roleRecords, permissionRecords, widgetRecords] = await Promise.all([
    prisma.role.findMany(),
    prisma.permission.findMany(),
    prisma.dashboardWidget.findMany(),
  ]);
  const roleByName = {};
  roleRecords.forEach((role) => {
    roleByName[role.name] = role;
  });
  const permissionByName = {};
  permissionRecords.forEach((permission) => {
    permissionByName[permission.name] = permission;
  });
  const widgetByKey = {};
  widgetRecords.forEach((widget) => {
    widgetByKey[widget.widgetKey] = widget;
  });
  const rolePermissionData = Object.entries(rolePermissionAssignments).flatMap(
    ([roleName, permissionNames]) => {
      const role = roleByName[roleName];
      if (!role) return [];
      return permissionNames
        .map((permissionName) => permissionByName[permissionName])
        .filter(Boolean)
        .map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        }));
    },
  );
  if (rolePermissionData.length > 0) {
    await prisma.rolePermission.createMany({ data: rolePermissionData, skipDuplicates: true });
  }
  const roleWidgetData = Object.entries(roleWidgetAssignments).flatMap(([roleName, widgetKeys]) => {
    const role = roleByName[roleName];
    if (!role) return [];
    return widgetKeys
      .map((key) => widgetByKey[key])
      .filter(Boolean)
      .map((widget) => ({
        roleId: role.id,
        widgetId: widget.id,
      }));
  });
  if (roleWidgetData.length > 0) {
    await prisma.roleWidget.createMany({ data: roleWidgetData, skipDuplicates: true });
  }
  const passwordHash = await bcryptjs_1.default.hash('Passw0rd!', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@cpos.local' },
    update: { passwordHash },
    create: {
      username: 'superadmin',
      email: 'admin@cpos.local',
      passwordHash,
      fullName: 'CPOS Super Admin',
    },
  });
  const productAdmin = await prisma.user.upsert({
    where: { email: 'product@cpos.local' },
    update: {},
    create: {
      username: 'productadmin',
      email: 'product@cpos.local',
      passwordHash,
      fullName: 'Product Admin',
    },
  });
  const categoryAdmin = await prisma.user.upsert({
    where: { email: 'category@cpos.local' },
    update: {},
    create: {
      username: 'categoryadmin',
      email: 'category@cpos.local',
      passwordHash,
      fullName: 'Category Admin',
    },
  });
  const userRoleData = [
    { userId: superAdmin.id, roleId: roleByName['Super Admin'].id },
    { userId: productAdmin.id, roleId: roleByName['Product Admin'].id },
    { userId: categoryAdmin.id, roleId: roleByName['Category Admin'].id },
  ];
  await prisma.userRole.createMany({ data: userRoleData, skipDuplicates: true });
  console.info('Database seeded successfully');
}
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
