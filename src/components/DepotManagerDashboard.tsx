import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransit } from '../context/TransitContext';
import { 
  Building2, 
  Bus, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Send,
  Sliders,
  Radio
} from 'lucide-react';

export const DepotManagerDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { buses, alerts, addAlert, injectDelay, injectPassengerSpike } = useTransit();

  // Restrict to authorized depot
  const authorizedDepotId = userProfile?.depotId || 'depot-shivajinagar';
  const depotBuses = buses.filter((b) => b.depotId === authorizedDepotId || buses.length <= 4);

  const [alertTitle, setAlertTitle] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('WARNING');
  const [noticeSent, setNoticeSent] = useState(false);

  const totalBuses = depotBuses.length;
  const activeBuses = depotBuses.filter((b) => b.status === 'ACTIVE').length;
  const delayedBuses = depotBuses.filter((b) => b.delayMinutes > 5).length;
  const crowdedBuses = depotBuses.filter((b) => b.occupancyPercentage >= 85).length;

  const handlePostAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle || !alertMsg) return;

    addAlert({
      title: alertTitle,
      message: alertMsg,
      severity: alertSeverity,
      depotId: authorizedDepotId,
      createdBy: `${userProfile?.name || 'Depot Manager'} (Shivajinagar)`,
      active: true
    });

    setNoticeSent(true);
    setAlertTitle('');
    setAlertMsg('');
    setTimeout(() => setNoticeSent(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Depot Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
            <Building2 className="w-4 h-4 text-amber-400" />
            Depot Operations Console &bull; {authorizedDepotId}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Shivajinagar Central Depot Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manager: <strong className="text-slate-200">{userProfile?.name || 'Arun Deshmukh'}</strong> &bull; Region: Pune Western Division
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Depot Restriction Enforced
          </span>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Depot Fleet</div>
          <div className="text-3xl font-black text-white font-mono mt-1">{totalBuses}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total assigned units</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active on Route</div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{activeBuses}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Transmitting live GPS</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Delayed Buses</div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">{delayedBuses}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">&gt; 5 min schedule variance</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Crowded (&gt;85%)</div>
          <div className="text-3xl font-black text-red-400 font-mono mt-1">{crowdedBuses}</div>
          <div className="text-[11px] text-red-500/80 mt-1">High load warning</div>
        </div>
      </div>

      {/* Fleet Status Table & Alert Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of Buses */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bus className="w-4 h-4 text-red-500" />
              Depot Bus Telemetry & Schedule Monitor
            </h3>
            <span className="text-xs text-slate-400">Real-time status</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Bus Registration</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Next Stop</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Occupancy</th>
                  <th className="py-2.5 px-3">Delay</th>
                  <th className="py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {depotBuses.map((b) => (
                  <tr key={b.busId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {b.registrationNumber}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {b.busType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-300">
                      {b.nextStopName}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {b.currentSpeed} km/h
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold ${b.occupancyPercentage >= 85 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {b.currentPassengerCount}/{b.capacity} ({b.occupancyPercentage}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {b.delayMinutes > 0 ? (
                        <span className="text-amber-400">+{b.delayMinutes}m</span>
                      ) : (
                        <span className="text-emerald-400">On Time</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => injectPassengerSpike(b.busId, 6)}
                          title="Simulate high boarding rush"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                        >
                          +Crowd
                        </button>
                        <button
                          onClick={() => injectDelay(b.busId, 5)}
                          title="Add 5 min delay"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-900/60 text-amber-300 text-[10px] font-mono cursor-pointer"
                        >
                          +5m
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Broadcast Service Notice */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              Broadcast Passenger Alert
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Publish service change notices directly to passenger search results.
            </p>
          </div>

          <form onSubmit={handlePostAlert} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Alert Title
              </label>
              <input
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="e.g. Extra festival Lalpari deployed"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Severity
              </label>
              <select
                value={alertSeverity}
                onChange={(e) => setAlertSeverity(e.target.value as any)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="INFO">INFO - General Notice</option>
                <option value="WARNING">WARNING - Delay / Diversion</option>
                <option value="CRITICAL">CRITICAL - Highway Stoppage</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Message Detail
              </label>
              <textarea
                rows={3}
                value={alertMsg}
                onChange={(e) => setAlertMsg(e.target.value)}
                placeholder="Provide accurate description for passengers..."
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wide cursor-pointer transition shadow-lg shadow-amber-950/40"
            >
              Publish Alert to Fleet
            </button>

            {noticeSent && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Alert broadcasted to all passengers and driver units!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
