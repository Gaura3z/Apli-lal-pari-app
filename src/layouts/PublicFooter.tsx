import React from 'react';
import { Bus, MapPin, Phone, ShieldCheck, Heart } from 'lucide-react';

interface PublicFooterProps {
  onSelectTab: (tab: any) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/90 pt-10 pb-6 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand & Purpose */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold">
              <Bus className="w-5 h-5" />
            </div>
            <span className="font-black text-white text-base tracking-wide">WHERE IS MY LALPARI?</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-md">
            Intelligent Real-Time Maharashtra Public Bus Tracking, ETA & Passenger Capacity Management System. Designed so commuters can effortlessly discover routes, verified seat capacity, and live GPS movements without memorizing bus numbers.
          </p>
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Pune &harr; Talegaon &harr; Induri &harr; Kamshet &harr; Lonavala Corridor Active
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Passenger Services
          </div>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => onSelectTab('FIND_BUS')} className="hover:text-white transition cursor-pointer">
                Find Buses (From &rarr; To)
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab('LIVE_TRACKING')} className="hover:text-white transition cursor-pointer">
                Live Bus Tracking Map
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab('BUS_STOPS')} className="hover:text-white transition cursor-pointer">
                Bus Stops & Terminals
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab('ROUTES')} className="hover:text-white transition cursor-pointer">
                Corridors & Timetables
              </button>
            </li>
          </ul>
        </div>

        {/* Portals & Governance */}
        <div className="space-y-2">
          <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Operational Portals
          </div>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => onSelectTab('STAFF_DRIVER')} className="hover:text-amber-400 transition cursor-pointer">
                Driver Console
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab('STAFF_DEPOT')} className="hover:text-emerald-400 transition cursor-pointer">
                Depot Manager Portal
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab('STAFF_AUTHORITY')} className="hover:text-sky-400 transition cursor-pointer">
                State Authority Command
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab('STAFF_ANALYST')} className="hover:text-indigo-400 transition cursor-pointer">
                Analytics & Demand Trends
              </button>
            </li>
            <li>
              <button onClick={() => onSelectTab('ADMIN')} className="hover:text-red-400 transition cursor-pointer">
                Super Administration
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
        <div>
          &copy; {new Date().getFullYear()} Maharashtra State Road Transport Corporation (MSRTC) Modernization Prototype &bull; Anveshana Innovation Exhibition
        </div>
        <div className="flex items-center gap-1">
          Built for Maharashtra Public Transit with <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
        </div>
      </div>
    </footer>
  );
};
