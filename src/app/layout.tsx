import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_DESCRIPTION =
  "Zazú organiza tu agenda y te permite recordar a tus clientes por WhatsApp en segundos. La agenda sencilla para autónomos que no quieren perder clientes por olvidos.";

export const metadata: Metadata = {
  title: {
    default: "Zazú — La agenda sencilla para autónomos",
    template: "%s · Zazú",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "Zazú — No pierdas citas por un simple olvido",
    description: SITE_DESCRIPTION,
    siteName: "Zazú",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Zazú — No pierdas citas por un simple olvido",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
