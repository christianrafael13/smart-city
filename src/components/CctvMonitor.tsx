/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Video,
  X,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Cpu,
  Wifi,
  Sliders,
  AlertCircle,
  Eye,
  Radio,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface CctvMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  signalPhase?: 'green' | 'yellow' | 'red';
}

export const CctvMonitor: React.FC<CctvMonitorProps> = ({
  isOpen,
  onClose,
  signalPhase = 'green',
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [timecode, setTimecode] = useState('00:00:00.00');
  const [activeTrackingCount, setActiveTrackingCount] = useState(14);
  const [greenWaveEfficiency, setGreenWaveEfficiency] = useState(99.4);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      setTimecode(
        `${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.${ms}`
      );
      // Subtle organic telemetry fluctuation
      setActiveTrackingCount(12 + (now.getSeconds() % 6));
      setGreenWaveEfficiency(98.8 + ((now.getSeconds() * 3) % 11) * 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{ zIndex: 29 }}
      className={`fixed transition-all duration-300 font-sans ${
        isMinimized
          ? 'bottom-24 right-4 w-72'
          : 'bottom-20 right-4 w-96 max-w-[calc(100vw-32px)]'
      }`}
    >
      <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl text-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              CAM-V2X #01
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              5G 1.2ms
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundManager.playClick();
                setIsMinimized(!isMinimized);
              }}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title={isMinimized ? 'Expandir' : 'Minimizar'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-1 hover:bg-red-950/80 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
              title="Fechar Monitor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Viewport / Simulated Edge AI Feed */}
        {!isMinimized && (
          <div className="relative aspect-video bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex flex-col justify-between p-3 select-none">
            {/* Scanlines Effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)',
              }}
            />

            {/* Crosshairs & Grid */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-16 h-16 border border-cyan-500/20 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-cyan-400 rounded-full" />
              </div>
            </div>

            {/* Top HUD Overlay */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-cyan-400">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold tracking-wider">RECIFE SMART INTERSECTION</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">AV. CENTRAL × BEIRA-RIO</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">{timecode}</span>
            </div>

            {/* Dynamic AI Detection Bounding Boxes */}
            <div className="relative z-10 my-auto py-2">
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                {/* Detection 1: BRT ConectaBus */}
                <div className="border border-emerald-500/60 bg-emerald-950/40 p-1.5 rounded relative">
                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                    <span>[BRT-04 CONECTABUS]</span>
                    <span className="text-[9px]">99.8%</span>
                  </div>
                  <div className="text-[9px] text-slate-300 flex items-center justify-between mt-0.5">
                    <span>38 km/h</span>
                    <span className="text-emerald-400">PRIORIDADE V2X</span>
                  </div>
                </div>

                {/* Detection 2: Autonomous EV */}
                <div className="border border-cyan-500/60 bg-cyan-950/40 p-1.5 rounded relative">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span>[EV AUTÔNOMO #12]</span>
                    <span className="text-[9px]">98.4%</span>
                  </div>
                  <div className="text-[9px] text-slate-300 flex items-center justify-between mt-0.5">
                    <span>42 km/h</span>
                    <span className="text-cyan-400">FAIXA LIVRE</span>
                  </div>
                </div>

                {/* Detection 3: Protected Cyclists */}
                <div className="border border-amber-500/60 bg-amber-950/40 p-1.5 rounded relative">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>[2x CICLISTAS ITAÚ]</span>
                    <span className="text-[9px]">97.2%</span>
                  </div>
                  <div className="text-[9px] text-slate-300 flex items-center justify-between mt-0.5">
                    <span>18 km/h</span>
                    <span className="text-amber-400">CICLOVIA 100% OK</span>
                  </div>
                </div>

                {/* Detection 4: Pedestrians */}
                <div className="border border-purple-500/60 bg-purple-950/40 p-1.5 rounded relative">
                  <div className="flex items-center justify-between text-purple-300 font-bold">
                    <span>[4x PEDESTRES]</span>
                    <span className="text-[9px]">99.1%</span>
                  </div>
                  <div className="text-[9px] text-slate-300 flex items-center justify-between mt-0.5">
                    <span>Travessia Segura</span>
                    <span className="text-purple-400">FAIXA ATIVA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom HUD: Live Signal State & V2X Wave */}
            <div className="relative z-10 flex items-center justify-between pt-1 border-t border-cyan-950/80 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">SINAL ATUAL:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    signalPhase === 'green'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                      : signalPhase === 'yellow'
                      ? 'bg-amber-950 text-amber-400 border border-amber-600'
                      : 'bg-red-950 text-red-400 border border-red-600'
                  }`}
                >
                  {signalPhase === 'green' ? 'VERDE (ONDA LIVRE)' : signalPhase === 'yellow' ? 'AMARELO (ATENÇÃO)' : 'VERMELHO (PARADA)'}
                </span>
              </div>
              <div className="text-cyan-300">
                {activeTrackingCount} OBJETOS RASTREADOS
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Summary Bar */}
        <div className="p-3 bg-slate-950 flex items-center justify-between text-xs border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-400">Eficiência da Onda Verde</div>
              <div className="font-bold text-white font-mono">{greenWaveEfficiency.toFixed(1)}%</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400">Protocolo Conectado</div>
            <div className="font-semibold text-emerald-400 text-xs flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>V2X C-V2X Release 18</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
