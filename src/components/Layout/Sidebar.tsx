import React from 'react';
import { 
  Home, 
  PlusCircle, 
  Target, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { signOut, profile } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'expenses', label: 'Dépenses', icon: PlusCircle },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'tontines', label: 'Tontines', icon: Users },
    { id: 'analytics', label: 'Analyses', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="bg-white shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">FinanceApp</h2>
            <p className="text-sm text-gray-600">{profile?.nom}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={signOut}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}