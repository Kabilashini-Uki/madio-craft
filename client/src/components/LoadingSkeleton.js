// components/LoadingSkeleton.js
import React from 'react';

export const SkeletonCard = ({ color = 'amber', height = 'h-24' }) => {
  const colorMap = {
    amber: 'bg-gradient-to-r from-amber-100 to-amber-50',
    blue: 'bg-gradient-to-r from-blue-100 to-blue-50',
    green: 'bg-gradient-to-r from-green-100 to-green-50',
    purple: 'bg-gradient-to-r from-purple-100 to-purple-50',
    red: 'bg-gradient-to-r from-red-100 to-red-50',
  };

  const shadowMap = {
    amber: 'shadow-[0_4px_12px_rgba(217,119,6,0.15)]',
    blue: 'shadow-[0_4px_12px_rgba(59,130,246,0.15)]',
    green: 'shadow-[0_4px_12px_rgba(34,197,94,0.15)]',
    purple: 'shadow-[0_4px_12px_rgba(147,51,234,0.15)]',
    red: 'shadow-[0_4px_12px_rgba(239,68,68,0.15)]',
  };

  return (
    <div className={`${height} ${colorMap[color]} rounded-2xl ${shadowMap[color]} animate-pulse hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-shadow`}>
      <div className="h-full flex flex-col justify-between p-6">
        <div className="h-4 bg-white/50 rounded w-1/3"></div>
        <div className="h-8 bg-white/50 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export const SkeletonRow = ({ color = 'amber' }) => {
  const colorMap = {
    amber: 'bg-amber-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    red: 'bg-red-50',
  };

  const shadowMap = {
    amber: 'shadow-[0_2px_8px_rgba(217,119,6,0.12)]',
    blue: 'shadow-[0_2px_8px_rgba(59,130,246,0.12)]',
    green: 'shadow-[0_2px_8px_rgba(34,197,94,0.12)]',
    purple: 'shadow-[0_2px_8px_rgba(147,51,234,0.12)]',
    red: 'shadow-[0_2px_8px_rgba(239,68,68,0.12)]',
  };

  return (
    <div className={`${colorMap[color]} rounded-xl p-4 mb-3 animate-pulse ${shadowMap[color]} hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow`}>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/50 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-white/50 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-white/50 rounded w-1/2"></div>
        </div>
        <div className="h-8 bg-white/50 rounded w-20"></div>
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 3, color = 'amber' }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} color={color} />
      ))}
    </div>
  );
};

export const SkeletonTable = ({ rows = 5, color = 'amber' }) => {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <SkeletonRow key={i} color={color} />
      ))}
    </div>
  );
};

export const SidebarSkeleton = ({ sidebarOpen = true, color = 'amber' }) => {
  const colorMap = {
    amber: 'from-amber-800 to-amber-900',
    blue: 'from-blue-800 to-blue-900',
    green: 'from-green-800 to-green-900',
    purple: 'from-purple-800 to-purple-900',
  };

  const shadowMap = {
    amber: 'shadow-[2px_0_12px_rgba(217,119,6,0.2)]',
    blue: 'shadow-[2px_0_12px_rgba(59,130,246,0.2)]',
    green: 'shadow-[2px_0_12px_rgba(34,197,94,0.2)]',
    purple: 'shadow-[2px_0_12px_rgba(147,51,234,0.2)]',
  };

  const borderColorMap = {
    amber: 'border-amber-700',
    blue: 'border-blue-700',
    green: 'border-green-700',
    purple: 'border-purple-700',
  };

  const bgColorMap = {
    amber: 'bg-amber-700/50',
    blue: 'bg-blue-700/50',
    green: 'bg-green-700/50',
    purple: 'bg-purple-700/50',
  };

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} min-h-screen bg-gradient-to-b ${colorMap[color]} flex-shrink-0 fixed left-0 top-0 z-20 transition-all duration-300 ${shadowMap[color]}`}>
      <div className={`p-4 border-b ${borderColorMap[color]} h-16`}>
        {sidebarOpen && <div className={`h-6 ${bgColorMap[color]} rounded w-1/2 animate-pulse`}></div>}
      </div>
      <div className="p-4">
        {sidebarOpen && (
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-10 h-10 rounded-full ${bgColorMap[color]} animate-pulse`}></div>
            <div className="flex-1">
              <div className={`h-4 ${bgColorMap[color]} rounded w-2/3 mb-2 animate-pulse`}></div>
              <div className={`h-3 ${bgColorMap[color]} rounded w-1/2 animate-pulse`}></div>
            </div>
          </div>
        )}
        <nav className="space-y-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${sidebarOpen ? 'px-4' : 'px-2'} py-3 rounded-xl bg-white/10 h-10 animate-pulse`}></div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export const DashboardLoadingShade = ({ sidebarOpen = true, sidebarColor = 'amber' }) => {
  const shadowMap = {
    amber: 'shadow-[0_4px_12px_rgba(217,119,6,0.15)]',
    blue: 'shadow-[0_4px_12px_rgba(59,130,246,0.15)]',
    green: 'shadow-[0_4px_12px_rgba(34,197,94,0.15)]',
    purple: 'shadow-[0_4px_12px_rgba(147,51,234,0.15)]',
  };

  return (
    <div className="min-h-screen bg-amber-50/30 flex">
      <SidebarSkeleton sidebarOpen={sidebarOpen} color={sidebarColor} />
      
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300`}>
        {/* Header Skeleton */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="flex items-center space-x-3">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-10 animate-pulse"></div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { color: 'amber' },
              { color: 'blue' },
              { color: 'green' },
              { color: 'purple' },
            ].map((item, i) => (
              <SkeletonCard key={i} color={item.color} height="h-32" />
            ))}
          </div>

          {/* Content Area */}
          <div className={`bg-white rounded-2xl ${shadowMap[sidebarColor]} p-6`}>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
            <SkeletonTable rows={5} color={sidebarColor} />
          </div>
        </main>
      </div>
    </div>
  );
};
