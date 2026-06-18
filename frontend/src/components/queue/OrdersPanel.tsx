import type { ClinicalOrder } from '../../types/patient';

interface OrdersPanelProps {
  baselineOrders: ClinicalOrder[];
  addonOrders: ClinicalOrder[];
}

export function OrdersPanel({ baselineOrders, addonOrders }: OrdersPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Orders</h3>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Baseline Orders</p>
          {baselineOrders.map((o) => (
            <OrderCard key={o.id} order={o} variant="baseline" />
          ))}
        </div>
        {addonOrders.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-urgent uppercase mb-2">
              Physician Add-on Orders (New)
            </p>
            {addonOrders.map((o) => (
              <OrderCard key={o.id} order={o} variant="addon" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  variant,
}: {
  order: ClinicalOrder;
  variant: 'baseline' | 'addon';
}) {
  return (
    <div
      className={`rounded-md border p-4 mb-2 ${
        variant === 'addon'
          ? 'border-urgent bg-urgent-bg'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <p className="font-medium text-sm text-gray-900">{order.procedureType}</p>
        <span className="text-xs text-gray-400">{order.id}</span>
      </div>
      <p className="text-sm text-gray-600 mt-2">{order.indication}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {order.priorityFlags.map((f) => (
          <span
            key={f}
            className="text-xs px-2 py-0.5 rounded bg-mayo-light-blue text-mayo-navy"
          >
            {f}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {order.orderingProvider} · Window: {order.requestedWindow}
      </p>
    </div>
  );
}
