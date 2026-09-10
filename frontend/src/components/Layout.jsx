import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import CanopyBackdrop from './decor/CanopyBackdrop.jsx';

export default function Layout() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-canopy-950">
      <CanopyBackdrop />
      <div className="relative z-10 flex h-full w-full">
        <Sidebar />
        <main className="leaf-scrollbar flex-1 overflow-y-auto px-8 py-8 md:px-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
