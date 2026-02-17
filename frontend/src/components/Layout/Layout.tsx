import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Player } from '../Player';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" role="main">
        {children}
      </main>
      <Player />
    </div>
  );
}
