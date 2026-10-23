interface ResultSummaryProps {
  title: string;
  items: { label: string; value: string }[];
}

/** Resultado de uma ação aceita, com os valores devolvidos pela API. */
export function ResultSummary({ title, items }: ResultSummaryProps) {
  return (
    <section
      role="status"
      aria-label={title}
      className="rounded-lg border border-green-200 bg-green-50 p-4"
    >
      <h3 className="font-semibold text-green-800">{title}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-slate-600">{item.label}</dt>
            <dd className="font-medium text-slate-900">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
