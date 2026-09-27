import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransit } from '../context/TransitContext';
import { 
  ShieldAlert, 
  Users, 
  Bus, 
  Building2, 
  MapPin, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  KeyRound,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { UserRole } from '../types';

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { buses, routes, stops } = useTransit();
  const [activeTab, setActiveTab] = useState<'USERS' | 'BUSES' | 'ROUTES' | 'AUDIT'>('USERS');

  // Prototype user registry
  const [userList, setUserList] = useState([
    { id: 'usr-driver-1', name: 'Eknath Shinde', email: 'driver.eknath@msrtc.maharashtra.gov.in', role: 'DRIVER', status: 'ACTIVE' },
    { id: 'usr-driver-2', name: 'Sanjay Patil', email: 'driver.sanjay@msrtc.maharashtra.gov.in', role: 'DRIVER', status: 'ACTIVE' },
    { id: 'usr-depot-mgr-1', name: 'Arun Deshmukh', email: 'mgr.shivajinagar@msrtc.maharashtra.gov.in', role: 'DEPOT_MANAGER', status: 'ACTIVE' },
    { id: 'usr-auth-1', name: 'Dr. Vivek Sawant', email: 'commissioner@msrtc.maharashtra.gov.in', role: 'AUTHORITY', status: 'ACTIVE' },
    { id: 'usr-analyst-1', name: 'Pooja Gaikwad', email: 'analytics.pooja@msrtc.maharashtra.gov.in', role: 'ANALYST', status: 'ACTIVE' },
    { id: 'usr-admin-super', name: 'State Sysadmin', email: 'admin.transit@msrtc.maharashtra.gov.in', role: 'SUPER_ADMIN', status: 'ACTIVE' },
  ]);

  const auditLogs = [
    { id: 'log-1', timestamp: '2026-09-26 22:15:02', user: 'admin.transit', action: 'DEPLOYED_SECURITY_RULES', ip: '10.24.1.80' },
    { id: 'log-2', timestamp: '2026-09-26 22:12:45', user: 'mgr.shivajinagar', action: 'DISPATCHED_SERVICE_ALERT', ip: '10.24.4.12' },
    { id: 'log-3', timestamp: '2026-09-26 22:08:19', user: 'driver.eknath', action: 'STARTED_TRIP_EXP_101', ip: '172.16.8.9' },
    { id: 'log-4', timestamp: '2026-09-26 22:01:30', user: 'system_auth', action: 'RBAC_CREDENTIAL_VERIFIED', ip: '10.0.0.1' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-900/60 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            SUPER ADMIN ENTERPRISE CONTROL &bull; RBAC LEVEL 0
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            System Administration & Master Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized: <strong className="text-slate-200">{userProfile?.name || 'Chief Systems Administrator'}</strong> &bull; Complete Fleet, User Roles & Firestore Schema Governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 text-xs font-bold font-mono">
            SUPER_ADMIN ACTIVE
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
            activeTab === 'USERS'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          User & Role Management
        </button>
        <button
          onClick={() => setActiveTab('BUSES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
            activeTab === 'BUSES'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Fleet & Bus Registry ({buses.length})
        </button>
        <button
          onClick={() => setActiveTab('ROUTES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
            activeTab === 'ROUTES'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Routes & Stops ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${
            activeTab === 'AUDIT'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Security Audit Logs
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'USERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              Role-Based Access Control (RBAC) Registry
            </h3>
            <span className="text-xs text-slate-400">Enforced by Firestore Security Rules</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Assigned Role</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {userList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-amber-400">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-400 font-semibold">{u.status}</span>
                    </td>
                    <td className="py-3 px-3">
                      <button className="text-slate-400 hover:text-white text-xs underline cursor-pointer">
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'BUSES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bus className="w-4 h-4 text-red-500" />
              Maharashtra State Bus Inventory
            </h3>
            <span className="text-xs text-slate-400">All registered active vehicles</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Registration</th>
                  <th className="py-2.5 px-3">Bus Type</th>
                  <th className="py-2.5 px-3">Depot</th>
                  <th className="py-2.5 px-3">Assigned Driver</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Telemetry Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {buses.map((b) => (
                  <tr key={b.busId} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-white">{b.registrationNumber}</td>
                    <td className="py-3 px-3">{b.busType.replace('_', ' ')}</td>
                    <td className="py-3 px-3 text-slate-300">{b.depotName}</td>
                    <td className="py-3 px-3 text-slate-300">{b.driverName || 'Assigned'}</td>
                    <td className="py-3 px-3 font-mono">{b.capacity} seats</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-400 border border-red-800 font-mono">
                        DEMO / SIMULATED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ROUTES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Configured Transport Corridors & Stations
            </h3>
          </div>

          <div className="space-y-3">
            {routes.map((r) => (
              <div key={r.routeId} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-white text-sm">{r.routeName}</span>
                  <span className="font-mono text-emerald-400 font-bold">{r.distanceKm} km</span>
                </div>
                <div className="text-slate-400 mb-2">
                  Origin: <span className="text-slate-200">{r.origin}</span> &bull; Destination: <span className="text-slate-200">{r.destination}</span> &bull; Est. Duration: <span className="text-slate-200">{r.estimatedMinutes} min</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.stops.map((s, idx) => (
                    <span key={s.stopId} className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {idx + 1}. {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-sky-400" />
              Security & Authorization Audit Logs
            </h3>
            <span className="text-xs text-slate-400 font-mono">Immutable audit trail</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
                  <span className="text-amber-400 font-bold">{log.user}</span>
                  <span className="text-slate-200">{log.action}</span>
                </div>
                <span className="text-slate-500 text-[11px]">IP: {log.ip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
