/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Volume2,
  VolumeX,
  Maximize2,
  Activity,
  Zap,
  Leaf,
  Layers,
  ChevronDown,
  CloudSun,
  Bus,
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { CityMetrics, ScenarioType } from '../types/city';

interface HeaderBarProps {
  metrics: CityMetrics;
  scenario: ScenarioType;
  onResetView: () => void;
  onSetCameraPreset: (mode: 'iso' | 'street' | 'bird') => void;
  onOpenDashboard: () => void;
  onOpenTransitFare: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  metrics,
  scenario,
  onResetView,
  onSetCameraPreset,
  onOpenDashboard,
  onOpenTransitFare,
}) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('10:45:00');
  const [viewMenuOpen, setViewMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleAudio = () => {
    soundManager.enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) soundManager.playClick();
  };

  const getScenarioLabel = (s: ScenarioType) => {
    switch (s) {
      case 'onda_calor':
        return 'Onda de Calor Tropical (+4°C)';
      case 'pico_noturno':
        return 'Pico Noturno & Baterias BESS';
      case 'chuva_intensa':
        return 'Chuva Tropical & Cidade Esponja';
      default:
        return 'Operação Normal Net-Zero';
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Brand & City ID */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base tracking-tight">Recife 2050</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Gêmeo Digital
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-cyan-400">{currentTime}</span>
              <span>•</span>
              <span className="truncate max-w-[160px] text-slate-300">{getScenarioLabel(scenario)}</span>
            </div>
          </div>
        </div>

        {/* Real-time KPI Chips */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Renovável:</span>
            <span className="font-bold text-emerald-400">{metrics.renewablePct.toFixed(1)}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>AQI:</span>
            <span className="font-bold text-cyan-400">{metrics.aqiAverage} ({metrics.aqiStatus})</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300">
            <CloudSun className="w-3.5 h-3.5 text-sky-400" />
            <span>Temp:</span>
            <span className="font-bold text-white">{metrics.temperatureC.toFixed(1)}°C</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300">
            <span>Trânsito:</span>
            <span className="font-bold text-cyan-400">{metrics.trafficFlowPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Camera Presets Menu */}
          <div className="relative">
            <button
              onClick={() => {
                soundManager.playClick();
                setViewMenuOpen(!viewMenuOpen);
              }}
              className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-2 rounded-xl text-xs font-medium shadow-md transition-colors"
              title="Câmeras e Vistas"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Câmera</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {viewMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 text-xs text-slate-200 z-50">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onSetCameraPreset('iso');
                    setViewMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vista Isométrica</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onSetCameraPreset('street');
                    setViewMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nível da Rua</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onSetCameraPreset('bird');
                    setViewMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                >
                  <CloudSun className="w-3.5 h-3.5 text-purple-400" />
                  <span>Vista Aérea (Nadir)</span>
                </button>
                <div className="h-px bg-slate-800 my-1" />
                <button
                  onClick={() => {
                    soundManager.playClick();
                    onResetView();
                    setViewMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 text-cyan-300 font-medium"
                >
                  Resetar Câmera
                </button>
              </div>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleAudio}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 shadow-md transition-colors"
            title={audioEnabled ? 'Desativar Sons' : 'Ativar Sons'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* VEM Digital 2050 Smart Transit Pass Recharge */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenTransitFare();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 hover:border-cyan-600 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            title="VEM Conecta 2050 – Bilhete Único Inteligente & Recarga"
          >
            <Bus className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">VEM Digital 2050</span>
          </button>

          {/* Open Digital Twin Command Center */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenDashboard();
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Central Digital Twin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
