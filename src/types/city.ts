/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DistrictId = 'inovacao' | 'financeiro' | 'residencial' | 'parque';

export type SmartLayer = 'energia' | 'mobilidade' | 'ambiente' | 'conectividade' | 'residuos';

export type TimeOfDay = 'dia' | 'entardecer' | 'noite';

export type ScenarioType = 'normal' | 'onda_calor' | 'pico_noturno' | 'chuva_intensa';

export type ObjectCategory = 
  | 'building' 
  | 'ev_station' 
  | 'sensor_aqi' 
  | 'smart_pole' 
  | 'smart_waste' 
  | 'transit_hub' 
  | 'water_buoy'
  | 'park'
  | 'traffic_light';

export interface SmartObjectData {
  id: string;
  name: string;
  category: ObjectCategory;
  districtId: DistrictId;
  districtName: string;
  position: [number, number, number];
  description: string;
  status: 'online' | 'otimizado' | 'alerta';
  metrics: {
    label: string;
    value: string;
    unit?: string;
    trend?: 'up' | 'down' | 'stable';
    isPositive?: boolean;
  }[];
  smartFeatures: string[];
  energyGenerationKw?: number;
  energyConsumptionKw?: number;
  efficiencyRating?: string;
  smartHvacStatus?: string;
  occupancy?: number;
  aqiScore?: number;
  connectivityCoverage?: string;
  actions: {
    id: string;
    label: string;
    type: 'toggle' | 'optimize' | 'inspect';
  }[];
}

export interface DistrictInfo {
  id: DistrictId;
  name: string;
  tagline: string;
  color: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  population: number;
  energyDemandMw: number;
  solarCapacityMw: number;
  greenCoverPct: number;
  evSharePct: number;
  description: string;
}

export interface CityMetrics {
  totalEnergyMw: number;
  renewablePct: number;
  aqiAverage: number;
  aqiStatus: 'Excelente' | 'Bom' | 'Moderado';
  temperatureC: number;
  humidityPct: number;
  evCount: number;
  evSharePct: number;
  trafficFlowPct: number; // 0-100% efficiency
  waterRecycledPct: number;
  sustainabilityIndex: number; // out of 100
  activeIotSensors: number;
  wasteDivertedPct: number;
}

export interface CityAlert {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning';
  title: string;
  description: string;
  district: string;
}

export interface TourLandmark {
  id: string;
  name: string;
  district: string;
  tagline: string;
  description: string;
  highlightMetric: string;
}
