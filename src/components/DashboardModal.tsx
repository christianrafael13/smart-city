/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Zap,
  Car,
  Leaf,
  Wifi,
  Trash2,
  Droplets,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Layers,
  TrendingUp,
  Download,
} from 'lucide-react';
import { CityMetrics, CityAlert } from '../types/city';
import { DISTRICTS, HISTORICAL_ENERGY_DATA } from '../data/cityData';
import { soundManager } from '../utils/audio';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CityMetrics;
  alerts: CityAlert[];
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  metrics,
  alerts,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'energy' | 'mobility' | 'environment' | 'alerts'>('overview');
  const [filterAlert, setFilterAlert] = useState<'all' | 'warning' | 'info' | 'success'>('all');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filterAlert === 'all') return true;
    return a.level === filterAlert;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Painel de Controle Gêmeo Digital – Recife 2050
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Dados Simulados Demonstrativos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Supervisão urbana centralizada com IA preditiva, automação IoT e sustentabilidade circular
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('overview');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visão Geral Executiva
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('energy');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'energy'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Energia & Smart Grid
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('mobility');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'mobility'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-emerald-400" />
            Mobilidade & Tráfego
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('environment');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'environment'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-cyan-400" />
            Meio Ambiente & Clima
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('alerts');
            }}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Alertas Urbanos ({alerts.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Primary KPIs Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Energia Renovável</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">{metrics.renewablePct.toFixed(1)}%</div>
                  <div className="text-[11px] text-slate-400 mt-1">Solar + Eólica + BESS</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Qualidade do Ar (AQI)</span>
                    <Leaf className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">{metrics.aqiAverage} <span className="text-xs font-normal text-emerald-400">({metrics.aqiStatus})</span></div>
                  <div className="text-[11px] text-slate-400 mt-1">PM2.5: 3.1 µg/m³ (Ótimo)</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Frota Elétrica Ativa</span>
                    <Car className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{metrics.evCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">({metrics.evSharePct}%)</span></div>
                  <div className="text-[11px] text-slate-400 mt-1">Emissão Direta Zero</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Índice Sustentabilidade</span>
                    <Activity className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400">{metrics.sustainabilityIndex}<span className="text-xs font-normal text-slate-400">/100</span></div>
                  <div className="text-[11px] text-slate-400 mt-1">Top 1% Global Smart Cities</div>
                </div>
              </div>

              {/* Historical Energy Curve SVG */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-white text-sm">Curva Diária de Geração vs. Demanda Elétrica</h3>
                    <p className="text-xs text-slate-400">Comparativo horário de irradiação solar e consumo urbano (MW)</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-3 h-1 bg-amber-400 rounded-full" /> Geração Solar
                    </span>
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="w-3 h-1 bg-cyan-400 rounded-full" /> Demanda Urbana
                    </span>
                  </div>
                </div>

                {/* SVG Visual Chart */}
                <div className="w-full h-44 relative flex items-end justify-between pt-4 border-b border-l border-slate-800 px-3">
                  {HISTORICAL_ENERGY_DATA.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="w-full max-w-[42px] flex items-end gap-1 h-32">
                        {/* Solar Bar */}
                        <div
                          style={{ height: `${(item.solar / 150) * 100}%` }}
                          className="flex-1 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all group-hover:brightness-125"
                          title={`Solar ${item.hour}: ${item.solar} MW`}
                        />
                        {/* Consumption Bar */}
                        <div
                          style={{ height: `${(item.consumption / 150) * 100}%` }}
                          className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all group-hover:brightness-125"
                          title={`Consumo ${item.hour}: ${item.consumption} MW`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.hour}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* District Performance Matrix */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h3 className="font-bold text-white text-sm mb-3">Matriz Comparativa dos 4 Distritos Metropolitanos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {Object.values(DISTRICTS).map((d) => (
                    <div key={d.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{d.name.split('&')[0]}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{d.population.toLocaleString()} hab</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Demanda Energética:</span>
                          <span className="font-semibold text-white">{d.energyDemandMw} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Capacidade Solar:</span>
                          <span className="font-semibold text-amber-400">{d.solarCapacityMw} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cobertura Verde:</span>
                          <span className="font-semibold text-emerald-400">{d.greenCoverPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Frota EV:</span>
                          <span className="font-semibold text-cyan-400">{d.evSharePct}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENERGY & SMART GRID */}
          {activeTab === 'energy' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Capacidade Instalada Solar</div>
                  <div className="text-2xl font-bold text-amber-400">167.4 MWp</div>
                  <div className="text-[11px] text-slate-400 mt-1">Fachadas BIPV + Telhados Fotovoltaicos</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Armazenamento BESS Central</div>
                  <div className="text-2xl font-bold text-emerald-400">320 MWh</div>
                  <div className="text-[11px] text-slate-400 mt-1">Baterias de sódio de estado sólido (92% carga)</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Injeção V2G (Veículo para Rede)</div>
                  <div className="text-2xl font-bold text-cyan-400">18.6 MW</div>
                  <div className="text-[11px] text-slate-400 mt-1">Fornecido por carros elétricos plugados</div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs space-y-3">
                <h3 className="font-bold text-white text-sm">Protocolos de Estabilidade da Rede Inteligente (Smart Grid)</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Previsão de Carga por Inteligência Artificial</div>
                      <div className="text-[11px] text-slate-400">Acurácia preditiva de 99.4% para os próximos 45 minutos</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">ATIVO</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Ilhas de Microrrede Resilientes</div>
                      <div className="text-[11px] text-slate-400">Capacidade de operação autônoma sem queda por até 96 horas contínuas</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">PRONTO</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MOBILITY */}
          {activeTab === 'mobility' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 mb-1">Fluxo Médio de Tráfego</div>
                  <div className="text-xl font-bold text-emerald-400">96.5%</div>
                  <div className="text-[10px] text-slate-500">Semáforos adaptativos em tempo real</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 mb-1">Tempo Espera nos Cruzamentos</div>
                  <div className="text-xl font-bold text-cyan-400">3.4 segundos</div>
                  <div className="text-[10px] text-slate-500">-78% vs cidades tradicionais</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 mb-1">Pontos de Recarga Rápidos</div>
                  <div className="text-xl font-bold text-white">480 eletropostos</div>
                  <div className="text-[10px] text-slate-500">Tempo médio de recarga 8 minutos</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-slate-400 mb-1">Uso de Micromobilidade</div>
                  <div className="text-xl font-bold text-purple-400">42% viagens</div>
                  <div className="text-[10px] text-slate-500">Bicicletas e caminhabilidade ativa</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENVIRONMENT & WATER */}
          {activeTab === 'environment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <div className="text-slate-400 mb-1">Poluente PM2.5</div>
                  <div className="text-xl font-bold text-emerald-400">3.1 µg/m³</div>
                  <div className="text-[10px] text-slate-500">Abaixo de 5.0 (Padrão Ouro OMS)</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <div className="text-slate-400 mb-1">Mitigação de Ilha de Calor</div>
                  <div className="text-xl font-bold text-cyan-400">-3.4 °C</div>
                  <div className="text-[10px] text-slate-500">Graças a telhados verdes e árvores</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <div className="text-slate-400 mb-1">Reuso de Águas Pluviais</div>
                  <div className="text-xl font-bold text-blue-400">91.2%</div>
                  <div className="text-[10px] text-slate-500">Bacias de retenção e cidade esponja</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filtrar:</span>
                <button
                  onClick={() => setFilterAlert('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs ${filterAlert === 'all' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400'}`}
                >
                  Todos ({alerts.length})
                </button>
                <button
                  onClick={() => setFilterAlert('success')}
                  className={`px-2.5 py-1 rounded-lg text-xs ${filterAlert === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400'}`}
                >
                  Sucessos
                </button>
                <button
                  onClick={() => setFilterAlert('info')}
                  className={`px-2.5 py-1 rounded-lg text-xs ${filterAlert === 'info' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'text-slate-400'}`}
                >
                  Informativos
                </button>
              </div>

              <div className="space-y-2">
                {filteredAlerts.map((al) => (
                  <div key={al.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 shrink-0">
                      {al.level === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Info className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{al.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">{al.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{al.description}</p>
                      <span className="inline-block mt-1 text-[10px] text-cyan-400 bg-slate-900 px-2 py-0.5 rounded">
                        Distrito: {al.district}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
