import "./index.css";

export const metadata = {
  title: "NeuroVault",
  description: "Secure AI-powered vault for your knowledge and data",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}