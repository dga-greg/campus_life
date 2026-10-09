import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Campus Life Africa", template: "%s · Campus Life Africa" },
  description: "Four years. Thousands of choices. One campus story. A university life simulator set at the fictional Akwaaba Metropolitan University, Ghana.",
};
export const viewport: Viewport = { themeColor: "#fbf4e6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GH" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <div className="weave" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
