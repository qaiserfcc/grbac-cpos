'use client';

import useSWR from 'swr';
import { Plus, Pencil, Trash2, RefreshCcw, PackageSearch } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { del, get, post, patch } from '@/lib/api';
import type { Category, PaginatedResult, Product } from '@/types/rbac';
import { productSchema, type ProductSchema } from '@/lib/validators';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from '@/data/fallbacks';
import { HasPermission } from '@/components/rbac/HasPermission';

const fetchProducts = ([path, token]: [string, string]) =>
  get<PaginatedResult<Product>>(path, { accessToken: token });

const fetchCategories = ([path, token]: [string, string]) =>
  get<PaginatedResult<Category>>(path, { accessToken: token });
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function NoAccessMessage() {
  return (
    <div className="glass rounded-2xl border border-dashed border-white/30 p-10 text-center text-white/70 backdrop-blur-md">
      <PackageSearch className="mx-auto mb-4 h-10 w-10 text-white/40" />
      <p className="text-lg font-semibold text-white">Products unavailable</p>
      <p className="text-sm">You do not have permission to view product inventory.</p>
    </div>
  );
}

export default function ProductsPage() {
  const { tokens, hasPermission } = useAuth();
  const canCreate = hasPermission('product.create');
  const canUpdate = hasPermission('product.update');
  const canDelete = hasPermission('product.delete');

  const { data, error, isLoading, mutate } = useSWR(
    tokens?.accessToken ? ['/products', tokens.accessToken] : null,
    fetchProducts,
    { revalidateOnFocus: false },
  );

  const { data: categoriesResponse } = useSWR(
    tokens?.accessToken ? ['/categories', tokens.accessToken] : null,
    fetchCategories,
    { revalidateOnFocus: false },
  );

  const products = useMemo(() => data?.data ?? FALLBACK_PRODUCTS, [data]);
  const categories = useMemo(
    () => categoriesResponse?.data ?? FALLBACK_CATEGORIES,
    [categoriesResponse],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tempIdRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      stock: 0,
      categoryId: '',
    },
  });

  const snapshotData = () => (data ? { ...data, data: [...data.data] } : undefined);

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
  };

  const openCreateModal = () => {
    if (!canCreate) return;
    setEditingProduct(null);
    setFormError(null);
    reset({
      name: '',
      sku: '',
      price: 0,
      stock: 0,
      categoryId: categories[0]?.id ?? '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    if (!canUpdate) return;
    setEditingProduct(product);
    setFormError(null);
    reset({
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
    });
    setIsModalOpen(true);
  };

  const nextTempId = () => {
    tempIdRef.current += 1;
    return `tmp-${tempIdRef.current}`;
  };

  const upsertProduct = async (values: ProductSchema) => {
    if (!tokens?.accessToken) {
      setFormError('Missing access token. Please re-authenticate.');
      return;
    }

    const baseSnapshot = snapshotData();
    const selectedCategory = categories.find((cat) => cat.id === values.categoryId);

    const provisionalId = editingProduct?.id ?? crypto.randomUUID?.() ?? nextTempId();
    const optimisticRecord: Product = {
      id: provisionalId,
      ...values,
      category: selectedCategory,
    };

    const optimisticData = (() => {
      const current = baseSnapshot ?? { data: FALLBACK_PRODUCTS, total: FALLBACK_PRODUCTS.length };
      if (editingProduct) {
        return {
          ...current,
          data: current.data.map((product) =>
            product.id === editingProduct.id ? optimisticRecord : product,
          ),
        };
      }
      return {
        ...current,
        data: [optimisticRecord, ...current.data],
        total: current.total + 1,
      };
    })();

    await mutate(optimisticData, { revalidate: false, populateCache: true });

    try {
      const payload = editingProduct
        ? await patch<Product>(`/products/${editingProduct.id}`, values, {
            accessToken: tokens.accessToken,
          })
        : await post<Product>('/products', values, {
            accessToken: tokens.accessToken,
          });

      const hydratedPayload = {
        ...payload,
        category: payload.category ?? selectedCategory,
      };

      await mutate(
        (current) => {
          const safe = current ?? { data: [], total: 0 };
          if (editingProduct) {
            return {
              ...safe,
              data: safe.data.map((product) =>
                product.id === editingProduct.id ? hydratedPayload : product,
              ),
            };
          }
          const exists = safe.data.some((product) => product.id === hydratedPayload.id);
          const nextData = exists
            ? safe.data.map((product) =>
                product.id === hydratedPayload.id ? hydratedPayload : product,
              )
            : [hydratedPayload, ...safe.data];
          return {
            ...safe,
            data: nextData,
            total: exists ? safe.total : safe.total + 1,
          };
        },
        { revalidate: false, populateCache: true },
      );

      setIsModalOpen(false);
      setEditingProduct(null);
      reset();
      setFormError(null);
      await mutate();
    } catch (err) {
      await mutate(baseSnapshot, { revalidate: false, populateCache: true });
      setFormError(err instanceof Error ? err.message : 'Unable to save product');
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    await upsertProduct(values);
  });

  const requestDelete = (product: Product) => {
    if (!canDelete) return;
    setDeleteTarget(product);
    setDeleteError(null);
  };

  const dismissDeleteDialog = () => {
    if (isDeleting) return;
    setDeleteError(null);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!tokens?.accessToken) {
      setDeleteError('Missing access token. Please re-authenticate.');
      return;
    }
    setIsDeleting(true);
    const baseSnapshot = snapshotData();
    const targetId = deleteTarget.id;
    const optimisticData = (() => {
      const current = baseSnapshot ?? { data: FALLBACK_PRODUCTS, total: FALLBACK_PRODUCTS.length };
      const filtered = current.data.filter((product) => product.id !== targetId);
      return {
        ...current,
        data: filtered,
        total: Math.max(0, current.total - 1),
      };
    })();

    await mutate(optimisticData, { revalidate: false, populateCache: true });

    try {
      await del(`/products/${targetId}`, {
        accessToken: tokens.accessToken,
      });
      dismissDeleteDialog();
      await mutate();
    } catch (err) {
      await mutate(baseSnapshot, { revalidate: false, populateCache: true });
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <HasPermission permission="product.read" fallback={<NoAccessMessage />}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">Track every SKU and available device.</p>
            <h2 className="text-2xl font-semibold text-white">Product catalog</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => mutate()}
              className="glass inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 backdrop-blur-md"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
            <button
              type="button"
              disabled={!canCreate}
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Plus className="h-4 w-4" /> New product
            </button>
          </div>
        </div>

        {isLoading && !data && (
          <div className="glass rounded-2xl border border-white/20 p-4 text-sm text-white/70 backdrop-blur-md">
            Loading products from the API…
          </div>
        )}

        {error && (
          <div className="glass rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 backdrop-blur-md">
            Live product feed unavailable. Showing sample data.
          </div>
        )}

        <div className="glass overflow-hidden rounded-2xl border border-white/20 shadow-lg backdrop-blur-md">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/70">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white/80">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-xs text-white/50">ID {product.id}</p>
                  </td>
                  <td className="px-6 py-4">{product.sku}</td>
                  <td className="px-6 py-4">{product.category?.name ?? '—'}</td>
                  <td className="px-6 py-4">{currency.format(product.price)}</td>
                  <td className="px-6 py-4">{product.stock}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={!canUpdate}
                        onClick={() => openEditModal(product)}
                        className="glass inline-flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/10 backdrop-blur-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={!canDelete}
                        onClick={() => requestDelete(product)}
                        className="glass inline-flex items-center gap-1 rounded-lg border border-red-300/30 px-2 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30 backdrop-blur-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title={editingProduct ? 'Edit product' : 'New product'}
        description="Manage inventory details synced to the RBAC-protected API."
        isOpen={isModalOpen}
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : editingProduct ? 'Save changes' : 'Create product'}
            </button>
          </>
        }
      >
        <form id="product-form" className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
                placeholder="Kitchen Display Suite"
                {...register('name')}
              />
              {errors.name && (
                <span className="mt-1 block text-xs text-red-500">{errors.name.message}</span>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">
              SKU
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
                placeholder="KDS-200"
                {...register('sku')}
              />
              {errors.sku && (
                <span className="mt-1 block text-xs text-red-500">{errors.sku.message}</span>
              )}
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Price
              <input
                type="number"
                step="0.01"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
                placeholder="1899"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <span className="mt-1 block text-xs text-red-500">{errors.price.message}</span>
              )}
            </label>
            <label className="text-sm font-medium text-slate-700">
              Stock
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
                placeholder="6"
                {...register('stock', { valueAsNumber: true })}
              />
              {errors.stock && (
                <span className="mt-1 block text-xs text-red-500">{errors.stock.message}</span>
              )}
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
              {...register('categoryId')}
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <span className="mt-1 block text-xs text-red-500">{errors.categoryId.message}</span>
            )}
          </label>
          {formError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        title="Delete product"
        description={deleteTarget ? `Remove ${deleteTarget.name} from the catalog?` : undefined}
        isOpen={Boolean(deleteTarget)}
        onClose={dismissDeleteDialog}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        isLoading={isDeleting}
      >
        <p className="text-sm text-slate-600">This action cannot be undone.</p>
        {deleteError && (
          <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {deleteError}
          </p>
        )}
      </ConfirmDialog>
    </HasPermission>
  );
}
