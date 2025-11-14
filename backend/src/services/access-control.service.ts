import { prisma } from '../config/database';

export async function getUserRoles(userId: string): Promise<{ id: string; name: string; description: string | null }[]> {
  const records = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return records.map((record: (typeof records)[number]) => ({
    id: record.role.id,
    name: record.role.name,
    description: record.role.description,
  }));
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const roleRecords = await prisma.userRole.findMany({ where: { userId } });
  const roleIds = roleRecords.map((record: (typeof roleRecords)[number]) => record.roleId);
  if (roleIds.length === 0) return [];
  const permissionRecords = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds } },
    include: { permission: true },
  });
  const permissionNames: string[] = permissionRecords.map(
    (record: (typeof permissionRecords)[number]) => record.permission.name,
  );
  return Array.from(new Set(permissionNames));
}

export async function getUserContext(userId: string): Promise<{ roles: { id: string; name: string; description: string | null }[]; permissions: string[] }> {
  const [roles, permissions] = await Promise.all([getUserRoles(userId), getUserPermissions(userId)]);
  return { roles, permissions };
}

export async function getWidgetsForUser(userId: string) {
  const [defaultWidgets, roleRecords] = await Promise.all([
    prisma.dashboardWidget.findMany({ where: { defaultVisible: true } }),
    prisma.userRole.findMany({ where: { userId } }),
  ]);

  const roleIds = roleRecords.map((record: (typeof roleRecords)[number]) => record.roleId);
  const roleWidgets = roleIds.length
    ? await prisma.roleWidget.findMany({
        where: { roleId: { in: roleIds }, visible: true },
        include: { widget: true },
      })
    : [];

  const widgets = [
    ...defaultWidgets.map((widget: (typeof defaultWidgets)[number]) => widget),
    ...roleWidgets.map((record: (typeof roleWidgets)[number]) => record.widget),
  ];

  const unique = new Map<string, (typeof widgets)[number]>();
  widgets.forEach((widget) => {
    unique.set(widget.widgetKey, widget);
  });

  return Array.from(unique.values());
}
