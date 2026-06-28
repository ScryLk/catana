import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatsCards } from '../components/StatsCards';
import { RecentCatalogs } from '../components/RecentCatalogs';
import { QuickActions } from '../components/QuickActions';


export const Dashboard: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <Header />

      {/* Main Content */}
      <main className="ml-16 pt-20">
        <div className="p-8 max-w-[1600px] mx-auto">
          {/* Title Section */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-100 mb-2">Dashboard</h1>
              <p className="text-zinc-400">Gerencie seus catálogos e acompanhe o desempenho</p>
            </div>
            <button
              onClick={() => navigate('/editor')}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar novo catálogo
            </button>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <StatsCards />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Recent Catalogs */}
            <div className="lg:col-span-2">
              <RecentCatalogs />
            </div>

            {/* Right Column - Quick Actions */}
            <div>
              <QuickActions />
            </div>
          </div>
        </div>
      </main>


    </div>
  );
};
