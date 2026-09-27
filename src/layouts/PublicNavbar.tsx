import React, { useState } from 'react';
import { 
  Bus, 
  Search, 
  MapPin, 
  Radio, 
  Route as RouteIcon, 
  HelpCircle, 
  Info, 
  Lock, 
  LogOut, 
  Menu, 
  X,
  Compass
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export type PublicNavTab = 
  | 'HOME' 
  | 'FIND_BUS' 
  | 'LIVE_TRACKING' 
  | 'BUS_STOPS' 
  | 'ROUTES' 
  | 'HELP' 
  | 'ABOUT' 
  | 'DRIVER_LOGIN'
  | 'STAFF_DRIVER' 
  | 'STAFF_DEPOT' 
  | 'STAFF_AUTHORITY' 
  | 'STAFF_ANALYST' 
  | 'ADMIN';

interface PublicNavbarProps {
  activeTab: PublicNavTab;
  onSelectTab: (tab: PublicNavTab) => void;
  onOpenLogin: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenLogin
}) => {
  const { userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: PublicNavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const navLinks: { label: string; tab: PublicNavTab; icon?: any }[] = [
    { label: 'Home', tab: 'HOME' },
    { label: 'Find Bus', tab: 'FIND_BUS' },
    { label: 'Live Tracking', tab: 'LIVE_TRACKING' },
    { label: 'Bus Stops', tab: 'BUS_STOPS' },
    { label: 'Routes', tab: 'ROUTES' },
    { label: 'Help', tab: 'HELP' },
    { label: 'About', tab: 'ABOUT' },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-[41px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => handleNavClick('HOME')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-950/60 group-hover:scale-105 transition">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg text-white tracking-wide">WHERE IS MY LALPARI?</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-600/30 text-red-400 font-mono font-bold border border-red-500/40">MSRTC</span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
              Intelligent Maharashtra Public Bus Tracking, ETA & Passenger Capacity System
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((item) => (
            <button
              key={item.tab}
              onClick={() => handleNavClick(item.tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === item.tab
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Action: Prominent "Find My Bus" + Staff Portal / Login */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => handleNavClick('FIND_BUS')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer active:scale-95 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find My Bus</span>
          </button>

          {userProfile ? (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 py-1 px-3 rounded-xl text-xs">
              <div className="text-right">
                <div className="font-bold text-white text-[11px] leading-tight truncate max-w-[120px]">
                  {userProfile.name}
                </div>
                <div className="text-[9px] font-mono text-amber-400 font-bold">
                  {userProfile.role}
                </div>
              </div>

              <button
                onClick={() => logout()}
                title="Logout"
                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-red-900/60 text-slate-300 hover:text-red-300 transition cursor-pointer ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Staff Login</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => handleNavClick('FIND_BUS')}
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Bus</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-3 animate-in slide-in-from-top duration-150">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => (
              <button
                key={item.tab}
                onClick={() => handleNavClick(item.tab)}
                className={`p-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                  activeTab === item.tab
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {userProfile ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-300 font-bold">
                  {userProfile.name} ({userProfile.role})
                </span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-red-950 text-red-300 text-xs font-bold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Staff Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
