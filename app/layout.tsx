import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const fontSans = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fontMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://roube-o-emprego-das-ias.cfd"),
  title: {
    default: "Roube o emprego das IAs",
    template: "%s | Roube o emprego das IAs",
  },
  description: "Use o mais novo modelo CLT-5.3-Mini de graça, e ajude no combate contra IAs ladronas de emprego.",
  applicationName: "Roube o emprego das IAs",
  keywords: [
    "chat humano",
    "sem IA",
    "crowdsourced answers",
    "roube o emprego das ias",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Roube o emprego das IAs",
    description: "Use o mais novo modelo CLT-5.3-Mini de graça, e ajude no combate contra IAs ladronas de emprego.",
    url: "/",
    siteName: "Roube o emprego das IAs",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roube o emprego das IAs",
    description: "Use o mais novo modelo CLT-5.3-Mini de graça, e ajude no combate contra IAs ladronas de emprego.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

const rootClassName = [fontSans.variable, fontMono.variable, "dark"].join(" ");

const bodyClassName = [
  "antialiased",
  "bg-background",
  "text-foreground",
  "selection:bg-primary/25",
  "selection:text-foreground",
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={rootClassName} lang="pt-BR" suppressHydrationWarning>
      <body className={bodyClassName}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
