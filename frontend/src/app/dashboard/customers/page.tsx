'use client';

import useSWR from 'swr';
import { Plus, Pencil, Trash2, RefreshCcw, Users, History } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { del, get, post, put } from '@/lib/api';
import type { Customer, Sale } from '@/types/rbac';
import { customerSchema, type CustomerSchema } from '@/lib/validators';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FALLBACK_CUSTOMERS } from '@/data/fallbacks';
import { HasPermission } from '@/components/rbac/HasPermission';

const fetchCustomers = ([path, token]: [string, string]) =>
    get<Customer[]>(path, { accessToken: token });

function NoAccessMessage() {
    return (
        <div className="glass rounded-2xl border border-dashed border-white/30 p-10 text-center text-white/70 backdrop-blur-md">
            <Users className="mx-auto mb-4 h-10 w-10 text-white/40" />
            <p className="text-lg font-semibold text-white">Customers unavailable</p>
            <p className="text-sm">You do not have permission to view customer data.</p>
        </div>
    );
}

export default function CustomersPage() {
    const { tokens, hasPermission } = useAuth();
    const canCreate = hasPermission('customer.create');
    const canUpdate = hasPermission('customer.update');
    const canDelete = hasPermission('customer.delete');

    const { data, error, isLoading, mutate } = useSWR(
        tokens?.accessToken ? ['/customers', tokens.accessToken] : null,
        fetchCustomers,
        { revalidateOnFocus: false },
    );

    const customers = data || FALLBACK_CUSTOMERS;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [viewingHistory, setViewingHistory] = useState<Customer | null>(null);

    const createForm = useForm<CustomerSchema>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            loyaltyTier: '',
            isVip: false,
        },
    });

    const editForm = useForm<CustomerSchema>({
        resolver: zodResolver(customerSchema),
    });

    const onCreate = async (formData: CustomerSchema) => {
        if (!tokens?.accessToken) return;
        try {
            await post('/customers', formData, { accessToken: tokens.accessToken });
            mutate();
            setIsCreateModalOpen(false);
            createForm.reset();
        } catch (error) {
            console.error('Failed to create customer:', error);
        }
    };

    const onEdit = async (formData: CustomerSchema) => {
        if (!editingCustomer || !tokens?.accessToken) return;
        try {
            await put(`/customers/${editingCustomer.id}`, formData, { accessToken: tokens.accessToken });
            mutate();
            setEditingCustomer(null);
            editForm.reset();
        } catch (error) {
            console.error('Failed to update customer:', error);
        }
    };

    const onDelete = async () => {
        if (!deletingCustomer || !tokens?.accessToken) return;
        try {
            await del(`/customers/${deletingCustomer.id}`, { accessToken: tokens.accessToken });
            mutate();
            setDeletingCustomer(null);
        } catch (error) {
            console.error('Failed to delete customer:', error);
        }
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        editForm.reset({
            externalId: customer.externalId || '',
            fullName: customer.fullName,
            email: customer.email || '',
            phone: customer.phone || '',
            loyaltyTier: customer.loyaltyTier || '',
            isVip: customer.isVip,
        });
    };

    const fetchHistory = async (customerId: string) => {
        if (!tokens?.accessToken) return [];
        try {
            const response = await get<Sale[]>(`/customers/${customerId}/history`, { accessToken: tokens.accessToken });
            return response;
        } catch (error) {
            console.error('Failed to fetch history:', error);
            return [];
        }
    };

    if (!hasPermission('customer.read')) {
        return <NoAccessMessage />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Customers</h1>
                    <p className="text-white/70">Manage customer accounts and loyalty programs</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => mutate()}
                        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                    </button>
                    <HasPermission permission="customer.create">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Add Customer
                        </button>
                    </HasPermission>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                    Failed to load customers. Using fallback data.
                </div>
            )}

            <div className="glass rounded-2xl border border-white/20 backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-white/10">
                            <tr className="text-left text-sm font-medium text-white/70">
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Loyalty Tier</th>
                                <th className="px-6 py-4">VIP</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {customers.map((customer) => (
                                <tr key={customer.id} className="text-white">
                                    <td className="px-6 py-4">{customer.fullName}</td>
                                    <td className="px-6 py-4">{customer.email || '-'}</td>
                                    <td className="px-6 py-4">{customer.phone || '-'}</td>
                                    <td className="px-6 py-4">{customer.loyaltyTier || '-'}</td>
                                    <td className="px-6 py-4">
                                        {customer.isVip ? (
                                            <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                                                VIP
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setViewingHistory(customer)}
                                                className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                                                title="View Purchase History"
                                            >
                                                <History className="h-4 w-4" />
                                            </button>
                                            <HasPermission permission="customer.update">
                                                <button
                                                    onClick={() => openEditModal(customer)}
                                                    className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                                                    title="Edit Customer"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            </HasPermission>
                                            <HasPermission permission="customer.delete">
                                                <button
                                                    onClick={() => setDeletingCustomer(customer)}
                                                    className="rounded p-1 text-red-400 hover:bg-red-500/20"
                                                    title="Delete Customer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </HasPermission>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Add Customer"
            >
                <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white">Full Name</label>
                        <input
                            {...createForm.register('fullName')}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter full name"
                        />
                        {createForm.formState.errors.fullName && (
                            <p className="mt-1 text-sm text-red-400">{createForm.formState.errors.fullName.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white">Email</label>
                        <input
                            {...createForm.register('email')}
                            type="email"
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter email (optional)"
                        />
                        {createForm.formState.errors.email && (
                            <p className="mt-1 text-sm text-red-400">{createForm.formState.errors.email.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white">Phone</label>
                        <input
                            {...createForm.register('phone')}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter phone (optional)"
                        />
                        {createForm.formState.errors.phone && (
                            <p className="mt-1 text-sm text-red-400">{createForm.formState.errors.phone.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white">Loyalty Tier</label>
                        <input
                            {...createForm.register('loyaltyTier')}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter loyalty tier (optional)"
                        />
                        {createForm.formState.errors.loyaltyTier && (
                            <p className="mt-1 text-sm text-red-400">{createForm.formState.errors.loyaltyTier.message}</p>
                        )}
                    </div>
                    <div className="flex items-center">
                        <input
                            {...createForm.register('isVip')}
                            type="checkbox"
                            className="rounded border-white/20 bg-white/10 text-blue-600"
                        />
                        <label className="ml-2 text-sm text-white">VIP Customer</label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingCustomer}
                onClose={() => setEditingCustomer(null)}
                title="Edit Customer"
            >
                <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white">External ID</label>
                        <input
                            {...editForm.register('externalId')}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter external ID (optional)"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white">Full Name</label>
                        <input
                            {...editForm.register('fullName')}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter full name"
                        />
                        {editForm.formState.errors.fullName && (
                            <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.fullName.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white">Email</label>
                        <input
                            {...editForm.register('email')}
                            type="email"
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter email (optional)"
                        />
                        {editForm.formState.errors.email && (
                            <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.email.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white">Phone</label>
                        <input
                            {...editForm.register('phone')}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter phone (optional)"
                        />
                        {editForm.formState.errors.phone && (
                            <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.phone.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white">Loyalty Tier</label>
                        <input
                            {...editForm.register('loyaltyTier')}
                            className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50"
                            placeholder="Enter loyalty tier (optional)"
                        />
                        {editForm.formState.errors.loyaltyTier && (
                            <p className="mt-1 text-sm text-red-400">{editForm.formState.errors.loyaltyTier.message}</p>
                        )}
                    </div>
                    <div className="flex items-center">
                        <input
                            {...editForm.register('isVip')}
                            type="checkbox"
                            className="rounded border-white/20 bg-white/10 text-blue-600"
                        />
                        <label className="ml-2 text-sm text-white">VIP Customer</label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setEditingCustomer(null)}
                            className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            Update
                        </button>
                    </div>
                </form>
            </Modal>

            {/* History Modal */}
            <Modal
                isOpen={!!viewingHistory}
                onClose={() => setViewingHistory(null)}
                title={`Purchase History - ${viewingHistory?.fullName}`}
            >
                <CustomerHistory customerId={viewingHistory?.id || ''} fetchHistory={fetchHistory} />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deletingCustomer}
                onClose={() => setDeletingCustomer(null)}
                onConfirm={onDelete}
                title="Delete Customer"
                message={`Are you sure you want to delete ${deletingCustomer?.fullName}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}

function CustomerHistory({ customerId, fetchHistory }: { customerId: string; fetchHistory: (id: string) => Promise<Sale[]> }) {
    const { data: history, isLoading } = useSWR(
        customerId ? ['customer-history', customerId] : null,
        ([, id]) => fetchHistory(id),
    );

    if (isLoading) {
        return <div className="text-white">Loading history...</div>;
    }

    if (!history || history.length === 0) {
        return <div className="text-white/70">No purchase history found.</div>;
    }

    return (
        <div className="space-y-4">
            {history.map((sale) => (
                <div key={sale.id} className="rounded-lg border border-white/20 bg-white/5 p-4">
                    <div className="flex justify-between text-white">
                        <span>Sale #{sale.id.slice(-8)}</span>
                        <span>${sale.total.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-white/70">
                        {new Date(sale.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-2 space-y-1">
                        {sale.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm text-white/70">
                                <span>{item.product.name} x{item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
