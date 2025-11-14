"use client";

import useSWR from "swr";
import { RefreshCcw, AlertTriangle, ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { get } from "@/lib/api";
import type { DashboardWidget } from "@/types/rbac";
import { HasPermission } from "@/components/rbac/HasPermission";

const FALLBACK_WIDGETS: DashboardWidget[] = [
  { id: "kpi-1", title: "Monthly Revenue", widgetType: "kpi", description: "Last 30 days", dataKey: "revenue" },
  { id: "kpi-2", title: "Orders Processed", widgetType: "kpi", description: "All channels", dataKey: "orders" },
  { id: "kpi-3", title: "Active Terminals", widgetType: "kpi", description: "Retail footprint", dataKey: "terminals" },
  { id: "chart-1", title: "Product Mix", widgetType: "chart", description: "Top 5 categories", dataKey: "productMix" },
  { id: "table-1", title: "Category Performance", widgetType: "table", description: "Week over week change", dataKey: "categoryPerformance" },
];

const SAMPLE_VALUES: Record<string, string | number> = {
  revenue: "$248k",
  orders: "1,253",
  terminals: "342",
};

const SAMPLE_DELTA: Record<string, string> = {
  revenue: "+8.6% vs last month",
  orders: "+3.1% vs last week",
  terminals: "+12 units added",
};

const PRODUCT_MIX = [
  { label: "OmniPOS", value: 38 },
  { label: "Scan&Go", value: 27 },
  { label: "Kitchen Display", value: 21 },
  { label: "Inventory Pro", value: 14 },
];

const PRODUCT_MIX_WIDTH: Record<number, string> = {
  38: "w-[38%]",
  27: "w-[27%]",
  21: "w-[21%]",
  14: "w-[14%]",
};

const CATEGORY_PERFORMANCE = [
  { category: "Fresh", trend: "+12.3%", volume: "$82k" },
  { category: "Center Store", trend: "+6.1%", volume: "$54k" },
  { category: "Prepared", trend: "+3.4%", volume: "$32k" },
  { category: "BWS", trend: "-1.2%", volume: "$18k" },
];

const fetchWidgets = async ([path, token]: [string, string]) => {
  return get<DashboardWidget[]>(path, { accessToken: token });
};

function KpiCard({ widget, accent }: { widget: DashboardWidget; accent: string }) {
  const value = SAMPLE_VALUES[widget.dataKey ?? ""] ?? "—";
  const delta = SAMPLE_DELTA[widget.dataKey ?? ""] ?? "";
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{widget.title}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        <ArrowUpRight className={clsx("h-4 w-4", accent)} />
      </div>
      <p className="text-xs text-slate-400">{delta || widget.description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { tokens, user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    tokens?.accessToken ? ["/api/dashboard/widgets", tokens.accessToken] : null,
    fetchWidgets,
    { revalidateOnFocus: false }
  );

  const widgets = useMemo(() => {
    if (data && data.length) return data;
    return FALLBACK_WIDGETS;
  }, [data]);

  const kpiWidgets = widgets.filter((widget) => widget.widgetType === "kpi");
  const chartWidget = widgets.find((widget) => widget.widgetType === "chart");
  const tableWidget = widgets.find((widget) => widget.widgetType === "table" || widget.widgetType === "list");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Welcome back, {user?.firstName ?? user?.email}</p>
          <h2 className="text-2xl font-semibold text-slate-900">Your RBAC-enabled control center</h2>
          <p className="text-sm text-slate-500">
            You currently hold roles: {user?.roles.map((role) => role.name).join(", ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh widgets
        </button>
      </div>

      {isLoading && !data && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
          Loading the widgets assigned to your roles…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          Failed to load live widgets. Showing sample data instead.
        </div>
      )}

      <HasPermission permission="dashboard.view.kpis">
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Key metrics</h3>
              <p className="text-sm text-slate-500">Surface-level telemetry available to roles with dashboard privileges.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpiWidgets.map((widget, index) => (
              <KpiCard
                key={widget.id}
                widget={widget}
                accent={["text-emerald-500", "text-indigo-500", "text-orange-500"][index % 3]}
              />
            ))}
            {kpiWidgets.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                No KPI widgets assigned to your roles yet.
              </div>
            )}
          </div>
        </section>
      </HasPermission>

      <div className="grid gap-6 lg:grid-cols-2">
        <HasPermission permission="dashboard.view.products">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{chartWidget?.description ?? "Product mix"}</p>
                <h3 className="text-lg font-semibold text-slate-900">{chartWidget?.title ?? "Product Mix"}</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                +5.3% MOM
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {PRODUCT_MIX.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-slate-600">{item.label}</div>
                  <div className="h-2 flex-1 rounded-full bg-slate-100">
                    <div className={clsx("h-2 rounded-full bg-indigo-500", PRODUCT_MIX_WIDTH[item.value] ?? "w-1/2")} />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-slate-900">{item.value}%</div>
                </div>
              ))}
            </div>
          </section>
        </HasPermission>

        <HasPermission permission="dashboard.view.categories">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{tableWidget?.description ?? "Category performance"}</p>
                <h3 className="text-lg font-semibold text-slate-900">{tableWidget?.title ?? "Category Performance"}</h3>
              </div>
              <span className="text-xs text-slate-400">Updated 15m ago</span>
            </div>
            <div className="mt-6 space-y-4">
              {CATEGORY_PERFORMANCE.map((row) => (
                <div key={row.category} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{row.category}</p>
                    <p className="text-xs text-slate-500">Volume {row.volume}</p>
                  </div>
                  <span className={clsx("text-sm font-semibold", row.trend.startsWith("-") ? "text-red-500" : "text-emerald-500")}>{row.trend}</span>
                </div>
              ))}
            </div>
          </section>
        </HasPermission>
      </div>
    </div>
  );
}
