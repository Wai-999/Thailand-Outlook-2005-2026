import type { Metadata } from 'next';
import './whole.css';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import MainContentWrapper from '@/components/MainContentWrapper';

export const metadata: Metadata = {
  title: 'Thailand Outlook — Economic Research Dashboard',
  description:
    "An independent research dashboard tracking Thailand's economy: macro trends, sector intelligence, and transparent statistical analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <MainContentWrapper>
            <TopBar />
            <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
          </MainContentWrapper>
        </div>
      </body>
    </html>
  );
}
