import { Page, Request } from '@playwright/test';
import { randomUUID } from 'crypto';

type WidgetType = 'kpi' | 'chart' | 'table' | 'list';

interface MockRole {
    id: string;
    name: string;
    description: string;
    permissions: string[];
}

interface MockUser {
    id: string;
    email: string;
    username: string;
    fullName: string;
    isEnabled: boolean;
    roles: MockRole[];
    permissions: string[];
}

interface MockCategory {
    id: string;
    name: string;
    description?: string;
}

interface MockProduct {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    categoryId: string;
}

interface MockWidget {
    id: string;
    title: string;
    widgetType: WidgetType;
    description?: string;
    dataKey?: string;
}

interface MockState {
    users: MockUser[];
    roles: MockRole[];
    categories: MockCategory[];
    products: MockProduct[];
    widgets: MockWidget[];
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
};

export async function setupMockApi(page: Page) {
    const state = createInitialState();

    await page.route('**/api/**', async (route) => {
        const request = route.request();

        if (request.method() === 'OPTIONS') {
            await route.fulfill({ status: 204, headers: CORS_HEADERS });
            return;
        }

        try {
            const response = await handleRequest(request, state);
            if (response) {
                await route.fulfill(response);
                return;
            }
        } catch (error) {
            console.error('Mock API handler failed:', error);
            await route.fulfill(jsonResponse({ message: 'Mock handler error' }, 500));
            return;
        }

        await route.fulfill(jsonResponse({ message: 'Not found' }, 404));
    });
}

async function handleRequest(request: Request, state: MockState) {
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method();

    if (method === 'POST' && path === '/auth/login') {
        const body = await parseBody(request);
        const identifier = String(body.identifier ?? '').toLowerCase();
        const password = String(body.password ?? '');
        const user = state.users.find(
            (u) => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier,
        );
        if (!user || password !== 'Passw0rd!') {
            return jsonResponse({ message: 'Invalid credentials' }, 401);
        }
        return jsonResponse({
            accessToken: `mock-access-${randomUUID()}`,
            refreshToken: `mock-refresh-${randomUUID()}`,
            user: serializeUser(user),
        });
    }

    if (method === 'POST' && path === '/auth/logout') {
        return jsonResponse({ message: 'Logged out' });
    }

    if (method === 'POST' && path === '/auth/refresh') {
        return jsonResponse({
            accessToken: `mock-access-${randomUUID()}`,
            refreshToken: `mock-refresh-${randomUUID()}`,
        });
    }

    if (method === 'GET' && path === '/users') {
        return jsonResponse(state.users.map(serializeUser));
    }

    if (method === 'POST' && path === '/users') {
        const body = await parseBody(request);
        const newUser: MockUser = {
            id: randomUUID(),
            fullName: String(body.fullName || 'New User'),
            email: (body.email || '').toLowerCase() || `user-${Date.now()}@cpos.local`,
            username: (body.username || '').toLowerCase() || `user-${Math.floor(Math.random() * 1_000_000)}`,
            isEnabled: true,
            roles: [],
            permissions: [],
        };
        state.users.push(newUser);
        return jsonResponse(serializeUser(newUser), 201);
    }

    if (method === 'PATCH' && path.match(/^\/users\//)) {
        const statusMatch = path.match(/^\/users\/([^/]+)\/status$/);
        if (statusMatch) {
            const user = state.users.find((u) => u.id === statusMatch[1]);
            if (!user) {
                return jsonResponse({ message: 'User not found' }, 404);
            }
            const body = await parseBody(request);
            user.isEnabled = Boolean(body.isEnabled);
            return jsonResponse(serializeUser(user));
        }
    }

    if (method === 'GET' && path === '/rbac/roles') {
        return jsonResponse(state.roles.map(serializeRole));
    }

    if (method === 'POST' && path === '/rbac/roles') {
        const body = await parseBody(request);
        const role: MockRole = {
            id: randomUUID(),
            name: String(body.name || 'Untitled role'),
            description: String(body.description || ''),
            permissions: Array.isArray(body.permissions)
                ? (body.permissions as string[])
                : [],
        };
        state.roles.push(role);
        return jsonResponse(serializeRole(role), 201);
    }

    const rolePathMatch = path.match(/^\/rbac\/roles\/([^/]+)$/);
    if (rolePathMatch) {
        const role = state.roles.find((candidate) => candidate.id === rolePathMatch[1]);
        if (!role) {
            return jsonResponse({ message: 'Role not found' }, 404);
        }
        if (method === 'PATCH') {
            const body = await parseBody(request);
            role.name = String(body.name || role.name);
            role.description = String(body.description || role.description);
            return jsonResponse(serializeRole(role));
        }
        if (method === 'DELETE') {
            state.roles = state.roles.filter((candidate) => candidate.id !== role.id);
            state.users.forEach((user) => {
                user.roles = user.roles.filter((assigned) => assigned.id !== role.id);
                syncPermissions(user);
            });
            return jsonResponse({ message: 'Role deleted' });
        }
    }

    if (method === 'POST' && path === '/rbac/user-roles') {
        const body = await parseBody(request);
        const user = state.users.find((u) => u.id === body.userId);
        const role = state.roles.find((r) => r.id === body.roleId);
        if (!user || !role) {
            return jsonResponse({ message: 'Invalid user or role' }, 400);
        }
        if (!user.roles.some((assigned) => assigned.id === role.id)) {
            user.roles.push(role);
            syncPermissions(user);
        }
        return jsonResponse({ message: 'Role assigned', user: serializeUser(user) });
    }

    if (method === 'DELETE' && path === '/rbac/user-roles') {
        const body = await parseBody(request);
        const user = state.users.find((u) => u.id === body.userId);
        if (!user) {
            return jsonResponse({ message: 'User not found' }, 404);
        }
        user.roles = user.roles.filter((role) => role.id !== body.roleId);
        syncPermissions(user);
        return jsonResponse({ message: 'Role removed', user: serializeUser(user) });
    }

    if (method === 'GET' && path === '/rbac/permissions') {
        const uniquePermissions = Array.from(
            new Set(state.roles.flatMap((role) => role.permissions)),
        ).map((permission, index) => ({ id: `perm-${index}`, name: permission }));
        return jsonResponse(uniquePermissions);
    }

    if (method === 'GET' && path === '/categories') {
        return jsonResponse(paginate(state.categories.map(serializeCategory)));
    }

    if (method === 'POST' && path === '/categories') {
        const body = await parseBody(request);
        const category: MockCategory = {
            id: randomUUID(),
            name: String(body.name || 'New category'),
            description: body.description?.trim() ? String(body.description) : undefined,
        };
        state.categories.unshift(category);
        return jsonResponse(serializeCategory(category), 201);
    }

    const categoryMatch = path.match(/^\/categories\/([^/]+)$/);
    if (categoryMatch) {
        const category = state.categories.find((entry) => entry.id === categoryMatch[1]);
        if (!category) {
            return jsonResponse({ message: 'Category not found' }, 404);
        }
        if (method === 'PATCH') {
            const body = await parseBody(request);
            category.name = String(body.name || category.name);
            category.description = body.description?.trim()
                ? String(body.description)
                : category.description;
            return jsonResponse(serializeCategory(category));
        }
        if (method === 'DELETE') {
            state.categories = state.categories.filter((item) => item.id !== category.id);
            state.products = state.products.map((product) =>
                product.categoryId === category.id ? { ...product, categoryId: '' } : product,
            );
            return jsonResponse({ message: 'Category deleted' });
        }
    }

    if (method === 'GET' && path === '/products') {
        return jsonResponse(
            paginate(state.products.map((product) => serializeProduct(product, state.categories))),
        );
    }

    if (method === 'POST' && path === '/products') {
        const body = await parseBody(request);
        const product: MockProduct = {
            id: randomUUID(),
            name: String(body.name || 'New product'),
            sku: String(body.sku || `SKU-${Math.floor(Math.random() * 1_000)}`),
            price: Number(body.price ?? 0),
            stock: Number(body.stock ?? 0),
            categoryId: String(body.categoryId || state.categories[0]?.id || ''),
        };
        state.products.unshift(product);
        return jsonResponse(serializeProduct(product, state.categories), 201);
    }

    const productMatch = path.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
        const product = state.products.find((entry) => entry.id === productMatch[1]);
        if (!product) {
            return jsonResponse({ message: 'Product not found' }, 404);
        }
        if (method === 'PATCH') {
            const body = await parseBody(request);
            product.name = String(body.name || product.name);
            product.sku = String(body.sku || product.sku);
            product.price = Number(body.price ?? product.price);
            product.stock = Number(body.stock ?? product.stock);
            product.categoryId = String(body.categoryId || product.categoryId);
            return jsonResponse(serializeProduct(product, state.categories));
        }
        if (method === 'DELETE') {
            state.products = state.products.filter((entry) => entry.id !== product.id);
            return jsonResponse({ message: 'Product deleted' });
        }
    }

    if (method === 'GET' && path === '/dashboard/widgets') {
        return jsonResponse(state.widgets);
    }

    return null;
}

function createInitialState(): MockState {
    const roles: MockRole[] = [
        {
            id: 'role-super-admin',
            name: 'Super Admin',
            description: 'Full system access',
            permissions: [
                'product.create',
                'product.read',
                'product.update',
                'product.delete',
                'category.create',
                'category.read',
                'category.update',
                'category.delete',
                'rbac.manage.users',
                'rbac.manage.roles',
                'rbac.manage.userRoles',
                'dashboard.view.products',
                'dashboard.view.categories',
                'dashboard.view.kpis',
            ],
        },
        {
            id: 'role-product-admin',
            name: 'Product Admin',
            description: 'Manages catalog assortment',
            permissions: ['product.read', 'product.update', 'dashboard.view.products'],
        },
        {
            id: 'role-category-admin',
            name: 'Category Admin',
            description: 'Manages categories',
            permissions: ['category.read', 'dashboard.view.categories'],
        },
    ];

    const categories: MockCategory[] = [
        { id: 'cat-devices', name: 'POS Devices', description: 'Terminals, kiosks, peripherals' },
        { id: 'cat-software', name: 'Cloud Software', description: 'Subscriptions and services' },
        { id: 'cat-accessories', name: 'Accessories', description: 'Cables, stands and more' },
    ];

    const products: MockProduct[] = [
        {
            id: 'prod-kds-200',
            name: 'Kitchen Display Suite',
            sku: 'KDS-200',
            price: 1299,
            stock: 32,
            categoryId: categories[0].id,
        },
        {
            id: 'prod-pos-elite',
            name: 'Elite POS Terminal',
            sku: 'POS-ELT',
            price: 1899,
            stock: 18,
            categoryId: categories[0].id,
        },
        {
            id: 'prod-analytics',
            name: 'Analytics Cloud License',
            sku: 'ANL-CLD',
            price: 299,
            stock: 120,
            categoryId: categories[1].id,
        },
    ];

    const users: MockUser[] = [
        createUser({
            id: 'user-admin',
            email: 'admin@cpos.local',
            username: 'admin',
            fullName: 'Admin User',
            roles: [roles[0]],
        }),
        createUser({
            id: 'user-product',
            email: 'product@cpos.local',
            username: 'product',
            fullName: 'Product Admin',
            roles: [roles[1]],
        }),
        createUser({
            id: 'user-category',
            email: 'category@cpos.local',
            username: 'category',
            fullName: 'Category Admin',
            roles: [roles[2]],
        }),
    ];

    const widgets: MockWidget[] = [
        {
            id: 'widget-revenue',
            title: 'Monthly Revenue',
            widgetType: 'kpi',
            description: 'Trailing 30 days',
            dataKey: 'revenue',
        },
        {
            id: 'widget-orders',
            title: 'Orders Processed',
            widgetType: 'kpi',
            description: 'All channels',
            dataKey: 'orders',
        },
        {
            id: 'widget-terminals',
            title: 'Active Terminals',
            widgetType: 'kpi',
            description: 'Deployed devices',
            dataKey: 'terminals',
        },
        {
            id: 'widget-chart',
            title: 'Product Mix',
            widgetType: 'chart',
            description: 'Top performing categories',
            dataKey: 'productMix',
        },
        {
            id: 'widget-table',
            title: 'Category Performance',
            widgetType: 'table',
            description: 'Week over week movement',
            dataKey: 'categoryPerformance',
        },
    ];

    return { users, roles, categories, products, widgets };
}

function createUser({
    id,
    email,
    username,
    fullName,
    roles = [],
}: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    roles?: MockRole[];
}): MockUser {
    const user: MockUser = {
        id,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        fullName,
        isEnabled: true,
        roles: [...roles],
        permissions: [],
    };
    syncPermissions(user);
    return user;
}

function syncPermissions(user: MockUser) {
    const permissions = new Set<string>();
    user.roles.forEach((role) => {
        role.permissions.forEach((permission) => permissions.add(permission));
    });
    user.permissions = Array.from(permissions);
}

function serializeUser(user: MockUser) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        isEnabled: user.isEnabled,
        roles: user.roles.map(serializeRole),
        permissions: [...user.permissions],
    };
}

function serializeRole(role: MockRole) {
    return {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((permission, index) => ({
            id: `${role.id}-perm-${index}`,
            name: permission,
        })),
    };
}

function serializeCategory(category: MockCategory) {
    return { ...category };
}

function serializeProduct(product: MockProduct, categories: MockCategory[]) {
    const category = categories.find((entry) => entry.id === product.categoryId);
    return {
        ...product,
        category: category ? serializeCategory(category) : undefined,
    };
}

function paginate<T>(items: T[]) {
    return {
        data: items,
        total: items.length,
    };
}

async function parseBody(request: Request) {
    const raw = request.postData();
    if (!raw) return {} as Record<string, unknown>;
    try {
        return JSON.parse(raw);
    } catch {
        return {} as Record<string, unknown>;
    }
}

function jsonResponse(data: unknown, status = 200) {
    return {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    };
}
