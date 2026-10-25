import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { Logo } from "@/components/ui/Logo";
import { SiteNav } from "@/components/ui/SiteNav";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WOD Tracker",
    template: "%s | WOD Tracker",
  },
  description: "Registro personal de entrenamientos de CrossFit con carga por foto",
};

// One theme, on purpose: the palette is cream-based and strict, so there is no dark mode.
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#FAF0D7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-28">
        <header className="mx-auto flex w-full max-w-lg items-center px-4 pt-5">
          <Link href="/" className="hover-wiggle flex min-h-11 items-center gap-2.5">
            <Logo />
            <span className="text-lg font-extrabold tracking-tight">WOD Tracker</span>
          </Link>
        </header>
        {children}
        <SiteNav />
      </body>
    </html>
  );
}
