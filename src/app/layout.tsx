import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minimy — Conversational Search Agent',
  description: 'Fast, temporally grounded chat agent with episodic memory and web search verification.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0c0d0e] text-[#ededed] antialiased">
        {children}
      </body>
    </html>
  );
}
