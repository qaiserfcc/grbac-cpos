"use client";

import useSWR from "swr";
import { Plus, Pencil, Trash2, RefreshCcw, Shapes } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { del, get, post, put } from "@/lib/api";
import type { Category, PaginatedResult } from "@/types/rbac";
import { categorySchema, type CategorySchema } from "@/lib/validators";
import { FALLBACK_CATEGORIES } from "@/data/fallbacks";
import { HasPermission } from "@/components/rbac/HasPermission";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const fetchCategories = ([path, token]: [string, string]) =>
  get<PaginatedResult<Category>>(path, { accessToken: token });

function NoAccessMessage() {
  return (
    <div className="glass rounded-2xl border border-white/20 p-10 text-center backdrop-blur-md">
      <Shapes className="mx-auto mb-4 h-10 w-10 text-white/40" />
      <p className="text-lg font-semibold text-white">Categories unavailable</p>
      <p className="text-sm text-white/70">You do not have permission to manage assortment categories.</p>
    </div>
  );
}

export default function CategoriesPage() {
  const { tokens, hasPermission } = useAuth();
  const canCreate = hasPermission("category.create");
  const canUpdate = hasPermission("category.update");
  const canDelete = hasPermission("category.delete");

  const { data, error, isLoading, mutate } = useSWR(
    tokens?.accessToken ? ["/categories", tokens.accessToken] : null,
    fetchCategories,
    { revalidateOnFocus: false }
  );

  const categories = useMemo(() => data?.data ?? FALLBACK_CATEGORIES, [data]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const tempIdRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategorySchema>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const snapshotData = () => (data ? { ...data, data: [...data.data] } : undefined);

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const openCreateModal = () => {
    if (!canCreate) return;
    setEditingCategory(null);
    setFormError(null);
    reset({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    if (!canUpdate) return;
    setEditingCategory(category);
    setFormError(null);
    reset({ name: category.name, description: category.description ?? "" });
    setIsModalOpen(true);
  };

  const nextTempId = () => {
    tempIdRef.current += 1;
    return `tmp-category-${tempIdRef.current}`;
  };

  const upsertCategory = async (values: CategorySchema) => {
    if (!tokens?.accessToken) {
      setFormError("Missing access token. Please re-authenticate.");
      return;
    }

    const baseSnapshot = snapshotData();
    const provisionalId = editingCategory?.id ?? crypto.randomUUID?.() ?? nextTempId();
    const optimisticRecord: Category = {
      id: provisionalId,
      ...values,
      description: values.description?.trim() ? values.description : undefined,
    };

    const optimisticData = (() => {
      const current = baseSnapshot ?? { data: FALLBACK_CATEGORIES, total: FALLBACK_CATEGORIES.length };
      if (editingCategory) {
        return {
          ...current,
          data: current.data.map((category) => (category.id === editingCategory.id ? optimisticRecord : category)),
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
      const payload = editingCategory
        ? await put<Category>(`/categories/${editingCategory.id}`, values, {
            accessToken: tokens.accessToken,
          })
        : await post<Category>("/categories", values, {
            accessToken: tokens.accessToken,
          });

      await mutate(
        (current) => {
          const safe = current ?? { data: [], total: 0 };
          if (editingCategory) {
            return {
              ...safe,
              data: safe.data.map((category) =>
                category.id === editingCategory.id ? payload : category
              ),
            };
          }
          const exists = safe.data.some((category) => category.id === payload.id);
          const nextData = exists
            ? safe.data.map((category) => (category.id === payload.id ? payload : category))
            : [payload, ...safe.data];
          return {
            ...safe,
            data: nextData,
            total: exists ? safe.total : safe.total + 1,
          };
        },
        { revalidate: false, populateCache: true }
      );

      setIsModalOpen(false);
      setEditingCategory(null);
      reset();
      setFormError(null);
      await mutate();
    } catch (err) {
      await mutate(baseSnapshot, { revalidate: false, populateCache: true });
      setFormError(err instanceof Error ? err.message : "Unable to save category");
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    await upsertCategory(values);
  });

  const requestDelete = (category: Category) => {
    if (!canDelete) return;
    setDeleteTarget(category);
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
      setDeleteError("Missing access token. Please re-authenticate.");
      return;
    }
    setIsDeleting(true);
    const baseSnapshot = snapshotData();
    const targetId = deleteTarget.id;
    const optimisticData = (() => {
      const current = baseSnapshot ?? { data: FALLBACK_CATEGORIES, total: FALLBACK_CATEGORIES.length };
      const filtered = current.data.filter((category) => category.id !== targetId);
      return {
        ...current,
        data: filtered,
        total: Math.max(0, current.total - 1),
      };
    })();

    await mutate(optimisticData, { revalidate: false, populateCache: true });

    try {
      await del(`/categories/${targetId}`, {
        accessToken: tokens.accessToken,
      });
      dismissDeleteDialog();
      await mutate();
    } catch (err) {
      await mutate(baseSnapshot, { revalidate: false, populateCache: true });
      setDeleteError(err instanceof Error ? err.message : "Unable to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <HasPermission permission="category.read" fallback={<NoAccessMessage />}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/70">Align inventory architecture with channels.</p>
            <h2 className="text-2xl font-semibold text-white">Categories</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 backdrop-blur-sm"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
            <button
              type="button"
              disabled={!canCreate}
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> New category
            </button>
          </div>
        </div>

        {isLoading && !data && (
          <div className="glass rounded-2xl border border-white/20 p-4 text-sm text-white/70 backdrop-blur-md">
            Loading categories from the API…
          </div>
        )}

        {error && (
          <div className="glass rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200 backdrop-blur-md">
            Live category feed unavailable. Showing sample data.
          </div>
        )}

        <div className="glass overflow-hidden rounded-2xl border border-white/20 backdrop-blur-md">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/70">
              <tr>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{category.name}</p>
                    <p className="text-xs text-white/50">ID {category.id}</p>
                  </td>
                  <td className="px-6 py-4 text-white/70">{category.description ?? "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={!canUpdate}
                        onClick={() => openEditModal(category)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        disabled={!canDelete}
                        onClick={() => requestDelete(category)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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
          <Modal
            title={editingCategory ? "Edit category" : "New category"}
            description="Organize your catalog taxonomy before syncing downstream."
            isOpen={isModalOpen}
            onClose={closeModal}
            footer={
              <>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="category-form"
                  className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving…" : editingCategory ? "Save changes" : "Create category"}
                </button>
              </>
            }
          >
            <form id="category-form" className="space-y-4" onSubmit={onSubmit}>
              <label className="block text-sm font-medium text-white">
                Name
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none backdrop-blur-sm"
                  placeholder="Hardware"
                  {...register("name")}
                />
                {errors.name && (
                  <span className="mt-1 block text-xs text-red-300">{errors.name.message}</span>
                )}
              </label>
              <label className="block text-sm font-medium text-white">
                Description
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-blue-400 focus:outline-none backdrop-blur-sm"
                  rows={4}
                  placeholder="Terminals, scanners, in-lane devices"
                  {...register("description")}
                />
                {errors.description && (
                  <span className="mt-1 block text-xs text-red-300">
                    {errors.description.message}
                  </span>
                )}
              </label>
              {formError && (
                <div className="glass rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 backdrop-blur-md">
                  {formError}
                </div>
              )}
            </form>
          </Modal>

          <ConfirmDialog
            title="Delete category"
            description={deleteTarget ? `Remove ${deleteTarget.name}?` : undefined}
            isOpen={Boolean(deleteTarget)}
            onClose={dismissDeleteDialog}
            onConfirm={confirmDelete}
            confirmLabel="Delete"
            isLoading={isDeleting}
          >
            <p className="text-sm text-white/70">
              Deleting a category will detach it from any associated products.
            </p>
            {deleteError && (
              <p className="mt-2 glass rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 backdrop-blur-md">
                {deleteError}
              </p>
            )}
          </ConfirmDialog>
      </div>
    </HasPermission>
  );
}
