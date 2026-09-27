import React from 'react';
import { HelpCircle, Phone, MessageSquare, ShieldCheck, Bus, MapPin, AlertCircle } from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Commuter Support & FAQs
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          How to Use Where Is My Lalpari
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Everything you need to know about finding buses without vehicle numbers, live telemetry, and passenger capacity.
        </p>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 text-xs flex items-center justify-center font-bold">1</span>
            Do I need to know the bus registration number?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
            <strong>No!</strong> You can search simply by entering where you are starting from and where you want to go, or spot a bus directly by its Bus Name (e.g. Shivshahi, Lalpari, Hirkani) or registration number. The system automatically associates nearby stands, identifies active running buses, and tracks their live progress station-by-station.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 text-xs flex items-center justify-center font-bold">2</span>
            What is the difference between Measured and Estimated capacity?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
            <strong>Measured:</strong> The bus is equipped with automated passenger counting sensors (IR door barriers or electronic ticketing machines).<br />
            <strong>Estimated:</strong> Capacity is calculated through historical boarding algorithms, time-of-day traffic patterns, and previous stop alighting curves.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 text-xs flex items-center justify-center font-bold">3</span>
            How does the High Occupancy warning work?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
            If a bus approaching your stop exceeds 85% occupancy or is predicted to fill up at an intermediate junction, the system highlights a warning badge so you can decide whether to board or wait for the next service.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600/20 text-red-400 text-xs flex items-center justify-center font-bold">4</span>
            How can MSRTC crew & staff sign in?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
            Staff can click any of the 5 staff portal cards on the homepage or the <strong>Staff Login</strong> button in the top navigation bar. Roles are automatically retrieved from secure database records.
          </p>
        </div>
      </div>

      {/* Emergency & MSRTC Helplines */}
      <div className="bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-900/50 p-6 rounded-3xl space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Phone className="w-4 h-4 text-red-400" />
          Official Maharashtra Transport Contacts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-slate-400">MSRTC Central Helpline:</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">1800 22 1250</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-slate-400">Pune Swargate Enquiry:</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">+91 20 2444 0084</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-slate-400">Highway Emergency Police:</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">1033 / 112</div>
          </div>
        </div>
      </div>
    </div>
  );
};
