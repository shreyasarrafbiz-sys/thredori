import "./globals.css";
import Sidebar from "../components/Sidebar";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Thredori — fashion & home, before they're everywhere",
  description:
    "Discover independent Indian fashion and home labels, curated before they're everywhere.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="app-content">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
