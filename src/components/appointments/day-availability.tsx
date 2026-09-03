import { formatTime } from "@/lib/dates/format";
import { AppointmentListItem } from "@/components/appointments/appointment-list-item";
import type { AvailabilityBlock } from "@/lib/scheduling/availability";

export function DayAvailability({
  blocks,
  timezone,
  closedMessage = "Cerrado este día.",
}: {
  blocks: AvailabilityBlock[];
  timezone: string;
  closedMessage?: string;
}) {
  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground">{closedMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {blocks.map((block) =>
        block.type === "busy" ? (
          <AppointmentListItem
            key={block.appointment.id}
            appointment={block.appointment}
            timezone={timezone}
          />
        ) : (
          <li
            key={`free-${block.startsAt}`}
            className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 px-4 py-3"
          >
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              {formatTime(block.startsAt, timezone)} – {formatTime(block.endsAt, timezone)}
            </span>
            <span className="text-sm text-muted-foreground">Libre</span>
          </li>
        ),
      )}
    </ul>
  );
}
