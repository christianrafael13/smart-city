/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Zap,
  Car,
  Leaf,
  Wifi,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sliders,
  Sun,
  Sunset,
  Moon,
  TrendingUp,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { SmartLayer, TimeOfDay, ScenarioType, CityMetrics } from '../types/city';
import { DISTRICTS } from '../data/cityData';

interface BottomDockProps {
  activeLayers: Set<SmartLayer>;
  onToggleLayer: (layer: SmartLayer) => void;
  selectedDistrict: string | null;
  onSelectDistrict: (districtId: string) => void;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (time: TimeOfDay) => void;
  scenario: ScenarioType;
  onChangeScenario: (scenario: ScenarioType) => void;
  metrics: CityMetrics;
  solarMultiplier: number;
  onChangeSolarMultiplier: (val: number) => void;
  evDensity: number;
  onChangeEvDensity: (val: number) => void;
}

type TabType = 'layers' | 'districts' | 'simulation' | 'telemetry';

export const BottomDock: React.FC<BottomDockProps> = ({
  activeLayers,
  onToggleLayer,
  selectedDistrict,
  onSelectDistrict,
  timeOfDay,
  onChangeTimeOfDay,
  scenario,
  onChangeScenario,
  metrics,
  solarMultiplier,
  onChangeSolarMultiplier,
  evDensity,
  onChangeEvDensity,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('layers');

  const layersList: { id: SmartLayer; label: string; icon: React.ReactNode; color: string; count: string }[] = [
    { id: 'energia', label: 'Energia & Grid', icon: <Zap className="w-3.5 h-3.5" />, color: 'text-amber-400', count: '142 MW' },
    { id: 'mobilidade', label: 'Mobilidade EV', icon: <Car className="w-3.5 h-3.5" />, color: 'text-emerald-400', count: '98.4% EV' },
    { id: 'ambiente', label: 'Meio Ambiente', icon: <Leaf className="w-3.5 h-3.5" />, color: 'text-cyan-400', count: 'AQI 18' },
    { id: 'conectividade', label: 'Conectividade 5G', icon: <Wifi className="w-3.5 h-3.5" />, color: 'text-blue-400', count: '4.3k Nós' },
    { id: 'residuos', label: 'Resíduos & Água', icon: <Trash2 className="w-3.5 h-3.5" />, color: 'text-purple-400', count: '98% Recicl.' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 'min(960px, 95vw)',
        width: '100%',
        zIndex: 25,
      }}
      className="transition-all duration-300 ease-out"
    >
      {/* Collapse Toggle Button */}
      <div className="flex justify-center -mb-2 relative z-10">
        <button
          onClick={() => {
            soundManager.playClick();
            setCollapsed(!collapsed);
          }}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-full text-xs font-medium shadow-md transition-all cursor-pointer backdrop-blur-md"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Expandir Controles</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Recolher (Modo Cinema)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      {!collapsed && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-3 sm:p-4 text-slate-200 backdrop-blur-xl">
          {/* Top Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 overflow-x-auto gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('layers');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'layers'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Camadas Inteligentes ({activeLayers.size}/5)
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('districts');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'districts'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Distritos Urbanos
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('simulation');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'simulation'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Simulador 2050
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('telemetry');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'telemetry'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Telemetria Rápida
              </button>
            </div>

            {/* Time of Day Switcher Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onChangeTimeOfDay('dia');
                }}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  timeOfDay === 'dia' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dia (12h)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dia</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onChangeTimeOfDay('entardecer');
                }}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  timeOfDay === 'entardecer' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Pôr do Sol (18h)"
              >
                <Sunset className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pôr do Sol</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onChangeTimeOfDay('noite');
                }}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  timeOfDay === 'noite' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Noite (22h)"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Noite</span>
              </button>
            </div>
          </div>

          {/* TAB 1: SMART LAYERS */}
          {activeTab === 'layers' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {layersList.map((layer) => {
                const isActive = activeLayers.has(layer.id);
                return (
                  <button
                    key={layer.id}
                    onClick={() => {
                      soundManager.playLayerToggle();
                      onToggleLayer(layer.id);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isActive
                        ? 'bg-slate-800/90 border-slate-700 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-slate-700/60' : 'bg-slate-800'} ${layer.color}`}>
                        {layer.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{layer.label}</div>
                        <div className="text-[10px] text-slate-400">{layer.count}</div>
                      </div>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isActive ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: DISTRICTS */}
          {activeTab === 'districts' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.values(DISTRICTS).map((district) => {
                const isSelected = selectedDistrict === district.id;
                return (
                  <button
                    key={district.id}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectDistrict(district.id);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-700 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        {district.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0">{district.greenCoverPct}% Verde</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{district.tagline}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Demanda: {district.energyDemandMw} MW</span>
                      <span>•</span>
                      <span>{district.population.toLocaleString()} hab.</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: SIMULATOR & STRESS SCENARIOS */}
          {activeTab === 'simulation' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Cenários 2050:
                </span>
                <button
                  onClick={() => {
                    soundManager.playAlert();
                    onChangeScenario('normal');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    scenario === 'normal'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Operação Normal Net-Zero
                </button>
                <button
                  onClick={() => {
                    soundManager.playAlert();
                    onChangeScenario('onda_calor');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    scenario === 'onda_calor'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Onda de Calor Tropical (+4°C)
                </button>
                <button
                  onClick={() => {
                    soundManager.playAlert();
                    onChangeScenario('pico_noturno');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    scenario === 'pico_noturno'
                      ? 'bg-blue-950 text-blue-300 border-blue-700'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pico de Recarga EV Noturna
                </button>
                <button
                  onClick={() => {
                    soundManager.playAlert();
                    onChangeScenario('chuva_intensa');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    scenario === 'chuva_intensa'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Chuva Tropical (Cidade Esponja)
                </button>
              </div>

              {/* Sliders for live interactive simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Irradiação Solar Fotovoltaica:</span>
                    <span className="font-mono text-cyan-400">{(solarMultiplier * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.5"
                    step="0.05"
                    value={solarMultiplier}
                    onChange={(e) => onChangeSolarMultiplier(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Densidade da Frota Elétrica / Tráfego:</span>
                    <span className="font-mono text-emerald-400">{(evDensity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.6"
                    step="0.05"
                    value={evDensity}
                    onChange={(e) => onChangeEvDensity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUICK TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-0.5">Balanço Energético</div>
                <div className="text-base font-bold text-emerald-400">+{ (metrics.totalEnergyMw * 0.12).toFixed(1) } MW</div>
                <div className="text-[10px] text-slate-500">Superávit injetado em BESS</div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-0.5">Índice de Sustentabilidade</div>
                <div className="text-base font-bold text-cyan-400">{metrics.sustainabilityIndex}/100</div>
                <div className="text-[10px] text-slate-500">Classe Global A1 (Líder)</div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-0.5">Economia Hídrica Circular</div>
                <div className="text-base font-bold text-blue-400">{metrics.waterRecycledPct}%</div>
                <div className="text-[10px] text-slate-500">Reuso em sanitários e jardins</div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-0.5">Desvio de Aterros (Resíduos)</div>
                <div className="text-base font-bold text-purple-400">{metrics.wasteDivertedPct}%</div>
                <div className="text-[10px] text-slate-500">Pneumática + Coleta IA</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
