import type { Metadata } from 'next';
import './whole.css';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import MainContentWrapper from '@/components/MainContentWrapper';
import CmdKSearch from '@/components/CmdKSearch';
import ContinueExploring from '@/components/ContinueExploring';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'Thailand Outlook — Economic Research Dashboard',
  description:
    "An independent research dashboard tracking Thailand's economy: macro trends, sector intelligence, and transparent statistical analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Global Cmd+K search modal — mounts once, listens for ⌘K / Ctrl+K */}
        <CmdKSearch />

        <div className="flex min-h-screen">
          <Sidebar />
          <MainContentWrapper>
            <TopBar />
            {/*
              pb-24 md:pb-8 — clears the 64px mobile bottom nav bar
              without affecting the desktop layout.
            */}
            <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
              {children}
              {/* Contextual "continue exploring" footer on every page */}
              <ContinueExploring />
            </main>
          </MainContentWrapper>
        </div>

        {/* Mobile bottom nav — visible only below md breakpoint */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
