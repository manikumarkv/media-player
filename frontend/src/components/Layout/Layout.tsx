import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Player } from '../Player';
import { OfflineIndicator, EducationalBanner } from '../Common';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-container">
      <EducationalBanner />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" role="main">
          <OfflineIndicator />
          {children}
        </main>
        <Player />
      </div>
    </div>
  );
}
