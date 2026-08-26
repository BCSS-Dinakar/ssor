import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Search, ZoomOut, RotateCcw, Layers, ShieldAlert, RefreshCw, Calendar } from 'lucide-react';
import { TELANGANA_DISTRICTS, TELANGANA_BOUNDS } from '../../../utils/data/telanganaDistrictsMandals';
import { TELANGANA_POLICE_STATIONS } from '../../../utils/data/telanganaPoliceStations';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { policeApi } from '../../../api/police.api';

/**
 * Calculates a bounding box [minX, minY, width, height] from an SVG path string ('M ... L ... Z')
 * Adding padding for comfortable zoom view.
 */
const calcBoundingBox = (pathStr, padding = 45) => {
  if (!pathStr) return TELANGANA_BOUNDS.viewBox;
  const numbers = pathStr.match(/(-?\d+(\.\d+)?)/g);
  if (!numbers || numbers.length < 2) return TELANGANA_BOUNDS.viewBox;
  const xs = [];
  const ys = [];
  for (let i = 0; i < numbers.length; i += 2) {
    xs.push(parseFloat(numbers[i]));
    ys.push(parseFloat(numbers[i + 1]));
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(maxX - minX + padding * 2, 100);
  const height = Math.max(maxY - minY + padding * 2, 100);
  return `${Math.max(minX - padding, 0)} ${Math.max(minY - padding, 0)} ${width} ${height}`;
};

const getTierColor = (tier) => {
  switch (tier?.toLowerCase()) {
    case 'red':
      return { fill: '#FECACA', stroke: '#DC2626', text: '#B91C1C', badge: 'bg-red-100 text-red-800 border-red-300' };
    case 'orange':
      return { fill: '#FED7AA', stroke: '#EA580C', text: '#C2410C', badge: 'bg-orange-100 text-orange-800 border-orange-300' };
    case 'green':
      return { fill: '#BBF7D0', stroke: '#16A34A', text: '#15803D', badge: 'bg-green-100 text-green-800 border-green-300' };
    default:
      return { fill: '#F1F5F9', stroke: '#94A3B8', text: '#334155', badge: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
};

const TelanganaOfficialMap = ({ onSelectJurisdiction, stateStats }) => {
  const [activeSlide, setActiveSlide] = useState('offenders'); // 'offenders' | 'eprisons'
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // ePrisons Releases & Alerts States
  const getTodayFormatted = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${y}-${m}-${d}`;
  };
  const normDist = (s) => (s || '').toLowerCase().replace(/[-_]/g, ' ').trim();
  const [fromDate, setFromDate] = useState(getTodayFormatted());
  const [toDate, setToDate] = useState(getTodayFormatted());
  const [jailsList, setJailsList] = useState([]);
  const [releasesList, setReleasesList] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [selectedJailCode, setSelectedJailCode] = useState('ALL');
  const [selectedEprisonsDistrict, setSelectedEprisonsDistrict] = useState('ALL');
  const [selectedJailMarker, setSelectedJailMarker] = useState(null);

  // Fetch ePrisons jails and releases when switching to the ePrisons slide.
  // Filter/date changes call fetchEprisonsData() explicitly to avoid stale closures.
  useEffect(() => {
    if (activeSlide === 'eprisons') {
      fetchEprisonsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlide]);

  // fetchEprisonsData always receives dates explicitly to avoid React stale state closure bugs
  const fetchEprisonsData = async (customJailCode, customDistrict, customFromDate, customToDate) => {
    setLoadingReleases(true);
    try {
      const activeCode = customJailCode !== undefined ? customJailCode : selectedJailCode;
      const activeDist = customDistrict !== undefined ? customDistrict : selectedEprisonsDistrict;
      const activeFrom = customFromDate !== undefined ? customFromDate : fromDate;
      const activeTo = customToDate !== undefined ? customToDate : toDate;
      const [jailsRes, releasesRes] = await Promise.all([
        policeApi.getEprisonsJails(),
        policeApi.getEprisonsReleases({
          jailCode: activeCode,
          fromDate: activeFrom,
          toDate: activeTo,
          district: activeDist
        })
      ]);
      if (jailsRes && jailsRes.status && jailsRes.data) {
        setJailsList(jailsRes.data);
      }
      if (releasesRes && releasesRes.status && releasesRes.data) {
        setReleasesList(releasesRes.data);
        if (releasesRes.jails && releasesRes.jails.length > 0 && jailsList.length === 0) {
          setJailsList(releasesRes.jails);
        }
      } else {
        setReleasesList([]);
      }
    } catch (err) {
      console.error('Failed fetching ePrisons releases:', err);
    } finally {
      setLoadingReleases(false);
    }
  };


  // Helper to determine dynamic district tier based on live stats
  const getDistrictDynamicTier = (distName) => {
    if (!stateStats?.districtStats || stateStats.districtStats.length === 0) return 'Red'; // fallback to static config if no live data
    const dStat = stateStats.districtStats.find(s => normDist(s.name) === normDist(distName));
    if (!dStat || dStat.totalOffenders === 0) return 'Green';
    
    // Majority Rule logic or fallback
    if (dStat.redCount >= dStat.orangeCount && dStat.redCount >= dStat.greenCount && dStat.redCount > 0) return 'Red';
    if (dStat.orangeCount >= dStat.greenCount && dStat.orangeCount > 0) return 'Orange';
    if (dStat.greenCount > 0) return 'Green';
    
    // If we have total offenders but they don't have a tier, fallback to red
    return 'Red'; 
  };

  const getDistrictDynamicTotal = (distName) => {
    if (!stateStats?.districtStats || stateStats.districtStats.length === 0) {
      // Fallback to static
      const staticDist = TELANGANA_DISTRICTS.find(s => normDist(s.name) === normDist(distName));
      return staticDist?.totalOffenders || 0;
    }
    const dStat = stateStats.districtStats.find(s => normDist(s.name) === normDist(distName));
    return dStat?.totalOffenders || 0;
  };

  // Calculate State-wide District Risk Tier Data for Left Circle Graph
  const stateDistrictTierData = useMemo(() => {
    let red = 0, orange = 0, green = 0;
    TELANGANA_DISTRICTS.forEach(d => {
      const tier = getDistrictDynamicTier(d.name);
      if (tier === 'Red') red++;
      else if (tier === 'Orange') orange++;
      else if (tier === 'Green') green++;
    });
    return [
      { name: 'Red Tier', value: red, color: '#EF4444' },
      { name: 'Orange Tier', value: orange, color: '#F97316' },
      { name: 'Green Tier', value: green, color: '#10B981' }
    ];
  }, [stateStats?.districtStats]);

  // Top high-density risk districts sorted by dynamic totalOffenders
  const topDistricts = useMemo(() => {
    return [...TELANGANA_DISTRICTS]
      .map(d => ({ ...d, dynamicTotal: getDistrictDynamicTotal(d.name) }))
      .sort((a, b) => b.dynamicTotal - a.dynamicTotal)
      .slice(0, 5);
  }, [stateStats?.districtStats]);

  const handleMouseMove = (e, entity, type = 'DISTRICT') => {
    const svg = e.currentTarget.ownerSVGElement || e.currentTarget.closest('svg');
    if (svg) {
      const rect = svg.getBoundingClientRect();
      setHoverPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setHoveredEntity({ ...entity, type });
  };

  const handleMouseLeave = () => {
    setHoveredEntity(null);
  };

  // Current SVG viewBox based on selected district / zone zoom
  const activeViewBox = useMemo(() => {
    if (selectedDistrict && selectedDistrict.path && activeSlide === 'offenders') {
      return calcBoundingBox(selectedDistrict.path, 60);
    }
    // ePrisons: zoom into the selected district so its PS boundaries are legible
    if (activeSlide === 'eprisons' && selectedEprisonsDistrict !== 'ALL') {
      const d = TELANGANA_DISTRICTS.find((dd) => normDist(dd.name) === normDist(selectedEprisonsDistrict));
      if (d && d.path) return calcBoundingBox(d.path, 40);
    }
    return TELANGANA_BOUNDS.viewBox;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, activeSlide, selectedEprisonsDistrict]);

  // Filter districts based on search query or risk tier
  const filteredDistricts = useMemo(() => {
    return TELANGANA_DISTRICTS.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.hq.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.mandals.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const dynamicTier = getDistrictDynamicTier(d.name);
      const matchesTier = tierFilter === 'ALL' || dynamicTier.toUpperCase() === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [searchQuery, tierFilter, stateStats?.districtStats]);

  // Filtered releases based on active selection
  const filteredReleases = useMemo(() => {
    if (!releasesList || !Array.isArray(releasesList)) return [];
    return releasesList.filter((r) => {
      if (selectedJailMarker) {
        return r.jailCode === selectedJailMarker.code;
      }
      if (selectedEprisonsDistrict && selectedEprisonsDistrict !== 'ALL') {
        return normDist(r.district) === normDist(selectedEprisonsDistrict);
      }
      return true;
    });
  }, [releasesList, selectedJailMarker, selectedEprisonsDistrict]);

  // Active release counts keyed by (normalized) district name. Releases carry
  // their releasing jail's district, which matches an offenders-map district.
  const releaseCountByDistrict = useMemo(() => {
    const m = {};
    (releasesList || []).forEach((r) => {
      const k = normDist(r.district);
      if (k) m[k] = (m[k] || 0) + 1;
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releasesList]);

  // PS boundary layer — only drawn AFTER drilling into a district (clicking it),
  // exactly the way the offenders map reveals mandals. Shows just the police
  // stations that fall inside the selected district (svgDistrict), clean borders.
  const psLayer = useMemo(() => {
    if (activeSlide !== 'eprisons' || selectedEprisonsDistrict === 'ALL') return null;
    const sel = normDist(selectedEprisonsDistrict);
    // Colour each PS like the offenders mandals — a filled choropleth so adjacent
    // stations read distinctly. Deterministic tier per PS name keeps it stable.
    const tiers = ['Green', 'Orange', 'Red'];
    const psTier = (name) => {
      let h = 0;
      const s = name || '';
      for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
      return tiers[Math.abs(h) % tiers.length];
    };

    return TELANGANA_POLICE_STATIONS
      .filter((ps) => normDist(ps.svgDistrict) === sel)
      .map((ps, idx) => {
        const colors = getTierColor(psTier(ps.ps_name));
        return (
          <path
            key={`ps-${idx}`}
            d={ps.d}
            fill={colors.fill}
            stroke="#1E334D"
            strokeWidth={0.7}
            className="transition-all duration-150 cursor-pointer hover:brightness-95"
            onMouseMove={(e) => handleMouseMove(e, { ...ps, id: `ps-${idx}`, releaseCount: releaseCountByDistrict[sel] || 0 }, 'PS')}
            onMouseLeave={handleMouseLeave}
          />
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlide, selectedEprisonsDistrict, releaseCountByDistrict]);

  // Alert markers — only on districts with active releases (a blinking red point,
  // like the old jail pins). Quiet districts show nothing. Hidden once drilled in.
  const alertMarkers = useMemo(() => {
    if (activeSlide !== 'eprisons' || selectedEprisonsDistrict !== 'ALL') return null;
    return TELANGANA_DISTRICTS.map((d) => {
      const count = releaseCountByDistrict[normDist(d.name)] || 0;
      if (count === 0) return null; // no marker where there are no alerts
      const c = d.svgCenter || d.center;
      const x = c?.x ?? (Array.isArray(c) ? c[0] : null);
      const y = c?.y ?? (Array.isArray(c) ? c[1] : null);
      if (x == null || y == null) return null;
      return (
        <g
          key={`marker-${d.id}`}
          transform={`translate(${x}, ${y})`}
          onClick={() => handleDistrictClick(d)}
          onMouseMove={(e) => { e.stopPropagation(); handleMouseMove(e, { ...d, releaseCount: count }, 'ALERT'); }}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer"
        >
          {/* blinking alert ping — same style as the old jail pins */}
          <circle r="15" fill="#EF4444" opacity="0.4" className="animate-ping" />
          <circle r="6" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
          <g transform="translate(6, -12)">
            <rect rx="6" width={count > 9 ? 19 : 15} height="13" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.1" />
            <text x={count > 9 ? 9.5 : 7.5} y="9" textAnchor="middle" fill="#F8FAFC" fontSize="8" fontWeight="bold" fontFamily="monospace">
              {count}
            </text>
          </g>
        </g>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlide, selectedEprisonsDistrict, releaseCountByDistrict]);

  // Handle clicking a district
  const handleDistrictClick = (district) => {
    if (activeSlide === 'eprisons') {
      setSelectedEprisonsDistrict(district.name);
      setSelectedJailMarker(null);
      fetchEprisonsData(selectedJailCode, district.name);
      return;
    }
    setSelectedDistrict(district);
    setSelectedMandal(null);
    if (onSelectJurisdiction) {
      onSelectJurisdiction({ type: 'DISTRICT', data: district });
    }
  };

  // Handle clicking a mandal
  const handleMandalClick = (e, mandal, district) => {
    e.stopPropagation();
    if (activeSlide === 'eprisons') return;
    setSelectedMandal(mandal);
    if (onSelectJurisdiction) {
      onSelectJurisdiction({ type: 'MANDAL', data: { ...mandal, parentDistrict: district.name } });
    }
  };

  // Reset view to entire state
  const handleResetZoom = () => {
    if (activeSlide === 'eprisons') {
      setSelectedJailMarker(null);
      setSelectedJailCode('ALL');
      setSelectedEprisonsDistrict('ALL');
      setSearchQuery('');
      fetchEprisonsData('ALL', 'ALL', fromDate, toDate);
      return;
    }
    setSelectedDistrict(null);
    setSelectedMandal(null);
    setSearchQuery('');
    setTierFilter('ALL');
    if (onSelectJurisdiction) {
      onSelectJurisdiction({ type: 'STATE', data: null });
    }
  };

  // Reset to today's date range and refetch
  const handleResetToToday = () => {
    const t = getTodayFormatted();
    setFromDate(t);
    setToDate(t);
    setSelectedJailMarker(null);
    setSelectedJailCode('ALL');
    setSelectedEprisonsDistrict('ALL');
    fetchEprisonsData('ALL', 'ALL', t, t);
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-md bg-white">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-200 py-3.5 px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] font-bold tracking-wider text-secondary uppercase">
                Statutory GIS Engine v3.8 — Puttaswamy & ePrisons Gateway
              </span>
            </div>
            <CardTitle className="mt-0.5 flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <MapPin className="h-4.5 w-4.5 text-secondary shrink-0" />
              Telangana State Geographical & Jail Release Console
            </CardTitle>
          </div>

          {/* Top Presenter Slide Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveSlide('offenders');
                  setSelectedJailMarker(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeSlide === 'offenders'
                  ? 'bg-white text-secondary shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Offenders Data
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSlide('eprisons');
                  setSelectedDistrict(null);
                  setSelectedMandal(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${activeSlide === 'eprisons'
                  ? 'bg-red-600 text-white shadow-xs ring-1 ring-red-700'
                  : 'text-slate-600 hover:text-red-600'
                  }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
                ePrisons Releases & Alerts
                {releasesList.length > 0 && activeSlide === 'eprisons' && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                    {releasesList.length}
                  </span>
                )}
              </button>
            </div>

            {(selectedDistrict || searchQuery || tierFilter !== 'ALL' || selectedJailMarker || selectedEprisonsDistrict !== 'ALL') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetZoom}
                className="bg-secondary font-semibold text-white hover:bg-indigo-700 border-0 shadow-xs text-xs py-1 h-8 cursor-pointer transition-all animate-fadeIn"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset View
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-white">
        <div className="grid grid-cols-1 xl:grid-cols-12 bg-white">

          {/* 1. LEFT SECTION: Slide 1 (Offenders Data) vs Slide 2 (ePrisons Controls) */}
          <div className="col-span-1 xl:col-span-3 bg-white p-5 flex flex-col justify-between border-b xl:border-b-0 xl:border-r border-slate-100">
            {activeSlide === 'offenders' ? (
              selectedDistrict ? (
                /* District Zoom List View */
                <div className="space-y-3.5">
                  <div className="pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      Telangana State Registry
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {selectedDistrict.name} District
                    </h3>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                        Mandals & Subdivisions ({selectedDistrict.mandals.length})
                      </h4>
                      <span className="text-[9px] text-slate-400">Click to focus</span>
                    </div>

                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                      {selectedDistrict.mandals.map((m) => {
                        const isSelected = selectedMandal?.id === m.id;
                        const colors = getTierColor(m.riskTier);
                        return (
                          <div
                            key={m.id}
                            onClick={(e) => handleMandalClick(e, m, selectedDistrict)}
                            className={`cursor-pointer rounded-lg border p-2 transition-all ${isSelected
                              ? 'border-secondary bg-secondary/10 shadow-xs ring-1 ring-secondary'
                              : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800">{m.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${colors.badge}`}>
                                {m.riskTier}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                              <span>{m.policeStations} Stations</span>
                              <span className="font-mono font-semibold text-slate-700">{m.totalOffenders} Cases</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* State View: General Summary with Circle Graph representing Total Statutory Districts */
                <div className="space-y-3.5">
                  <div className="pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      Telangana State Registry
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      TS District Risk Summary
                    </h3>
                  </div>

                  {/* Circle Graph (Donut Chart) for Total Statutory Districts (33) */}
                  <div className="relative rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 text-center mb-1 font-mono">
                      Total Statutory Districts (33)
                    </div>
                    <div className="h-[125px] w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stateDistrictTierData}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {stateDistrictTierData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-900 shadow-md font-semibold">
                                    {payload[0].name}: {payload[0].value} Districts
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-mono text-base font-extrabold text-slate-900 leading-none">33</span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 mt-0.5">Districts</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 mt-1 text-center">
                      <div className="rounded bg-red-50/80 border border-red-100 py-0.5 text-[10px] font-bold text-red-700">
                        Red: {stateDistrictTierData[0].value}
                      </div>
                      <div className="rounded bg-orange-50/80 border border-orange-100 py-0.5 text-[10px] font-bold text-orange-700">
                        Orange: {stateDistrictTierData[1].value}
                      </div>
                      <div className="rounded bg-emerald-50/80 border border-emerald-100 py-0.5 text-[10px] font-bold text-emerald-700">
                        Green: {stateDistrictTierData[2].value}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                      High-Density Risk Districts
                    </h4>
                    <div className="space-y-1">
                      {topDistricts.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => handleDistrictClick(d)}
                          className="flex items-center justify-between p-1.5 rounded-lg border border-slate-100 bg-slate-50/40 hover:border-secondary/30 hover:bg-slate-100 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[11px] font-semibold text-slate-700">{d.name}</span>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-600">
                            {d.dynamicTotal} Cases
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Slide 2: ePrisons Date Range & Jail Search Control Bar */
              <div className="space-y-4">
                <div className="pb-2.5 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                    NIC ePrisons Live Gateway (.env)
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    Release Date Range Search
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Select Jail / Facility Code
                    </label>
                    <select
                      value={selectedJailCode}
                      onChange={(e) => {
                        setSelectedJailCode(e.target.value);
                        setSelectedJailMarker(null);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-secondary focus:outline-none"
                    >
                      <option value="ALL">ALL - All Telangana Jails (11 Facilities)</option>
                      {jailsList.map((j) => (
                        <option key={j.code} value={j.code}>
                          {j.name} ({j.code}) — {j.district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 flex items-center justify-between">
                        <span>From Date</span>
                        <Calendar className="h-3 w-3 text-red-600" />
                      </label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-red-500 focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1 flex items-center justify-between">
                        <span>To Date</span>
                        <Calendar className="h-3 w-3 text-red-600" />
                      </label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800 shadow-xs focus:border-red-500 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>


                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fetchEprisonsData(selectedJailCode, selectedEprisonsDistrict, fromDate, toDate)}
                      disabled={loadingReleases}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg py-2 text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {loadingReleases ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                      {loadingReleases ? 'Querying...' : 'Search'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToToday}
                      disabled={loadingReleases}
                      title="Reset to today's data"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs border border-slate-300 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Today
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50/60 p-3 space-y-2">
                  <div className="text-[11px] font-extrabold text-red-900 flex items-center justify-between">
                    <span>Active Release Alerts</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-semibold">
                      {filteredReleases.length} Plotted
                    </span>
                  </div>
                  <p className="text-[10px] text-red-700 leading-relaxed">
                    Statutory real-time alerts mapped onto Telangana's districts. Blinking markers flag districts with active prisoner releases. Click a district to drill into its police-station (PS) boundaries.
                  </p>
                  {(selectedEprisonsDistrict !== 'ALL' || selectedJailMarker || selectedJailCode !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => handleResetZoom()}
                      className="text-[10px] font-bold text-red-800 underline block cursor-pointer hover:text-red-950"
                    >
                      Reset map filters ({selectedJailMarker ? selectedJailMarker.code : selectedEprisonsDistrict !== 'ALL' ? selectedEprisonsDistrict : selectedJailCode})
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 text-[9px] text-slate-400 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
              {activeSlide === 'offenders'
                ? "💡 Click any district on the map or list to inspect local police divisions and offenders."
                : "💡 Blinking markers flag districts with active releases. Click a district to drill into its PS boundaries."}
            </div>
          </div>

          {/* 2. MIDDLE SECTION: Clean White SVG Map Viewport (col-span-6) */}
          <div className="col-span-1 xl:col-span-6 bg-white p-3 flex flex-col justify-between items-center relative min-h-[440px]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <svg
              viewBox={activeViewBox}
              className="h-full w-full select-none z-10 transition-all duration-700 ease-out"
              style={{ maxHeight: '430px' }}
            >
              <g className="transition-transform duration-700 ease-out">
                {/* 33-district base map — shared by both slides. ePrisons reuses
                    the exact offenders district boundaries; clicking one drills
                    into its PS boundaries (below), like offenders reveals mandals. */}
                {filteredDistricts.map((d) => {
                  const isHovered = hoveredEntity && hoveredEntity.id === d.id && hoveredEntity.type === 'DISTRICT';
                  const isSelected = selectedDistrict && selectedDistrict.id === d.id && activeSlide === 'offenders';
                  const isEprisonsSelected = activeSlide === 'eprisons' && selectedEprisonsDistrict.toLowerCase() === d.name.toLowerCase();
                  const isNeighborBlackout = (selectedDistrict && !isSelected && activeSlide === 'offenders') ||
                    (activeSlide === 'eprisons' && selectedEprisonsDistrict !== 'ALL' && !isEprisonsSelected);
                  const tierStyle = getTierColor(getDistrictDynamicTier(d.name));

                  if (selectedDistrict && selectedMandal && activeSlide === 'offenders') return null;

                  // In ePrisons mode, check if this district has jails with active releases
                  const districtHasReleases = activeSlide === 'eprisons' && releasesList.some(
                    (r) => normDist(r.district) === normDist(d.name)
                  );

                  return (
                    <path
                      key={d.id}
                      d={d.path}
                      fill={
                        isSelected
                          ? tierStyle.fill
                          : isEprisonsSelected
                            ? '#F8FAFC' // Neutral base under the PS choropleth when drilled in
                            : isNeighborBlackout
                              ? '#F8FAFC'
                              : isHovered
                                ? '#BFDBFE'
                                : activeSlide === 'eprisons' && districtHasReleases
                                  ? '#FEF2F2' // Subtle crimson wash for jail districts
                                  : activeSlide === 'eprisons'
                                    ? '#F1F5F9'
                                    : tierStyle.fill
                      }
                      stroke={
                        isSelected || isEprisonsSelected
                          ? '#1E334D'
                          : isNeighborBlackout
                            ? '#CBD5E1'
                            : activeSlide === 'eprisons' && districtHasReleases
                              ? '#EF4444'
                              : '#1E334D'
                      }
                      strokeWidth={isSelected || isEprisonsSelected ? 1.8 : isHovered ? 1.4 : 1.0}
                      opacity={isNeighborBlackout ? 0.45 : 1}
                      className="transition-all duration-300 cursor-pointer"
                      onClick={() => handleDistrictClick(d)}
                      onMouseMove={(e) => {
                        if (activeSlide === 'eprisons') {
                          const count = releaseCountByDistrict[normDist(d.name)] || 0;
                          handleMouseMove(e, { ...d, releaseCount: count, dynamicTotal: getDistrictDynamicTotal(d.name), dynamicRiskTier: getDistrictDynamicTier(d.name) }, 'ALERT');
                        } else {
                          handleMouseMove(e, { ...d, dynamicTotal: getDistrictDynamicTotal(d.name), dynamicRiskTier: getDistrictDynamicTier(d.name) }, 'DISTRICT');
                        }
                      }}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}

                {/* Zoomed Mandals view inside selected district (only in Offenders mode) */}
                {selectedDistrict && activeSlide === 'offenders' &&
                  selectedDistrict.mandals.map((m) => {
                    const isMandalSelected = selectedMandal && selectedMandal.id === m.id;
                    const isMandalHovered = hoveredEntity && hoveredEntity.id === m.id && hoveredEntity.type === 'MANDAL';
                    const colors = getTierColor(m.riskTier);

                    return (
                      <path
                        key={m.id}
                        d={m.path}
                        fill={
                          isMandalSelected
                            ? colors.fill
                            : isMandalHovered
                              ? '#E2E8F0'
                              : colors.fill
                        }
                        stroke="#1E334D"
                        strokeWidth={isMandalSelected ? 1.6 : 0.8}
                        className="transition-all duration-200 cursor-pointer"
                        onClick={(e) => handleMandalClick(e, m, selectedDistrict)}
                        onMouseMove={(e) => handleMouseMove(e, m, 'MANDAL')}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })}

                {/* ePrisons: PS boundaries of the drilled-into district (like the
                    offenders mandals view), shown only when a district is selected. */}
                {psLayer}

                {/* ePrisons: blinking alert markers per district in the overview map */}
                {alertMarkers}
              </g>
            </svg>

            {/* Map Pin Hover Tooltip */}
            {hoveredEntity && (
              <div
                className="absolute z-50 rounded-lg border border-slate-200 bg-white/95 p-2.5 text-xs text-slate-800 shadow-lg pointer-events-none min-w-[160px]"
                style={{
                  left: hoverPos.x + 15,
                  top: hoverPos.y - 15,
                }}
              >
                {hoveredEntity.type === 'ALERT' ? (
                  <div>
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1 mb-1">
                      <span className={`h-2 w-2 rounded-full ${hoveredEntity.releaseCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="font-extrabold text-slate-900 text-xs">{hoveredEntity.name} District</span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      <div className="mb-1">Offenders: <strong>{hoveredEntity.dynamicTotal || 0} ({hoveredEntity.dynamicRiskTier || 'N/A'})</strong></div>
                      {hoveredEntity.releaseCount > 0 ? (
                        <div className="mt-1 font-bold text-red-700 bg-red-50 p-1 rounded border border-red-100">
                          🚨 {hoveredEntity.releaseCount} Prisoner Release{hoveredEntity.releaseCount > 1 ? 's' : ''} — click to view PS
                        </div>
                      ) : (
                        <div className="mt-1 text-slate-500">No active releases · click to view PS</div>
                      )}
                    </div>
                  </div>
                ) : hoveredEntity.type === 'PS' ? (
                  <div>
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1 mb-1">
                      <span className={`h-2 w-2 rounded-full ${hoveredEntity.releaseCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="font-extrabold text-slate-900 text-xs">{hoveredEntity.ps_name} PS</span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      <div>District: <strong>{hoveredEntity.district || '—'}</strong></div>
                      <div>Zone: <strong>{hoveredEntity.commissionerate === 'District_PS' ? 'District Police' : hoveredEntity.commissionerate || '—'}</strong></div>
                      {hoveredEntity.releaseCount > 0 ? (
                        <div className="mt-1 font-bold text-red-700 bg-red-50 p-1 rounded border border-red-100">
                          🚨 {hoveredEntity.releaseCount} Release{hoveredEntity.releaseCount > 1 ? 's' : ''} in this district
                        </div>
                      ) : (
                        <div className="mt-1 text-slate-500">No active releases</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${hoveredEntity.dynamicRiskTier === 'Red' ? 'bg-red-500' : hoveredEntity.dynamicRiskTier === 'Orange' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                      <span className="font-bold text-slate-900">{hoveredEntity.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {hoveredEntity.dynamicTotal} Cases ({hoveredEntity.dynamicRiskTier})
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Top-Right Location Indicator */}
            <div className="absolute top-3.5 right-3.5 z-20">
              {selectedDistrict && activeSlide === 'offenders' ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs backdrop-blur-xs">
                  <MapPin className="h-3.5 w-3.5 text-secondary" />
                  <span>{selectedDistrict.name.toUpperCase()}</span>
                </div>
              ) : activeSlide === 'eprisons' ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white/95 px-3 py-1.5 text-xs font-extrabold text-red-700 shadow-xs backdrop-blur-xs">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                  <span>
                    {selectedEprisonsDistrict !== 'ALL'
                      ? `${selectedEprisonsDistrict.toUpperCase()} — PS BOUNDARIES`
                      : 'ALL TELANGANA DISTRICTS'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-500 shadow-xs">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span>State View</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. RIGHT SECTION: Slide 1 Metrics vs Slide 2 Release Intelligence Feed */}
          <div className="col-span-1 xl:col-span-3 bg-white p-5 flex flex-col justify-between border-t xl:border-t-0 xl:border-l border-slate-100">
            {activeSlide === 'offenders' ? (
              selectedDistrict ? (
                /* District Specific Metrics */
                (() => {
                  const total = selectedDistrict.totalOffenders || 0;
                  const convicted = Math.round(total * 0.78);
                  const underTrial = total - convicted;

                  const pieData = [
                    { name: 'High Risk', value: selectedDistrict.highRisk || 0, color: '#EF4444' },
                    { name: 'Medium Risk', value: selectedDistrict.mediumRisk || 0, color: '#F97316' },
                    { name: 'Low Risk', value: selectedDistrict.lowRisk || 0, color: '#10B981' },
                  ].filter((item) => item.value > 0);

                  return (
                    <div className="space-y-4">
                      <div className="pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono">
                          Registry Status
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">
                          {selectedDistrict.name} Metrics
                        </h3>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                        <h4 className="text-[9px] uppercase font-bold text-slate-400">Offenders on Register</h4>
                        <div className="font-mono text-2xl font-black text-primary mt-0.5">
                          {total}
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-secondary">Convicted: {convicted}</span>
                            <span className="text-warning">Under Trial: {underTrial}</span>
                          </div>
                          <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div className="bg-secondary" style={{ width: `${(convicted / total) * 100}%` }} />
                            <div className="bg-warning" style={{ width: `${(underTrial / total) * 100}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                        <div className="text-[9px] font-bold text-center text-slate-500 uppercase font-mono mb-1">
                          Offender Risk Tiers
                        </div>
                        <div className="h-[95px] w-full relative flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={38}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                                className="cursor-pointer"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-900 shadow-md font-semibold z-50">
                                        <span style={{ color: payload[0].payload?.color || '#4F46E5' }}>● </span>
                                        {payload[0].name}: {payload[0].value} Offenders
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="font-mono text-sm font-bold text-slate-900">{total}</span>
                          </div>
                        </div>
                      </div>

                      <Link to="/portal/register" className="block text-center text-xs font-bold text-secondary hover:underline">
                        Open full registry →
                      </Link>
                    </div>
                  );
                })()
              ) : (
                /* State-Wide Offenders Metrics inside map card right panel */
                <div className="space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono">
                      Registry Status
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      State-wide census
                    </h3>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                    <h4 className="text-[9px] uppercase font-bold text-slate-400">Offenders on Register</h4>
                    <div className="font-mono text-3xl font-black text-primary mt-0.5">
                      {stateStats?.totalOffenders || 0}
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-secondary">Convicted: {stateStats?.convictedCount || 0}</span>
                        <span className="text-warning">Under Trial: {stateStats?.underTrialCount || 0}</span>
                      </div>
                      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="bg-secondary"
                          style={{
                            width: `${stateStats?.totalOffenders
                              ? (stateStats.convictedCount / stateStats.totalOffenders) * 100
                              : 0
                              }%`,
                          }}
                        />
                        <div
                          className="bg-warning"
                          style={{
                            width: `${stateStats?.totalOffenders
                              ? (stateStats.underTrialCount / stateStats.totalOffenders) * 100
                              : 0
                              }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 text-[11px] leading-relaxed text-slate-500">
                    This registry contains telemetry for all convicted and under-trial offenders across Telangana's 33 districts. Zoom into a district on the map to filter this console automatically.
                  </div>

                  <Link to="/portal/register" className="block text-center text-xs font-bold text-secondary hover:underline">
                    Open full registry →
                  </Link>
                </div>
              )
            ) : (
              /* Slide 2: Real-Time Prisoner Release Intelligence Table / Feed */
              <div className="space-y-3 flex flex-col h-full justify-between">
                <div>
                  <div className="pb-2 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                          Statutory Release Feed
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 leading-snug truncate">
                          {selectedJailMarker
                            ? selectedJailMarker.name
                            : selectedEprisonsDistrict !== 'ALL'
                              ? `${selectedEprisonsDistrict} Releases`
                              : 'State-wide Prisoner Alerts'}
                        </h3>
                        {/* Active date range indicator */}
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                          <Calendar className="h-3 w-3 text-red-500" />
                          <span className="font-semibold text-red-700">{fromDate}</span>
                          <span>→</span>
                          <span className="font-semibold text-red-700">{toDate}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center">
                        <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 shadow-2xs">
                          {filteredReleases.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3 max-h-[440px] overflow-y-auto pr-1">
                    {loadingReleases ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                        <RefreshCw className="h-7 w-7 animate-spin text-red-600" />
                        <span className="text-sm font-semibold">Connecting to ePrisons Gateway...</span>
                      </div>
                    ) : filteredReleases.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center text-slate-500 text-sm font-medium">
                        No prisoner release alerts active for this date window / location.
                      </div>
                    ) : (
                      filteredReleases.map((r) => {
                        const tierColor = r.riskTier === 'Red'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : r.riskTier === 'Orange'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-green-50 text-green-700 border-green-200';

                        return (
                          <div
                            key={r.id}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 transition-all hover:bg-white hover:border-red-300 shadow-2xs hover:shadow-xs space-y-2 text-xs"
                          >
                            {/* Top row: Name, Tier Badge, and Release Date */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 truncate leading-snug text-[13px]">{r.prisonerName}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${tierColor}`}>
                                  {r.riskTier || 'High Risk'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Demographics & Release Date */}
                            <div className="text-[11px] text-slate-500 flex flex-wrap justify-between gap-1 border-b border-slate-100 pb-1.5">
                              <span>Father: <span className="text-slate-700 font-semibold">{r.fatherName || 'N/A'}</span> ({r.age || 30} Yrs)</span>
                              <span className="text-red-600 font-bold">Released: {r.releaseDate}</span>
                            </div>

                            {/* Details Rows */}
                            <div className="space-y-1.5 text-[11px] text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 shrink-0">🏛️</span>
                                <span className="font-semibold text-slate-800 truncate">{r.jailName || r.jailCode}</span>
                              </div>

                              <div className="flex items-start gap-1.5">
                                <span className="text-slate-400 shrink-0 mt-0.5">⚖️</span>
                                <span className="text-slate-600 leading-normal">{r.sectionsOfLaw}</span>
                              </div>

                              {r.caseDetails && (
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-500 pt-0.5">
                                  <span className="font-semibold text-slate-700 flex items-center gap-1 shrink-0">
                                    <span>📍</span> <span>{r.caseDetails.includes(',') ? r.caseDetails.split(',')[1].trim() : r.caseDetails}</span>
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span>
                                    Cr.No. {r.caseDetails.includes(',') ? r.caseDetails.split(',')[0].trim() : 'N/A'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Tracking Officer details */}
                            {r.surveillanceOfficer && (
                              <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-2 flex items-center gap-1.5">
                                <span className="shrink-0">🕵️</span>
                                <span className="truncate">
                                  Tracking: <strong className="text-slate-700 font-semibold">{r.surveillanceOfficer}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[9px] text-slate-400">
                  <span>NIC ePrisons Live API</span>
                  <span>Auto-sync active</span>
                </div>
              </div>
            )}

            {/* Reset view / back button at bottom */}
            <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col justify-end">
              {activeSlide === 'offenders' ? (
                (selectedDistrict || searchQuery || tierFilter !== 'ALL') ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetZoom}
                    className="w-full font-bold border-slate-200 text-slate-700 hover:bg-slate-50 text-xs py-1 h-8.5 cursor-pointer transition-all animate-fadeIn"
                  >
                    <ZoomOut className="mr-1.5 h-3.5 w-3.5" /> Back to State View
                  </Button>
                ) : (
                  <div className="text-[10px] text-center text-slate-400 font-mono">
                    SSOR Portal Core v3.8
                  </div>
                )
              ) : (
                (fromDate !== getTodayFormatted() || toDate !== getTodayFormatted() || selectedJailCode !== 'ALL' || selectedEprisonsDistrict !== 'ALL' || selectedJailMarker) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetToToday}
                    className="w-full font-bold border-red-200 text-red-700 hover:bg-red-50 text-xs py-1 h-8.5 cursor-pointer transition-all animate-fadeIn"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset ePrisons View
                  </Button>
                ) : (
                  <div className="text-[10px] text-center text-slate-400 font-mono">
                    NIC ePrisons Live API
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default TelanganaOfficialMap;
