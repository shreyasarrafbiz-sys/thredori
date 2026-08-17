import "./globals.css";

export const metadata = {
  title: "Thredori — fashion & home, before they're everywhere",
  description:
    "Discover independent Indian fashion and home labels, curated before they're everywhere.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
