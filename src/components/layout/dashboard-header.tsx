import Image from "next/image";
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
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Image src="/logo-zazu.png" alt="" width={28} height={28} className="h-7 w-7" />
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
