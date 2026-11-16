/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Zap,
  Building,
  Car,
  Wifi,
  Trash2,
  Droplets,
  Activity,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Bus,
  Trees,
} from 'lucide-react';
import { SmartObjectData } from '../types/city';
import { soundManager } from '../utils/audio';

interface InspectorModalProps {
  object: SmartObjectData | null;
  onClose: () => void;
  onOpenTransitFare?: () => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({ object, onClose, onOpenTransitFare }) => {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!object) return null;

  const handleAction = (label: string) => {
    soundManager.playAlert();
    setActionFeedback(`Comando enviado: "${label}" aplicado com sucesso.`);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3500);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'building':
        return <Building className="w-5 h-5 text-cyan-400" />;
      case 'ev_station':
        return <Car className="w-5 h-5 text-emerald-400" />;
      case 'smart_pole':
        return <Wifi className="w-5 h-5 text-blue-400" />;
      case 'smart_waste':
        return <Trash2 className="w-5 h-5 text-purple-400" />;
      case 'water_buoy':
        return <Droplets className="w-5 h-5 text-sky-400" />;
      case 'park':
        return <Trees className="w-5 h-5 text-emerald-400" />;
      case 'traffic_light':
        return <Sliders className="w-5 h-5 text-amber-400" />;
      default:
        return <Activity className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '76px',
        right: '20px',
        maxWidth: '380px',
        width: 'calc(100vw - 40px)',
        zIndex: 28,
      }}
      className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-200 backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
            {getCategoryIcon(object.category)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                {object.districtName}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {object.status.toUpperCase()}
              </span>
            </div>
            <h3 className="font-bold text-white text-base leading-tight mt-0.5">{object.name}</h3>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fechar Detalhes"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 mb-3 leading-relaxed">{object.description}</p>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {object.metrics.map((m, idx) => (
          <div key={idx} className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
            <div className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
              <span>{m.value}</span>
              {m.unit && <span className="text-[10px] font-normal text-slate-400">{m.unit}</span>}
              {m.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
              {m.trend === 'down' && <TrendingDown className="w-3 h-3 text-cyan-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Smart Features */}
      {object.smartFeatures && object.smartFeatures.length > 0 && (
        <div className="mb-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
          <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Recursos Inteligentes 2050:
          </div>
          <ul className="space-y-1">
            {object.smartFeatures.map((feat, i) => (
              <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                <span className="text-cyan-400 text-xs leading-none">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Commands */}
      {object.actions && object.actions.length > 0 && (
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" />
            Controles Autônomos de Infraestrutura:
          </div>
          <div className="space-y-1.5">
            {object.category === 'transit_hub' && onOpenTransitFare && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenTransitFare();
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 via-sky-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-md transition-all cursor-pointer"
              >
                <span>Recarregar Passagem VEM Digital</span>
                <Bus className="w-3.5 h-3.5" />
              </button>
            )}

            {object.actions.map((act) => (
              <button
                key={act.id}
                onClick={() => handleAction(act.label)}
                className="w-full py-1.5 px-3 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 hover:border-cyan-700 text-cyan-200 text-xs font-medium rounded-xl flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>{act.label}</span>
                <Zap className="w-3 h-3 text-amber-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {actionFeedback && (
        <div className="mt-2.5 p-2 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-200 text-[11px] flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}
    </div>
  );
};
