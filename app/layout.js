import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "Thredori — a community for people with great taste",
  description: "Discover what inspires you. Share what you love. Find fashion, home, beauty and everyday inspiration from a community with great taste.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}
