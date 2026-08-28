import React, { useState, useMemo } from 'react';
import { MapPin, RotateCcw, Layers } from 'lucide-react';
import { TELANGANA_DISTRICTS, TELANGANA_BOUNDS } from '../../../utils/data/telanganaDistrictsMandals';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Link } from 'react-router-dom';

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

const normDist = (s) => (s || '').toLowerCase().replace(/[-_]/g, ' ').trim();

const getDistrictDynamicTier = (distName, districtStats) => {
  if (!districtStats || districtStats.length === 0) return 'Red';
  const dStat = districtStats.find(s => normDist(s.name) === normDist(distName));
  if (!dStat || dStat.totalOffenders === 0) return 'Green';

  if (dStat.redCount >= dStat.orangeCount && dStat.redCount >= dStat.greenCount && dStat.redCount > 0) return 'Red';
  if (dStat.orangeCount >= dStat.greenCount && dStat.orangeCount > 0) return 'Orange';
  if (dStat.greenCount > 0) return 'Green';

  return 'Red';
};

const getDistrictDynamicTotal = (distName, districtStats) => {
  if (!districtStats || districtStats.length === 0) {
    const staticDist = TELANGANA_DISTRICTS.find(s => normDist(s.name) === normDist(distName));
    return staticDist?.totalOffenders || 0;
  }
  const dStat = districtStats.find(s => normDist(s.name) === normDist(distName));
  return dStat?.totalOffenders || 0;
};

const TelanganaOfficialMap = ({ onSelectJurisdiction, stateStats }) => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedMandal, setSelectedMandal] = useState(null);
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const districtStats = stateStats?.districtStats;

  const stateDistrictTierData = useMemo(() => {
    let red = 0, orange = 0, green = 0;
    TELANGANA_DISTRICTS.forEach(d => {
      const tier = getDistrictDynamicTier(d.name, districtStats);
      if (tier === 'Red') red++;
      else if (tier === 'Orange') orange++;
      else if (tier === 'Green') green++;
    });
    return [
      { name: 'Red Tier', value: red, color: '#EF4444' },
      { name: 'Orange Tier', value: orange, color: '#F97316' },
      { name: 'Green Tier', value: green, color: '#10B981' }
    ];
  }, [districtStats]);

  const topDistricts = useMemo(() => {
    return [...TELANGANA_DISTRICTS]
      .map(d => ({ ...d, dynamicTotal: getDistrictDynamicTotal(d.name, districtStats) }))
      .sort((a, b) => b.dynamicTotal - a.dynamicTotal)
      .slice(0, 5);
  }, [districtStats]);

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
    if (selectedDistrict && selectedDistrict.path) {
      return calcBoundingBox(selectedDistrict.path, 60);
    }
    return TELANGANA_BOUNDS.viewBox;
  }, [selectedDistrict]);

  const handleMapClick = (district) => {
    setSelectedDistrict(district);
    setSelectedMandal(null);
    if (onSelectJurisdiction) {
      onSelectJurisdiction({ type: 'DISTRICT', data: district });
    }
  };

  // Handle clicking a mandal
  const handleMandalClick = (e, mandal, district) => {
    e.stopPropagation();
    setSelectedMandal(mandal);
    if (onSelectJurisdiction) {
      onSelectJurisdiction({ type: 'MANDAL', data: { ...mandal, parentDistrict: district.name } });
    }
  };

  // Reset view to entire state
  const handleResetZoom = () => {
    setSelectedDistrict(null);
    setSelectedMandal(null);
    if (onSelectJurisdiction) {
      onSelectJurisdiction({ type: 'STATE', data: null });
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-md bg-white">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-slate-200 py-3.5 px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] font-bold tracking-wider text-secondary uppercase">
                Statutory GIS Engine v3.8 — Puttaswamy
              </span>
            </div>
            <CardTitle className="mt-0.5 flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <MapPin className="h-4.5 w-4.5 text-secondary shrink-0" />
              Telangana State Geographical & Police Station Release Console
            </CardTitle>
          </div>


          <div className="flex flex-wrap items-center gap-2">
            {selectedDistrict && (
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

          <div className="col-span-1 xl:col-span-3 bg-white flex flex-col justify-between border-b xl:border-b-0 xl:border-r border-slate-100">
            {(
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
                          onClick={() => handleMapClick(d)}
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
            )}

            <div className="mt-4 text-[9px] text-slate-400 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
              💡 Click any district on the map or list to inspect local police divisions and offenders.
            </div>
          </div>

          {/* 2. MIDDLE SECTION: Clean White SVG Map Viewport */}
          <div className="col-span-1 xl:col-span-6 bg-white p-3 flex flex-col justify-between items-center relative min-h-[440px]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

            <svg
              viewBox={activeViewBox}
              className="h-full w-full select-none z-10 transition-all duration-700 ease-out"
              style={{ maxHeight: '430px' }}
            >
              <g className="transition-transform duration-700 ease-out">
                {/* 33-district base map. Click a district to drill into mandals. */}
                {TELANGANA_DISTRICTS.map((d) => {
                  const isHovered = hoveredEntity && hoveredEntity.id === d.id && hoveredEntity.type === 'DISTRICT';
                  const isSelected = selectedDistrict && selectedDistrict.id === d.id;
                  
                  const isNeighborBlackout = selectedDistrict && !isSelected;
                  const tierStyle = getTierColor(getDistrictDynamicTier(d.name, districtStats));

                  if (selectedDistrict && selectedMandal) return null;

                  

                  return (
                    <path
                      key={d.id}
                      d={d.path}
                      fill={isSelected ? tierStyle.fill : isNeighborBlackout ? '#F8FAFC' : isHovered ? '#BFDBFE' : tierStyle.fill}
                      stroke={isSelected ? '#1E334D' : isNeighborBlackout ? '#CBD5E1' : '#1E334D'}
                      strokeWidth={isSelected ? 1.8 : isHovered ? 1.4 : 1.0}
                      opacity={isNeighborBlackout ? 0.45 : 1}
                      className="transition-all duration-300 cursor-pointer"
                      onClick={() => handleMapClick(d)}
                      onMouseMove={(e) => {
                          handleMouseMove(e, { ...d, dynamicTotal: getDistrictDynamicTotal(d.name, districtStats), dynamicRiskTier: getDistrictDynamicTier(d.name, districtStats) }, 'DISTRICT');
                      }}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}

                {/* Zoomed Mandals view inside selected district (only in Offenders mode) */}
                {selectedDistrict &&
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
                  <div>
                    <div className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${hoveredEntity.dynamicRiskTier === 'Red' ? 'bg-red-500' : hoveredEntity.dynamicRiskTier === 'Orange' ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                      <span className="font-bold text-slate-900">{hoveredEntity.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {hoveredEntity.dynamicTotal} Cases ({hoveredEntity.dynamicRiskTier})
                    </div>
                  </div>
              </div>
            )}

            {/* Top-Right Location Indicator */}
            <div className="absolute top-3.5 right-3.5 z-20">
              {selectedDistrict ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs backdrop-blur-xs">
                  <MapPin className="h-3.5 w-3.5 text-secondary" />
                  <span>{selectedDistrict.name.toUpperCase()}</span>
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
            {selectedDistrict ? (
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
            }
          </div>
        </div>
      </CardContent>

      
    </Card>
  );
};

export default TelanganaOfficialMap;
