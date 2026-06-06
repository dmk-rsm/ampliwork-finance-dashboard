import "./globals.css";

export const metadata = {
  title: "Circuit Labs — Financial Dashboard",
  description: "Unified corporate financial dashboard merging transaction data across Chase, Bank of America, and American Express.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#07080c] min-h-screen text-gray-100">
        {children}
      </body>
    </html>
  );
}
