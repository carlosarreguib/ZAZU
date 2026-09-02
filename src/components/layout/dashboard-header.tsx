import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";

export function DashboardHeader({
  businessName,
  userEmail,
}: {
  businessName?: string;
  userEmail?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:px-6">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
        Zazú
      </Link>
      <div className="flex items-center gap-3">
        {businessName ? (
          <span className="text-sm text-muted-foreground">{businessName}</span>
        ) : null}
        {userEmail ? <UserMenu email={userEmail} /> : null}
      </div>
    </header>
  );
}
