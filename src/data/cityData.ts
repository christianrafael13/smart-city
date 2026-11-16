/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DistrictInfo, SmartObjectData, CityMetrics, CityAlert, TourLandmark } from '../types/city';

export const DISTRICTS: Record<string, DistrictInfo> = {
  inovacao: {
    id: 'inovacao',
    name: 'Polo Porto Digital & IA 2050',
    tagline: 'Bairro do Recife, Marco Zero Inteligente & Computação Quântica Tropical',
    color: '#06b6d4', // cyan-500
    cameraPosition: [30, 24, 30],
    cameraTarget: [15, 2, 15],
    population: 32000,
    energyDemandMw: 44.2,
    solarCapacityMw: 52.0,
    greenCoverPct: 48,
    evSharePct: 99.4,
    description: 'O histórico Bairro do Recife totalmente restaurado e ampliado para 2050, integrando arquitetura colonial retroprojetada com fachadas BIPV solares, cobogós fotovoltaicos e laboratórios de IA.',
  },
  financeiro: {
    id: 'financeiro',
    name: 'Centro Beira-Rio & Cais Capibaribe',
    tagline: 'Superestruturas Bioclimáticas, Pontes Estaiadas & Gestão Metropolitana',
    color: '#3b82f6', // blue-500
    cameraPosition: [-30, 28, 30],
    cameraTarget: [-15, 4, 15],
    population: 46000,
    energyDemandMw: 66.8,
    solarCapacityMw: 64.5,
    greenCoverPct: 38,
    evSharePct: 98.6,
    description: 'Frente ribeirinha e financeira inspirada no Cais de Recife, com torres sobre pilotis permitindo circulação da brisa do mar, pontes icônicas e mobilidade integrada.',
  },
  residencial: {
    id: 'residencial',
    name: 'Eco-Bairro Tropical Boa Viagem',
    tagline: 'Arquitetura com Cobogós Inteligentes, Coqueiros & Ventilação Cruzada Natural',
    color: '#10b981', // emerald-500
    cameraPosition: [-30, 22, -30],
    cameraTarget: [-15, 2, -15],
    population: 39500,
    energyDemandMw: 26.5,
    solarCapacityMw: 38.2,
    greenCoverPct: 65,
    evSharePct: 99.1,
    description: 'Bairro costeiro e sustentável inspirado na orla de Boa Viagem, com calçadão de ondas, hortas em coberturas, microgeração solar e resfriamento passivo por brisa marinha.',
  },
  parque: {
    id: 'parque',
    name: 'Parque Linear Capibaribe & Bacia do Pina',
    tagline: 'Manguezais Urbanos Restaurados, Catamarãs Solares & Cidade Esponja',
    color: '#8b5cf6', // purple-500
    cameraPosition: [30, 25, -30],
    cameraTarget: [15, 2, -15],
    population: 9800,
    energyDemandMw: 14.1,
    solarCapacityMw: 25.0,
    greenCoverPct: 92,
    evSharePct: 100,
    description: 'Corredor ecológico dos rios Capibaribe e Tejipió, com estações de catamarã elétrico autônomo, jardins filtrantes de mangue e monitoramento limnológico em tempo real.',
  },
};

export const INITIAL_METRICS: CityMetrics = {
  totalEnergyMw: 154.2,
  renewablePct: 96.4,
  aqiAverage: 15,
  aqiStatus: 'Excelente',
  temperatureC: 27.2, // Clima tropical ensolarado típico de Recife
  humidityPct: 68,
  evCount: 16400,
  evSharePct: 98.9,
  trafficFlowPct: 97.2,
  waterRecycledPct: 93.5,
  sustainabilityIndex: 97.6,
  activeIotSensors: 5120,
  wasteDivertedPct: 98.4,
};

export const SMART_OBJECTS: SmartObjectData[] = [
  // POLO PORTO DIGITAL (INOVACAO)
  {
    id: 'bldg_quantum_tower',
    name: 'Torre Porto Digital Nexus 2050',
    category: 'building',
    districtId: 'inovacao',
    districtName: 'Polo Porto Digital & IA 2050',
    position: [16, 0, 16],
    description: 'Edifício-sede de inovação no Bairro do Recife. Fachada híbrida com tijolinho tradicional restaurado na base, cobogós cerâmicos solares e torre de vidro fotocromático.',
    status: 'otimizado',
    metrics: [
      { label: 'Geração Solar', value: '1.580', unit: 'kWh/dia', trend: 'up', isPositive: true },
      { label: 'Consumo Atual', value: '820', unit: 'kW', trend: 'down', isPositive: true },
      { label: 'Autossuficiência', value: '124%', trend: 'up', isPositive: true },
      { label: 'Ocupação', value: '2.100', unit: 'pesquisadores' },
      { label: 'Ventilação Natural', value: 'Brisa Marinha Ativa', isPositive: true },
      { label: 'Qualidade do Ar Interno', value: 'AQI 11 (Excelente)', isPositive: true },
    ],
    smartFeatures: [
      'Cobogós cerâmicos inteligentes com microcélulas solares integradas',
      'Ventilação cruzada bioclimática aproveitando a brisa do Atlântico',
      'Gêmeo digital conectado aos laboratórios do Porto Digital',
      'Ponto de pouso para drones de logística urbana no topo',
    ],
    energyGenerationKw: 1580,
    energyConsumptionKw: 820,
    efficiencyRating: 'Net-Zero A++++ Tropical',
    smartHvacStatus: 'Otimização Bioclimática & Brisa Marinha',
    occupancy: 2100,
    aqiScore: 11,
    connectivityCoverage: '5G Mesh Tera-band / LoRaWAN Recife',
    actions: [
      { id: 'opt_solar', label: 'Exportar Excedente Solar para Rede Municipal', type: 'optimize' },
      { id: 'opt_cobogo', label: 'Ajustar Abertura dos Cobogós para Brisa', type: 'toggle' },
    ],
  },
  {
    id: 'bldg_biotech_lab',
    name: 'Bio-Hub Manguezal & Clima',
    category: 'building',
    districtId: 'inovacao',
    districtName: 'Polo Porto Digital & IA 2050',
    position: [24, 0, 12],
    description: 'Centro de biotecnologia focado na conservação dos manguezais pernambucanos e créditos de carbono azul.',
    status: 'otimizado',
    metrics: [
      { label: 'Captura Carbono Azul', value: '22.4', unit: 't/mês', trend: 'up', isPositive: true },
      { label: 'Geração Solar', value: '1.050', unit: 'kWh/dia' },
      { label: 'Temperatura Interna', value: '23.1', unit: '°C' },
    ],
    smartFeatures: [
      'Biorreatores com algas costeiras na fachada para filtragem de ar',
      'Bacia de pesquisa ligada diretamente à água salobra do Capibaribe',
      'Cobertura 100% solar com terraço de restinga nativa',
    ],
    energyGenerationKw: 1050,
    energyConsumptionKw: 590,
    efficiencyRating: 'A+++ Carbon Negative',
    actions: [
      { id: 'opt_algae', label: 'Calibrar Oxigenação dos Tanques de Mangue', type: 'optimize' },
    ],
  },
  {
    id: 'ev_hub_innovation',
    name: 'Eletroposto Solar Cais do Apolo',
    category: 'ev_station',
    districtId: 'inovacao',
    districtName: 'Polo Porto Digital & IA 2050',
    position: [12, 0, 22],
    description: 'Estação de recarga ultrarrápida integrada ao Cais, alimentada por cobertura solar fotovoltaica e baterias locais.',
    status: 'online',
    metrics: [
      { label: 'Carregadores Ativos', value: '15 de 16', unit: 'postos' },
      { label: 'Potência Fornecida', value: '3.150', unit: 'kW' },
      { label: 'Energia 100% Solar', value: 'Sim', isPositive: true },
      { label: 'Tempo Médio Recarga', value: '7.8', unit: 'min' },
    ],
    smartFeatures: [
      'Recarga bidirecional V2G conectada à rede elétrica de Recife',
      'Carregamento por indução no piso para táxis autônomos',
      'Integração com o aplicativo municipal Conecta Recife 2050',
    ],
    actions: [
      { id: 'opt_v2g', label: 'Ativar Injeção V2G de Apoio à Rede', type: 'toggle' },
    ],
  },
  {
    id: 'smart_pole_5g_1',
    name: 'Poste Conectado Marco Zero 5G-01',
    category: 'smart_pole',
    districtId: 'inovacao',
    districtName: 'Polo Porto Digital & IA 2050',
    position: [8, 0, 16],
    description: 'Poste multifunção com luminária LED inteligente, célula 5G, câmera de segurança pública e sensor meteorológico costeiro.',
    status: 'online',
    metrics: [
      { label: 'Intensidade LED', value: 'Adaptativa (Luz Solar)', unit: 'sensor' },
      { label: 'Nós IoT Conectados', value: '542', unit: 'sensores' },
      { label: 'Umidade do Ar', value: '68%', unit: 'costeira' },
    ],
    smartFeatures: [
      'Sensor acústico e térmico para detecção antecipada de eventos',
      'Totem informativo turístico holográfico sobre o Bairro do Recife',
    ],
    actions: [
      { id: 'opt_led', label: 'Calibrar Luminosidade Dinâmica', type: 'optimize' },
    ],
  },

  // CENTRO BEIRA-RIO & CAIS CAPIBARIBE (FINANCEIRO)
  {
    id: 'bldg_helix_tower',
    name: 'Torre Beira-Rio Capibaribe 2050',
    category: 'building',
    districtId: 'financeiro',
    districtName: 'Centro Beira-Rio & Cais Capibaribe',
    position: [-16, 0, 16],
    description: 'O ícone vertical da orla fluvial de Recife. Arquitetura aerodinâmica com microturbinas eólicas que captam os ventos alísios do litoral.',
    status: 'otimizado',
    metrics: [
      { label: 'Geração Eólica/Solar', value: '2.450', unit: 'kWh/dia', trend: 'up', isPositive: true },
      { label: 'Consumo Atual', value: '1.810', unit: 'kW' },
      { label: 'Ocupação', value: '4.800', unit: 'pessoas' },
      { label: 'Captura Ventos Alísios', value: '18 nós médios', isPositive: true },
    ],
    smartFeatures: [
      'Duto central aerodinâmico com turbinas eólicas verticais integradas',
      'Estrutura sobre pilotis modernos liberando a calçada para circulação pública',
      'Jardins verticais suspensos com orquídeas e bromélias da Mata Atlântica',
    ],
    energyGenerationKw: 2450,
    energyConsumptionKw: 1810,
    efficiencyRating: 'LEED Tropical Platinum',
    actions: [
      { id: 'opt_turbines', label: 'Otimizar Ângulo das Turbinas de Vento', type: 'optimize' },
    ],
  },
  {
    id: 'bldg_fintech_spire',
    name: 'Complexo Cais Estelita Inteligente',
    category: 'building',
    districtId: 'financeiro',
    districtName: 'Centro Beira-Rio & Cais Capibaribe',
    position: [-24, 0, 24],
    description: 'Complexo empresarial à beira da bacia do Pina, construído com brises móveis e integração total com o transporte fluvial.',
    status: 'online',
    metrics: [
      { label: 'Geração Solar', value: '1.340', unit: 'kWh/dia' },
      { label: 'Eficiência Térmica', value: '96%' },
      { label: 'Consumo', value: '980', unit: 'kW' },
    ],
    smartFeatures: [
      'Brises fotovoltaicos que acompanham a trajetória do sol equatorial',
      'Geotermia marinha para resfriamento de data centers',
    ],
    energyGenerationKw: 1340,
    energyConsumptionKw: 980,
    efficiencyRating: 'Net-Zero A++++',
    actions: [
      { id: 'opt_shades', label: 'Ajustar Brises para Sol da Tarde', type: 'optimize' },
    ],
  },
  {
    id: 'smart_traffic_junction',
    name: 'Semáforo Inteligente Adaptativo & Câmera V2X',
    category: 'traffic_light',
    districtId: 'financeiro',
    districtName: 'Cruzamento Central & Avenida Beira-Rio',
    position: [4.2, 0, 1.2],
    description: 'Sistema semafórico adaptativo 2050 com lentes LED dinâmicas de 3 fases, cronômetro regressivo para pedestres, radar LiDAR de fluxo e prioridade V2X automática para BRT elétrico e ciclistas.',
    status: 'otimizado',
    metrics: [
      { label: 'Tempo Médio de Espera', value: '2.1', unit: 's', trend: 'down', isPositive: true },
      { label: 'Fluxo Veicular', value: '184', unit: 'veíc/min' },
      { label: 'Ciclo Adaptativo', value: '14.0s (Sincronizado)', isPositive: true },
      { label: 'Segurança Ciclistas & Pedestres', value: '100% Zero Acidentes', isPositive: true },
    ],
    smartFeatures: [
      'Ciclo dinâmico com iluminação LED tricolor sincronizada Norte-Sul e Leste-Oeste',
      'Prioridade V2X em tempo real para o BRT elétrico ConectaBus 2050',
      'Radar LiDAR e visão computacional integrados na haste superior para detecção de pedestres',
      'Faixa de travessia inteligente com iluminação de solo e temporizador regressivo',
    ],
    actions: [
      { id: 'opt_greenwave', label: 'Ativar Onda Verde Corredor Norte-Sul', type: 'optimize' },
      { id: 'opt_ped_priority', label: 'Priorizar Travessia de Pedestres e Ciclovia', type: 'optimize' },
    ],
  },

  // ECO-BAIRRO TROPICAL BOA VIAGEM (RESIDENCIAL)
  {
    id: 'bldg_timber_residence',
    name: 'Condomínio Bioclimático Brisa do Mar',
    category: 'building',
    districtId: 'residencial',
    districtName: 'Eco-Bairro Tropical Boa Viagem',
    position: [-16, 0, -16],
    description: 'Residencial bioclimático com paredes de cobogós de cerâmica clara, varandas profundas sombreadas, coqueiros no térreo e telhados solares.',
    status: 'otimizado',
    metrics: [
      { label: 'Geração Solar', value: '920', unit: 'kWh/dia', trend: 'up', isPositive: true },
      { label: 'Economia de Energia AC', value: '-62% (Ventilação Natural)', isPositive: true },
      { label: 'Consumo Médio', value: '380', unit: 'kW' },
      { label: 'Reúso de Água Pluvial', value: '98%', isPositive: true },
    ],
    smartFeatures: [
      'Cobogós vazados que maximizam a iluminação difusa sem ganho térmico',
      'Varandas escalonadas que criam autosombreamento permanente',
      'Captação de água das chuvas tropicais para irrigação de jardins',
    ],
    energyGenerationKw: 920,
    energyConsumptionKw: 380,
    efficiencyRating: 'Positive Energy Building (PEB)',
    actions: [
      { id: 'opt_ventilation', label: 'Ativar Exaustão Térmica Noturna', type: 'optimize' },
    ],
  },
  {
    id: 'smart_waste_station_1',
    name: 'Central Pneumática Boa Viagem Limpa',
    category: 'smart_waste',
    districtId: 'residencial',
    districtName: 'Eco-Bairro Tropical Boa Viagem',
    position: [-22, 0, -8],
    description: 'Sistema subterrâneo a vácuo para recolhimento de resíduos das praias e residências, eliminando caminhões de lixo da orla.',
    status: 'online',
    metrics: [
      { label: 'Nível de Resíduos', value: '24%', isPositive: true },
      { label: 'Eliminação de Odores', value: '100% Selado a Vácuo', isPositive: true },
      { label: 'Reciclagem de Plásticos', value: '99.2%', isPositive: true },
    ],
    smartFeatures: [
      'Coleta por sucção a vácuo de alta velocidade até o centro de reciclagem',
      'Crédito automático no IPTU Verde para moradores que separam resíduos',
    ],
    actions: [
      { id: 'opt_flush', label: 'Efetuar Sucção Preventiva de Dutos', type: 'optimize' },
    ],
  },
  {
    id: 'sensor_aqi_residential',
    name: 'Estação Costeira Mar & Mangue',
    category: 'sensor_aqi',
    districtId: 'residencial',
    districtName: 'Eco-Bairro Tropical Boa Viagem',
    position: [-8, 0, -22],
    description: 'Monitoramento atmosférico contínuo da salinidade, ozônio, material particulado e brisa marinha.',
    status: 'online',
    metrics: [
      { label: 'Índice AQI', value: '12', unit: 'Excelente', isPositive: true },
      { label: 'Qualidade do Ar', value: 'Puro do Atlântico', isPositive: true },
      { label: 'Velocidade do Vento', value: '14.5', unit: 'km/h' },
    ],
    smartFeatures: [
      'Sensor óptico a laser de partículas finas PM2.5 e aerossóis marinhos',
      'Alerta preventivo de ressacas e marés altas em sincronia com tábua de marés',
    ],
    actions: [
      { id: 'opt_report', label: 'Consultar Tábua de Marés e Qualidade', type: 'inspect' },
    ],
  },
  {
    id: 'park_residential_boa_viagem',
    name: 'Parque Residencial & Pet Garden das Acácias',
    category: 'park',
    districtId: 'residencial',
    districtName: 'Eco-Bairro Tropical Boa Viagem',
    position: [-22, 0, -14],
    description: 'Parque urbano ecológico integrado ao condomínio residencial, com biopiscina esponja, pista de caminhada permeável, pergolados solares, árvores floridas nativas, área pet integrada e bebedouros inteligentes.',
    status: 'otimizado',
    metrics: [
      { label: 'Efeito Ilha de Calor', value: '-2.8°C', isPositive: true },
      { label: 'Área Verde Permeável', value: '4.200', unit: 'm²', isPositive: true },
      { label: 'Pets & Animais Ativos', value: '38 pets cadastrados', isPositive: true },
      { label: 'Retenção Hídrica Esponja', value: '99.4%', isPositive: true },
    ],
    smartFeatures: [
      'Bebedouros automáticos com reconhecimento e hidratação para pets e fauna local',
      'Iluminação solar dinâmica que respeita o ritmo circadiano dos pássaros e animais',
      'Microaspersores inteligentes alimentados por reúso pluvial para resfriamento bioclimático',
      'Espaço Pet com circuito agility ecológico e sensores biométricos de bem-estar',
    ],
    actions: [
      { id: 'opt_irrigation', label: 'Ativar Microaspersão Bioclimática do Parque', type: 'optimize' },
      { id: 'opt_pet_station', label: 'Checar Status dos Bebedouros Inteligentes', type: 'inspect' },
    ],
  },

  // PARQUE LINEAR CAPIBARIBE & BACIA DO PINA
  {
    id: 'transit_hub_central',
    name: 'Estação Fluvial & Terminal Solar Capibaribe',
    category: 'transit_hub',
    districtId: 'parque',
    districtName: 'Parque Linear Capibaribe & Bacia do Pina',
    position: [16, 0, -16],
    description: 'Píer de catamarãs elétricos solares com conexão direta para ciclovias, bicicletas compartilhadas e bondes autônomos.',
    status: 'otimizado',
    metrics: [
      { label: 'Catamarãs Solares Ativos', value: '8 embarcações', isPositive: true },
      { label: 'Passageiros Fluviais / Hora', value: '14.200', unit: 'usuários' },
      { label: 'Bicicletas na Estação', value: '120', unit: 'bikes elétricas' },
      { label: 'Emissões Fluviais', value: '0 (100% Elétrico Solar)', isPositive: true },
    ],
    smartFeatures: [
      'Píer flutuante que se adapta às oscilações da maré do Capibaribe',
      'Recarga ultrarrápida por indução nos pontos de atracação dos catamarãs',
      'Integração total do bilhete único metropolitano de Recife',
    ],
    actions: [
      { id: 'opt_frequency', label: 'Despachar Catamarã Solar Expresso', type: 'optimize' },
    ],
  },
  {
    id: 'water_buoy_river',
    name: 'Boia Biomonitora Rio Capibaribe Vivo',
    category: 'water_buoy',
    districtId: 'parque',
    districtName: 'Parque Linear Capibaribe & Bacia do Pina',
    position: [24, 0, -8],
    description: 'Estação aquática autônoma de despoluição e análise físico-química das águas do Capibaribe.',
    status: 'online',
    metrics: [
      { label: 'Oxigênio Dissolvido (OD)', value: '8.9', unit: 'mg/L (Ótimo)', isPositive: true },
      { label: 'Retorno da Fauna Aquática', value: 'Robalos e Garças confirmados', isPositive: true },
      { label: 'Turbidez', value: '1.8', unit: 'NTU', isPositive: true },
      { label: 'Temperatura da Água', value: '26.4', unit: '°C' },
    ],
    smartFeatures: [
      'Microaeradores solares que injetam microbolhas de oxigênio na coluna d’água',
      'Transmissão via satélite para o centro de gestão de bacias hidrográficas',
    ],
    actions: [
      { id: 'opt_aerator', label: 'Acionar Microaerador Solar no Rio', type: 'toggle' },
    ],
  },
];

export const INITIAL_ALERTS: CityAlert[] = [
  {
    id: 'alt_1',
    timestamp: '10:28:15',
    level: 'success',
    title: 'Geração Solar Tropical no Ápice',
    description: 'Sol pleno em Recife gerando 168 MW limpos em telhados fotovoltaicos e cobogós solares.',
    district: 'Polo Porto Digital & Geral',
  },
  {
    id: 'alt_2',
    timestamp: '10:20:04',
    level: 'info',
    title: 'Catamarã Solar Capibaribe 04 Atracado',
    description: 'Desembarque de 240 passageiros no Píer Marco Zero sem atrasos.',
    district: 'Parque Linear Capibaribe',
  },
  {
    id: 'alt_3',
    timestamp: '10:11:38',
    level: 'success',
    title: 'Brisa Marinha & Alívio Térmico',
    description: 'Ventos alísios de 16 nós acionaram ventilação passiva em 88% dos edifícios.',
    district: 'Eco-Bairro Boa Viagem',
  },
  {
    id: 'alt_4',
    timestamp: '10:02:50',
    level: 'info',
    title: 'Ponte Estaiada Capibaribe Fluida',
    description: 'Tráfego 100% fluido de veículos elétricos e ciclistas cruzando o rio sem retenções.',
    district: 'Centro Beira-Rio',
  },
];

export const HISTORICAL_ENERGY_DATA = [
  { hour: '00h', solar: 0, windAndGrid: 52, consumption: 41, battery: 14 },
  { hour: '04h', solar: 0, windAndGrid: 48, consumption: 36, battery: 16 },
  { hour: '08h', solar: 74, windAndGrid: 45, consumption: 95, battery: 8 },
  { hour: '12h', solar: 168, windAndGrid: 30, consumption: 128, battery: -42 },
  { hour: '16h', solar: 110, windAndGrid: 32, consumption: 114, battery: -18 },
  { hour: '20h', solar: 12, windAndGrid: 78, consumption: 102, battery: 22 },
];

export const TOUR_LANDMARKS: TourLandmark[] = [
  {
    id: 'tour_nexus',
    name: 'Polo Tecnológico Porto Digital & Torre Nexus',
    district: 'Polo Porto Digital & IA 2050',
    tagline: 'O maior parque tecnológico urbano e berço da IA tropical brasileira',
    description: 'Edifícios históricos integrados a arranha-céus bioclimáticos com cobogós solares e centros de computação quântica.',
    highlightMetric: '1.200 Startups & 98% Energia Solar',
  },
  {
    id: 'tour_marco_zero',
    name: 'Praça Marco Zero & Rosa dos Ventos',
    district: 'Centro Cívico & Cultural',
    tagline: 'O coração histórico e o quilômetro zero da inovação urbana',
    description: 'Piso geométrico icônico revitalizado com captação de energia piezoelétrica e espaço aberto de convivência cidadã.',
    highlightMetric: '100% Pedestres e Mobilidade Limpa',
  },
  {
    id: 'tour_ponte',
    name: 'Ponte Estaiada Capibaribe & Corredor V2X',
    district: 'Centro Beira-Rio & Cais Capibaribe',
    tagline: 'Engenharia sustentável com mobilidade multimodal de emissão zero',
    description: 'Pilares inclinados com cabos fotoluminescentes sobre o Rio Capibaribe, com circulação contínua de BRT elétrico, ciclovia e catamarã solar.',
    highlightMetric: 'Zero Colisões & Prioridade V2X 100%',
  },
  {
    id: 'tour_residencia',
    name: 'Eco-Bairro Tropical Boa Viagem & Pet Garden',
    district: 'Eco-Bairro Tropical Boa Viagem',
    tagline: 'Habitação de alto conforto com ventilação natural pelas brisas alísias',
    description: 'Varandas escalonadas com vegetação nativa, cobogós vazados, parque residencial com bio-lago e circuito pet das Acácias.',
    highlightMetric: '-62% Consumo AC por Ventilação Passiva',
  },
  {
    id: 'tour_parque_gracas',
    name: 'Parque das Graças & Terminal Fluvial Solar',
    district: 'Parque Linear Capibaribe & Manguezal',
    tagline: 'Parque linear e transporte aquaviário net-zero',
    description: 'Preservação de manguezais, ipês amarelos em flor, ciclovias permeáveis e docas de recarga por indução para barcos elétricos.',
    highlightMetric: '42% Cobertura Verde Municipal',
  },
];
