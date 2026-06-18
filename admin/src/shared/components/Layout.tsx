import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

/**
 * Layout component provides the main layout structure with sidebar and header
 */
interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentPage, onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="ml-64 pt-20">
        <Outlet />
      </main>
    </div>
  );
};
