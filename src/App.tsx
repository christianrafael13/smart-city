/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SmartCityScene } from './three/cityScene';
import { HeaderBar } from './components/HeaderBar';
import { BottomDock } from './components/BottomDock';
import { InspectorModal } from './components/InspectorModal';
import { DashboardModal } from './components/DashboardModal';
import { TransitFareModal } from './components/TransitFareModal';
import {
  SmartLayer,
  TimeOfDay,
  ScenarioType,
  SmartObjectData,
  CityMetrics,
  CityAlert,
} from './types/city';
import { INITIAL_METRICS, INITIAL_ALERTS } from './data/cityData';
import { soundManager } from './utils/audio';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SmartCityScene | null>(null);

  // City state
  const [activeLayers, setActiveLayers] = useState<Set<SmartLayer>>(
    new Set(['energia', 'mobilidade', 'ambiente', 'conectividade', 'residuos'])
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<SmartObjectData | null>(null);
  const [hoveredObject, setHoveredObject] = useState<SmartObjectData | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('dia');
  const [scenario, setScenario] = useState<ScenarioType>('normal');
  const [solarMultiplier, setSolarMultiplier] = useState<number>(1.0);
  const [evDensity, setEvDensity] = useState<number>(1.0);
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [isTransitFareOpen, setIsTransitFareOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<CityAlert[]>(INITIAL_ALERTS);

  // Dynamic calculated metrics based on scenario, time of day, and simulation sliders
  const dynamicMetrics = useMemo<CityMetrics>(() => {
    let base = { ...INITIAL_METRICS };

    // Solar multiplier impact
    const solarFactor = timeOfDay === 'noite' ? 0.05 : timeOfDay === 'entardecer' ? 0.35 : solarMultiplier;
    base.totalEnergyMw = Math.round((147.6 * solarFactor + 35) * 10) / 10;
    base.renewablePct = Math.min(100, Math.max(75, Math.round((94.8 * (0.8 + 0.2 * solarFactor)) * 10) / 10));

    // EV Density impact
    base.evCount = Math.round(14820 * evDensity);
    base.trafficFlowPct = Math.max(70, Math.min(99.5, Math.round((96.5 - (evDensity - 1) * 12) * 10) / 10));

    // Scenario impacts
    if (scenario === 'onda_calor') {
      base.temperatureC = 31.8;
      base.humidityPct = 42;
      base.totalEnergyMw += 24.5; // High HVAC cooling demand
      base.aqiAverage = 24;
      base.aqiStatus = 'Bom';
    } else if (scenario === 'pico_noturno') {
      base.totalEnergyMw += 18.2; // Massive EV charging load
      base.evSharePct = 99.4;
    } else if (scenario === 'chuva_intensa') {
      base.temperatureC = 19.2;
      base.humidityPct = 88;
      base.waterRecycledPct = 98.6; // Sponge city flood retention
      base.aqiAverage = 11;
      base.aqiStatus = 'Excelente';
    } else {
      base.temperatureC = timeOfDay === 'noite' ? 18.5 : timeOfDay === 'entardecer' ? 21.0 : 23.4;
    }

    return base;
  }, [solarMultiplier, evDensity, scenario, timeOfDay]);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new SmartCityScene(mountRef.current, {
      onSelectObject: (obj) => {
        if (obj) soundManager.playSelectObject();
        setSelectedObject(obj);
      },
      onHoverObject: (obj) => {
        setHoveredObject(obj);
      },
    });

    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Update scene when layers change
  const handleToggleLayer = (layer: SmartLayer) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      const isEnabling = !next.has(layer);
      if (isEnabling) {
        next.add(layer);
      } else {
        next.delete(layer);
      }
      sceneRef.current?.toggleLayer(layer, isEnabling);
      return next;
    });
  };

  // Update scene time of day
  const handleChangeTimeOfDay = (newTime: TimeOfDay) => {
    setTimeOfDay(newTime);
    sceneRef.current?.setTimeOfDay(newTime);
  };

  // District focus
  const handleSelectDistrict = (districtId: string) => {
    setSelectedDistrict(districtId);
    sceneRef.current?.focusDistrict(districtId);
  };

  // Scenario change with simulated alert entry
  const handleChangeScenario = (sc: ScenarioType) => {
    setScenario(sc);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let newAlert: CityAlert | null = null;
    if (sc === 'onda_calor') {
      newAlert = {
        id: `alt_${Date.now()}`,
        timestamp: timeStr,
        level: 'warning',
        title: 'Onda de Calor Tropical Ativada (+4°C)',
        description: 'Microclima de Recife acionou cobogós dinâmicos, brisas alísias e resfriamento passivo.',
        district: 'Todos os Distritos',
      };
    } else if (sc === 'pico_noturno') {
      newAlert = {
        id: `alt_${Date.now()}`,
        timestamp: timeStr,
        level: 'info',
        title: 'Pico de Recarga Noturna EV & BESS',
        description: 'Baterias BESS municipais e protocolo V2G estabilizando a rede metropolitana.',
        district: 'Rede Smart Grid Recife',
      };
    } else if (sc === 'chuva_intensa') {
      newAlert = {
        id: `alt_${Date.now()}`,
        timestamp: timeStr,
        level: 'success',
        title: 'Drenagem Sustentável Cidade Esponja',
        description: 'Manguezais preservados e calçadões permeáveis drenaram 100% da lâmina d’água para o Capibaribe.',
        district: 'Parque Linear Capibaribe',
      };
    }

    if (newAlert) {
      setAlerts((prev) => [newAlert!, ...prev.slice(0, 7)]);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Bar */}
      <HeaderBar
        metrics={dynamicMetrics}
        scenario={scenario}
        onResetView={() => {
          setSelectedDistrict(null);
          sceneRef.current?.resetView();
        }}
        onSetCameraPreset={(mode) => sceneRef.current?.setCameraPreset(mode)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenTransitFare={() => setIsTransitFareOpen(true)}
      />

      {/* Hover Tooltip when moving mouse over a building/sensor */}
      {hoveredObject && !selectedObject && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-900/90 border border-cyan-500/50 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="font-semibold text-white">{hoveredObject.name}</span>
          <span className="text-slate-400">({hoveredObject.districtName.split(' ')[0]})</span>
          <span className="text-[10px] text-cyan-300 font-mono">Clique para inspecionar</span>
        </div>
      )}

      {/* Inspector Drawer for Selected Object */}
      <InspectorModal
        object={selectedObject}
        onClose={() => {
          setSelectedObject(null);
          sceneRef.current?.selectObject(null);
        }}
        onOpenTransitFare={() => setIsTransitFareOpen(true)}
      />

      {/* Unified Bottom Dock */}
      <BottomDock
        activeLayers={activeLayers}
        onToggleLayer={handleToggleLayer}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSelectDistrict}
        timeOfDay={timeOfDay}
        onChangeTimeOfDay={handleChangeTimeOfDay}
        scenario={scenario}
        onChangeScenario={handleChangeScenario}
        metrics={dynamicMetrics}
        solarMultiplier={solarMultiplier}
        onChangeSolarMultiplier={setSolarMultiplier}
        evDensity={evDensity}
        onChangeEvDensity={setEvDensity}
      />

      {/* Digital Twin Command Center Full Modal */}
      <DashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        metrics={dynamicMetrics}
        alerts={alerts}
      />

      {/* Intelligent Transit Fare Recharge Modal (VEM Digital 2050) */}
      <TransitFareModal
        isOpen={isTransitFareOpen}
        onClose={() => setIsTransitFareOpen(false)}
      />
    </main>
  );
}
