export function DashboardSummary({
  todayCount,
  tomorrowCount,
  pendingReminders,
}: {
  todayCount: number;
  tomorrowCount: number;
  pendingReminders: number;
}) {
  const items = [
    { label: "Hoy", value: todayCount, unit: todayCount === 1 ? "cita" : "citas" },
    {
      label: "Mañana",
      value: tomorrowCount,
      unit: tomorrowCount === 1 ? "cita" : "citas",
    },
    {
      label: "Recordatorios pendientes",
      value: pendingReminders,
      unit: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border px-4 py-3">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="text-2xl font-semibold">
            {item.value}
            {item.unit ? (
              <span className="ml-1 text-base font-normal text-muted-foreground">
                {item.unit}
              </span>
            ) : null}
          </p>
        </div>
      ))}
    </div>
  );
}
