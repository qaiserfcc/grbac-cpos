import { jest } from '@jest/globals';

type MockFn = ReturnType<typeof jest.fn>;
type MockCollection = Record<string, MockFn>;

function createSection(methods: string[]): MockCollection {
  return methods.reduce<MockCollection>((acc, method) => {
    acc[method] = jest.fn();
    return acc;
  }, {});
}

const userMethods = ['findFirst', 'create'];
const sessionMethods = ['create', 'findUnique', 'update', 'deleteMany'];
const roleMethods = ['findMany', 'findUnique', 'create', 'update', 'delete'];
const rolePermissionMethods = ['createMany', 'deleteMany'];
const permissionMethods = ['findMany'];
const userRoleMethods = ['findMany', 'createMany', 'upsert', 'deleteMany'];
const productMethods = ['findMany', 'create', 'findUnique', 'update', 'delete'];
const categoryMethods = ['findMany'];

export const prismaMock = {
  user: createSection(userMethods),
  session: createSection(sessionMethods),
  role: createSection(roleMethods),
  rolePermission: createSection(rolePermissionMethods),
  permission: createSection(permissionMethods),
  userRole: createSection(userRoleMethods),
  product: createSection(productMethods),
  category: createSection(categoryMethods),
};

export function resetPrismaMock() {
  Object.values(prismaMock).forEach((section) => {
    Object.values(section).forEach((fn) => fn.mockReset());
  });
}
