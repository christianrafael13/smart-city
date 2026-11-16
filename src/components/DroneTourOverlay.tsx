/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plane, X, Compass, ChevronRight, Sparkles, Activity } from 'lucide-react';
import { TourLandmark } from '../types/city';
import { soundManager } from '../utils/audio';

interface DroneTourOverlayProps {
  isActive: boolean;
  currentLandmark: TourLandmark | null;
  currentIndex: number;
  totalLandmarks: number;
  onExitTour: () => void;
  onSelectIndex: (idx: number) => void;
}

export const DroneTourOverlay: React.FC<DroneTourOverlayProps> = ({
  isActive,
  currentLandmark,
  currentIndex,
  totalLandmarks,
  onExitTour,
  onSelectIndex,
}) => {
  if (!isActive || !currentLandmark) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between font-sans animate-in fade-in duration-300">
      {/* Top Cinematic Bar */}
      <div className="w-full bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent p-4 sm:p-6 pointer-events-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 animate-pulse">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400 font-mono">
                  TOUR AÉREO 360° CINEMÁTICO
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300">Ponto {currentIndex + 1} de {totalLandmarks}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {currentLandmark.name}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onExitTour();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-red-950/80 text-slate-200 hover:text-red-300 border border-slate-700/80 hover:border-red-600/80 shadow-xl transition-all cursor-pointer text-xs font-semibold"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Retomar Controle Manual</span>
          </button>
        </div>
      </div>

      {/* Bottom Cinematic Landmark Card */}
      <div className="w-full bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-4 sm:p-6 pointer-events-auto">
        <div className="max-w-4xl mx-auto bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                {currentLandmark.district}
              </span>
              <p className="text-sm font-medium text-slate-200 mt-0.5">
                {currentLandmark.tagline}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentLandmark.highlightMetric}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
            {currentLandmark.description}
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 text-[11px]">
              O voo avança automaticamente pelos marcos da Smart City
            </span>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalLandmarks }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectIndex(idx);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-7 bg-cyan-400 shadow-md shadow-cyan-400/50'
                      : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Ir para ponto ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
