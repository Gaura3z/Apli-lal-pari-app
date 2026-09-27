import React, { useState, useEffect, useMemo } from 'react';
import { useTransit } from '../context/TransitContext';
import { BusCard } from '../components/BusCard';
import { BusJourneyModal } from '../components/BusJourneyModal';
import { WhereIsMyBusTracker } from '../components/WhereIsMyBusTracker';
import { SearchAutocomplete } from '../components/SearchAutocomplete';
import { 
  BusState, 
  SearchResultItem, 
  SearchFilters, 
  SortOption, 
  Stop 
} from '../types';
import { 
  searchBusServices, 
  findNearestStops 
} from '../services/searchEngine';
import { 
  Search, 
  MapPin, 
  Compass, 
  ArrowRight, 
  SlidersHorizontal, 
  AlertCircle, 
  Bus, 
  Sparkles, 
  Calendar, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  ArrowUpDown, 
  Navigation,
  HelpCircle,
  TrendingDown,
  X,
  Radio
} from 'lucide-react';
import { DEMO_SCHEDULES } from '../data/demoData';

interface FindBusPageProps {
  initialFrom?: string;
  initialTo?: string;
  onTrackBus: (bus: BusState) => void;
  onOpenBusStand?: (standName: string) => void;
}

export const FindBusPage: React.FC<FindBusPageProps> = ({
  initialFrom = 'Pune',
  initialTo = 'Lonavala',
  onTrackBus,
  onOpenBusStand
}) => {
  const { buses, stops, routes, alerts } = useTransit();

  const [fromQuery, setFromQuery] = useState(initialFrom);
  const [toQuery, setToQuery] = useState(initialTo);
  const [filters, setFilters] = useState<SearchFilters>({ occupancyLevel: 'ALL', busType: 'ALL' });
  const [sortOption, setSortOption] = useState<SortOption>('EARLIEST_ARRIVAL');

  // Geolocation states
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoNotice, setGeoNotice] = useState<{ message: string; type: 'SUCCESS' | 'DENIED' | 'INFO' } | null>(null);
  const [nearbyStopsList, setNearbyStopsList] = useState<{ stop: Stop; distanceKm: number }[]>([]);

  // Selected result for journey modal
  const [selectedJourneyItem, setSelectedJourneyItem] = useState<SearchResultItem | null>(null);
  // Dedicated Where Is My Train Tracker Modal
  const [trackingBusInModal, setTrackingBusInModal] = useState<BusState | null>(null);

  // Search Engine Execution
  const searchResult = useMemo(() => {
    return searchBusServices({
      fromText: fromQuery,
      toText: toQuery,
      allStops: stops,
      allRoutes: routes,
      allBuses: buses,
      allSchedules: DEMO_SCHEDULES,
      filters,
      sortOption
    });
  }, [fromQuery, toQuery, stops, routes, buses, filters, sortOption]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice({
        message: 'Geolocation is not supported by your browser. Please select your origin manually.',
        type: 'DENIED'
      });
      return;
    }

    setGeoLoading(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestStops(latitude, longitude, stops, 3);
        if (nearest.length > 0) {
          const closest = nearest[0];
          setFromQuery(closest.stop.name);
          setNearbyStopsList(nearest);
          setGeoNotice({
            message: `Detected location near ${closest.stop.name} (${closest.distanceKm} km away). Nearest boarding stand selected.`,
            type: 'SUCCESS'
          });
        } else {
          setFromQuery('Pune Shivajinagar');
        }
      },
      (err) => {
        setGeoLoading(false);
        // Fallback gracefully without blocking the user
        setFromQuery('Pune Swargate');
        setGeoNotice({
          message: 'Location access was not granted or timed out. Defaulted to Pune Swargate. You can search any locality manually.',
          type: 'DENIED'
        });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSwap = () => {
    const temp = fromQuery;
    setFromQuery(toQuery);
    setToQuery(temp);
  };

  return (
    <div className="space-y-6">
      {/* Active Service Alert Banner */}
      {alerts.length > 0 && alerts[0].active && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-red-950/80 border border-amber-600/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-200 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{alerts[0].title}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/30 text-amber-300 font-mono">MSRTC ADVISORY</span>
              </div>
              <p className="text-xs text-amber-300/90 mt-0.5">{alerts[0].message}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Passenger Search Box ("Find Your Bus") */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-red-500" />
            Intelligent From &rarr; To Bus Search Engine
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:block">
            No Bus Number Required
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Find Your Bus
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search by city, locality, bus stop, landmark, or destination. The system maps active buses, seats, and arrivals.
          </p>
        </div>

        {/* Primary Search Inputs Grid */}
        <div className="bg-slate-950/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-inner space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* FROM Field with Autocomplete */}
            <div className="md:col-span-5 relative">
              <SearchAutocomplete
                label="FROM (Starting Location)"
                value={fromQuery}
                placeholder="Search city, locality, stand, or landmark..."
                allStops={stops}
                onChange={(val) => setFromQuery(val)}
                leadingIcon={<MapPin className="w-4 h-4 text-emerald-400" />}
                rightAction={
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={geoLoading}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/70 border border-emerald-700/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-50"
                    title="Detect nearest bus stop automatically"
                  >
                    <Compass className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                    <span>{geoLoading ? 'Detecting...' : 'Use My Location'}</span>
                  </button>
                }
              />
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center pt-5 md:pt-0">
              <button
                type="button"
                onClick={handleSwap}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer shadow-md active:scale-90"
                title="Swap Origin and Destination"
              >
                <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
              </button>
            </div>

            {/* TO Field with Autocomplete */}
            <div className="md:col-span-4 relative">
              <SearchAutocomplete
                label="TO (Destination)"
                value={toQuery}
                placeholder="Search destination stand, town, or tourist spot..."
                allStops={stops}
                onChange={(val) => setToQuery(val)}
                leadingIcon={<MapPin className="w-4 h-4 text-red-400" />}
              />
            </div>

            {/* Submit / Find Buses button */}
            <div className="md:col-span-2 pt-5 md:pt-0">
              <button
                type="button"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 cursor-pointer active:scale-95 transition"
              >
                <Search className="w-4 h-4" />
                Find Buses
              </button>
            </div>
          </div>

          {/* Quick Scenario Pills */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs text-slate-400">
            <span className="font-semibold text-slate-300 text-[11px]">Popular Corridors:</span>
            <button
              onClick={() => {
                setFromQuery('Pune');
                setToQuery('Lonavala');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition text-[11px]"
            >
              Pune &rarr; Lonavala (Outbound)
            </button>
            <button
              onClick={() => {
                setFromQuery('Lonavala');
                setToQuery('Pune');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition text-[11px]"
            >
              Lonavala &rarr; Pune (Inbound)
            </button>
            <button
              onClick={() => {
                setFromQuery('Talegaon');
                setToQuery('Lonavala');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition text-[11px]"
            >
              Talegaon &rarr; Lonavala
            </button>
            <button
              onClick={() => {
                setFromQuery('Induri');
                setToQuery('Kamshet');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 cursor-pointer transition text-[11px]"
            >
              Induri &rarr; Kamshet
            </button>
            {onOpenBusStand && fromQuery && (
              <button
                type="button"
                onClick={() => onOpenBusStand(fromQuery)}
                className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-700/50 cursor-pointer transition text-[11px] font-bold ml-auto flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Open {fromQuery} Live Stand Board &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Geolocation feedback notice */}
        {geoNotice && (
          <div className={`p-3 rounded-2xl text-xs flex items-center justify-between gap-3 ${
            geoNotice.type === 'SUCCESS' 
              ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300'
              : 'bg-amber-950/70 border border-amber-700 text-amber-300'
          }`}>
            <div className="flex items-center gap-2">
              {geoNotice.type === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{geoNotice.message}</span>
            </div>

            <button
              onClick={() => setGeoNotice(null)}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Nearby Stops Suggestions (when geolocation used) */}
        {nearbyStopsList.length > 1 && (
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 font-semibold">Other Nearby Boarding Stands:</span>
            {nearbyStopsList.slice(1).map(({ stop, distanceKm }) => (
              <button
                key={stop.stopId}
                onClick={() => setFromQuery(stop.name)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition text-[11px]"
              >
                {stop.name} (~{distanceKm} km)
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Results Toolbar (Filters & Sorting) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Matching Services ({searchResult.activeResults.length} active)</span>
            {searchResult.matchedOriginStop && searchResult.matchedDestinationStop && (
              <span className="text-xs font-normal text-slate-400">
                &bull; {searchResult.matchedOriginStop.name} &rarr; {searchResult.matchedDestinationStop.name}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic direction matching: <strong className="text-amber-400">{searchResult.matchedRoutes[0]?.direction || 'DIRECTIONAL'}</strong>
          </p>
        </div>

        {/* Filters & Sorters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sorting */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="EARLIEST_ARRIVAL">Earliest Predicted Arrival</option>
              <option value="SHORTEST_WAIT">Shortest Waiting Time</option>
              <option value="LOWEST_OCCUPANCY">Lowest Predicted Occupancy</option>
              <option value="EARLIEST_DEPARTURE">Earliest Scheduled Departure</option>
            </select>
          </div>

          {/* Occupancy Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold pl-1">Load:</span>
            <select
              value={filters.occupancyLevel || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, occupancyLevel: e.target.value as any }))}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Loads</option>
              <option value="LOW">Low (Available)</option>
              <option value="MODERATE">Moderate</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Bus Type Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold pl-1">Type:</span>
            <select
              value={filters.busType || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, busType: e.target.value as any }))}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Bus Types</option>
              <option value="LALPARI_ORDINARY">Lalpari Ordinary</option>
              <option value="HIRVANI_SEMI_LUXURY">Hirkani Semi-Luxury</option>
              <option value="SHIVSHAHI_AC">Shivshahi A/C</option>
              <option value="E_SHIVAI_ELECTRIC">E-Shivai Electric</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Active Bus Results List */}
      {searchResult.activeResults.length > 0 && (
        <div className="space-y-4">
          {searchResult.activeResults.map((item) => (
            <BusCard
              key={item.resultId}
              bus={item.bus}
              searchItem={item}
              destinationName={item.destinationStop.name}
              destinationLat={item.destinationStop.latitude}
              destinationLon={item.destinationStop.longitude}
              onTrackOnMap={(b) => onTrackBus(b)}
              onTrackWhereIsMyBus={(b) => setTrackingBusInModal(b)}
              onTrackWhereIsMyTrain={(b) => setTrackingBusInModal(b)}
              onViewDetails={(selected) => setSelectedJourneyItem(selected)}
            />
          ))}
        </div>
      )}

      {/* 4. No Active Bus Found State (Prompt Item 13) */}
      {searchResult.activeResults.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 mx-auto flex items-center justify-center text-amber-400 shadow-xl">
            <Bus className="w-7 h-7" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white">
              No active bus found for this journey right now.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchResult.error || `All running buses on this corridor have passed ${fromQuery} or are currently on a turnaround schedule.`}
            </p>
          </div>

          {/* Fallback 1: Next Scheduled Service */}
          {searchResult.scheduledServices.length > 0 && (
            <div className="max-w-lg mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  Next Scheduled Timetable Services
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Regular Frequency</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {searchResult.scheduledServices.slice(0, 3).map((sch) => (
                  <div key={sch.scheduleId} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">
                        {sch.route.routeName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {sch.busType.replace('_', ' ')} &bull; {sch.frequency}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-white text-sm">
                        {sch.departureTime}
                      </div>
                      <div className="text-[10px] text-slate-500">Scheduled Departure</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback 2: Nearby Alternative Stops */}
          {searchResult.nearbyAlternativeStops.length > 0 && (
            <div className="max-w-lg mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Alternative Nearby Boarding Stops
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {searchResult.nearbyAlternativeStops.map(({ stop, distanceKm }) => (
                  <button
                    key={stop.stopId}
                    onClick={() => setFromQuery(stop.name)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition flex items-center gap-1.5"
                  >
                    <span>{stop.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">(~{distanceKm} km)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Action */}
          <div>
            <button
              onClick={() => {
                setFilters({ occupancyLevel: 'ALL', busType: 'ALL' });
                setSortOption('EARLIEST_ARRIVAL');
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters & Check Telemetry Again</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Bus Journey Details Modal (Prompt Item 11 & 12) */}
      {selectedJourneyItem && (
        <BusJourneyModal
          item={selectedJourneyItem}
          onClose={() => setSelectedJourneyItem(null)}
          onTrackLive={(bus) => {
            setSelectedJourneyItem(null);
            onTrackBus(bus);
          }}
        />
      )}

      {/* 6. WHERE IS MY BUS LIVE STATUS MODAL */}
      {trackingBusInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            {/* Top red header accent stripe */}
            <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shrink-0" />

            {/* Modal Navigation Top Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
                  <Bus className="w-5 h-5 text-red-500" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      Where Is My Bus &bull; {trackingBusInModal.busName || 'Live Status'}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE AIS-140 GPS
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Bus Name: <strong className="text-white">{trackingBusInModal.busName || 'Express Service'}</strong> &bull; Registration: <strong className="text-amber-300 font-mono">{trackingBusInModal.registrationNumber}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const busToTrack = trackingBusInModal;
                    setTrackingBusInModal(null);
                    onTrackBus(busToTrack);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  title="View on full map radar"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Open Map Radar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackingBusInModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition shrink-0"
                  title="Close live status"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: WhereIsMyBusTracker Component */}
            <div className="overflow-y-auto flex-1 p-2 sm:p-4 bg-slate-950/50">
              {(() => {
                const liveBus = buses.find((b) => b.busId === trackingBusInModal.busId) || trackingBusInModal;
                return (
                  <WhereIsMyBusTracker
                    bus={liveBus}
                    allStops={stops}
                    allRoutes={routes}
                    onOpenMap={() => {
                      setTrackingBusInModal(null);
                      onTrackBus(liveBus);
                    }}
                  />
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Simulated AIS-140 GPS Telemetry Feed (1.5s refresh)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTrackingBusInModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Back to Search Results
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const busToTrack = trackingBusInModal;
                    setTrackingBusInModal(null);
                    onTrackBus(busToTrack);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950 transition cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Full Interactive Radar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
