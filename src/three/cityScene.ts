/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SmartLayer, TimeOfDay, SmartObjectData } from '../types/city';
import { DISTRICTS, SMART_OBJECTS } from '../data/cityData';

export interface SceneCallbacks {
  onSelectObject: (obj: SmartObjectData | null) => void;
  onHoverObject?: (obj: SmartObjectData | null) => void;
}

export class SmartCityScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDisposed: boolean = false;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;

  // Interactivity
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-999, -999);
  private interactiveMeshes: THREE.Object3D[] = [];
  private callbacks: SceneCallbacks;
  private selectedObject: SmartObjectData | null = null;
  private hoveredObject: SmartObjectData | null = null;
  private selectionMarker: THREE.Group;

  // Camera transition
  private isTransitioningCamera: boolean = false;
  private camTargetPos = new THREE.Vector3(45, 34, 45);
  private camTargetLookAt = new THREE.Vector3(0, 0, 0);

  // Dynamic moving actors
  private vehicles: {
    mesh: THREE.Group;
    path: THREE.Vector3[];
    progress: number;
    speed: number;
    isFlotante?: boolean;
  }[] = [];

  private pedestrians: {
    mesh: THREE.Group;
    origin: THREE.Vector3;
    angle: number;
    radius: number;
    speed: number;
    isLinear?: boolean;
    startPos?: THREE.Vector3;
    endPos?: THREE.Vector3;
    progress?: number;
    isSitting?: boolean;
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
  }[] = [];

  private animals: {
    mesh: THREE.Group;
    type: 'dog' | 'capybara' | 'bird';
    origin: THREE.Vector3;
    angle: number;
    radius: number;
    speed: number;
    altitude?: number;
    leftWing?: THREE.Mesh;
    rightWing?: THREE.Mesh;
    tail?: THREE.Mesh;
    headGroup?: THREE.Group;
  }[] = [];

  // Animated Intelligent Traffic Signals
  private trafficSignals: {
    axis: 'NS' | 'EW';
    redMat: THREE.MeshStandardMaterial;
    yellowMat: THREE.MeshStandardMaterial;
    greenMat: THREE.MeshStandardMaterial;
    pedWalkMat?: THREE.MeshStandardMaterial;
    pedStopMat?: THREE.MeshStandardMaterial;
  }[] = [];

  // Animated Capibaribe water & Catamaran
  private riverMesh: THREE.Mesh | null = null;
  private catamaranMesh: THREE.Group | null = null;
  private catamaranProgress: number = 0;

  // Visual layers groups
  private energyLayerGroup = new THREE.Group();
  private mobilityLayerGroup = new THREE.Group();
  private environmentLayerGroup = new THREE.Group();
  private connectivityLayerGroup = new THREE.Group();
  private wasteLayerGroup = new THREE.Group();

  // Pulse & flow animations
  private timeElapsed = 0;
  private energyPulses: { mesh: THREE.Mesh; path: THREE.LineCurve3; t: number; speed: number }[] = [];
  private glowingMaterials: THREE.MeshStandardMaterial[] = [];
  private windowMaterials: THREE.MeshStandardMaterial[] = [];
  private streetLightsGroup = new THREE.Group();

  // Active layers state
  private activeLayers: Set<SmartLayer> = new Set(['energia', 'mobilidade', 'ambiente', 'conectividade', 'residuos']);
  private currentTimeOfDay: TimeOfDay = 'dia';

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.32; // Vibrant tropical daylight
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Setup Scene & Camera (Bright Recife sunny day sky by default)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#67e8f9'); // Radiant tropical blue
    this.scene.fog = new THREE.FogExp2('#cffafe', 0.0055); // Tropical soft horizon haze

    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.5,
      350
    );
    this.camera.position.set(46, 35, 46);

    // 4. Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // fallback
    }

    // 5. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0, 0);
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 140;
    this.controls.addEventListener('start', () => {
      this.isTransitioningCamera = false;
    });

    // 6. Radiant Tropical Sun Lighting Rig
    this.dirLight = new THREE.DirectionalLight(0xfffaed, 4.2); // Intense tropical sunshine
    this.dirLight.position.set(45, 60, 32);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 160;
    const d = 52;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // Tropical sky hemisphere fill + warm ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xfef08a, 1.8);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    // 7. Layer groups added to scene
    this.scene.add(this.energyLayerGroup);
    this.scene.add(this.mobilityLayerGroup);
    this.scene.add(this.environmentLayerGroup);
    this.scene.add(this.connectivityLayerGroup);
    this.scene.add(this.wasteLayerGroup);
    this.scene.add(this.streetLightsGroup);

    // 8. Selection Reticle
    this.selectionMarker = this.createSelectionMarker();
    this.selectionMarker.visible = false;
    this.scene.add(this.selectionMarker);

    // 9. Build Recife Smart City 2050 Model
    this.buildCityTerrain();
    this.buildRoadNetworkAndBikeLanes();
    this.buildBridgesOverCapibaribe();
    this.buildDistrictsAndBuildings();
    this.buildSmartInfrastructure();
    this.buildFoliageAndParks();
    this.buildTrafficAndCitizens();
    this.buildLayerOverlays();

    // 10. Event Listeners
    window.addEventListener('resize', this.onResize);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

    // Start loop
    this.startLoop();
  }

  // ==========================================
  // ROAD & BRIDGE HEIGHT CALCULATION
  // Ensures cars, buses and bikes travel OVER the bridge,
  // while the catamaran boat passes freely UNDER the bridge arch
  // ==========================================
  private getRoadSurfaceY(x: number, z: number): number {
    // Central Avenue corridor (|x| <= 4.6) crossing the Capibaribe Bridge (-14.5 <= z <= 0.5)
    if (Math.abs(x) <= 4.6 && z >= -14.5 && z <= 0.5) {
      const progress = (z - (-14.5)) / 15.0; // 0 to 1
      // Graceful parabolic arch rising up to 1.65m above standard road
      const arch = Math.sin(progress * Math.PI) * 1.65;
      return 0.12 + arch;
    }

    return 0.12; // Normal asphalt and bike lane elevation
  }

  // ==========================================
  // PROCEDURAL TEXTURE GENERATORS (RECIFE INSPIRED)
  // ==========================================
  private createSolarTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a2540';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    const step = 32;
    for (let x = 0; x <= 256; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    [64, 128, 192].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Iconic Pernambuco Cobogó (Brise vazado bioclimático de Recife)
  private createCobogoTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Warm ceramic base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 256);

    // Cobogó perforated geometric apertures
    ctx.fillStyle = '#1e293b';
    const size = 32;
    for (let x = 4; x < 256; x += size) {
      for (let y = 4; y < 256; y += size) {
        // Cross & circle traditional Recife cobogó motif
        ctx.beginPath();
        ctx.arc(x + 12, y + 12, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillRect(x + 10, y + 2, 4, 20);
        ctx.fillRect(x + 2, y + 10, 20, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Historic Porto Digital Brick & Stone Restoration Texture
  private createPortoDigitalBrickTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Warm terracotta brickwork of Bairro do Recife
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();

      const offset = (y / 16) % 2 === 0 ? 0 : 16;
      for (let x = offset; x < 256; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 16);
        ctx.stroke();
      }
    }

    // Windows with arch headers
    ctx.fillStyle = '#0284c7';
    for (let x = 16; x < 256; x += 64) {
      for (let y = 24; y < 256; y += 64) {
        ctx.fillRect(x, y, 28, 36);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Wave sidewalk texture (Calçadão de Boa Viagem / Marco Zero)
  private createWavePavementTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 256, 256);

    // Black stones wave sinusoidal ribbons
    ctx.fillStyle = '#1e293b';
    for (let y = 0; y < 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y + 20);
      for (let x = 0; x <= 256; x += 16) {
        const wave = Math.sin((x / 256) * Math.PI * 4) * 16;
        ctx.lineTo(x, y + 20 + wave);
      }
      for (let x = 256; x >= 0; x -= 16) {
        const wave = Math.sin((x / 256) * Math.PI * 4) * 16;
        ctx.lineTo(x, y + 36 + wave);
      }
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private createFacadeTexture(type: 'glass' | 'biophilic'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    if (type === 'glass') {
      // Natural coastal reflective glass with warm sun highlights
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < 256; x += 32) {
        for (let y = 0; y < 256; y += 48) {
          ctx.fillStyle = (x + y) % 64 === 0 ? '#38bdf8' : '#0369a1';
          ctx.fillRect(x + 2, y + 2, 28, 44);
          ctx.strokeRect(x + 2, y + 2, 28, 44);
        }
      }
    } else {
      // Biophilic coastal vertical vegetation
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#10b981';
      for (let i = 0; i < 350; i++) {
        const rx = Math.random() * 256;
        const ry = Math.random() * 256;
        ctx.beginPath();
        ctx.arc(rx, ry, 3 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // ==========================================
  // TERRAIN & CAPIBARIBE WATER
  // ==========================================
  private buildCityTerrain() {
    // Master Ground Platform (Coastal Recife topography)
    const groundGeo = new THREE.BoxGeometry(76, 1.2, 76);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean urban pavement base
      roughness: 0.8,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.6;
    ground.receiveShadow = !this.isSoftwareGl;
    this.scene.add(ground);

    // Rio Capibaribe (Luminous tropical coastal waters)
    const riverGeo = new THREE.BoxGeometry(78, 0.5, 8.5);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.92,
    });
    this.riverMesh = new THREE.Mesh(riverGeo, riverMat);
    this.riverMesh.position.set(0, 0.04, -7);
    this.riverMesh.receiveShadow = !this.isSoftwareGl;
    this.scene.add(this.riverMesh);

    // Mangrove & Stone Riverbanks
    [-11.4, -2.6].forEach((zPos) => {
      const bankGeo = new THREE.BoxGeometry(76, 0.28, 0.8);
      const bankMat = new THREE.MeshStandardMaterial({
        color: 0x065f46, // Mangrove green vegetated edge
        roughness: 0.85,
      });
      const bank = new THREE.Mesh(bankGeo, bankMat);
      bank.position.set(0, 0.14, zPos);
      this.scene.add(bank);
    });

    // Marco Zero Compass Rose Paving in the Civic/Inovação Plaza
    const marcoZeroGeo = new THREE.CircleGeometry(4.5, 32);
    const marcoZeroCanvas = document.createElement('canvas');
    marcoZeroCanvas.width = 256;
    marcoZeroCanvas.height = 256;
    const mctx = marcoZeroCanvas.getContext('2d')!;
    mctx.fillStyle = '#d97706';
    mctx.beginPath();
    mctx.arc(128, 128, 124, 0, Math.PI * 2);
    mctx.fill();
    // Compass star
    mctx.fillStyle = '#fef08a';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      mctx.beginPath();
      mctx.moveTo(128, 128);
      mctx.lineTo(128 + Math.cos(a) * 115, 128 + Math.sin(a) * 115);
      mctx.lineTo(128 + Math.cos(a + 0.3) * 35, 128 + Math.sin(a + 0.3) * 35);
      mctx.closePath();
      mctx.fill();
    }
    const marcoZeroTex = new THREE.CanvasTexture(marcoZeroCanvas);
    marcoZeroTex.colorSpace = THREE.SRGBColorSpace;
    const marcoZeroMat = new THREE.MeshStandardMaterial({
      map: marcoZeroTex,
      roughness: 0.6,
    });
    const marcoZeroPlaza = new THREE.Mesh(marcoZeroGeo, marcoZeroMat);
    marcoZeroPlaza.rotation.x = -Math.PI / 2;
    marcoZeroPlaza.position.set(10, 0.05, 10);
    this.scene.add(marcoZeroPlaza);

    // River Aerator Fountains
    [-18, 4, 24].forEach((xPos) => {
      const aeratorGroup = new THREE.Group();
      aeratorGroup.position.set(xPos, 0.1, -7);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.12, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 })
      );
      ring.rotation.x = Math.PI / 2;
      aeratorGroup.add(ring);

      const jet = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 1.4, 12),
        new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.75 })
      );
      jet.position.y = 0.7;
      aeratorGroup.add(jet);

      this.scene.add(aeratorGroup);
    });
  }

  // ==========================================
  // ROAD NETWORK, WAVE CALÇADÃO & BIKE HIGHWAYS
  // ==========================================
  private buildRoadNetworkAndBikeLanes() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.1,
    });

    const bikeLaneMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Ciclovia verde esmeralda
      roughness: 0.5,
    });

    const wavePavementTex = this.createWavePavementTexture();
    wavePavementTex.repeat.set(1, 12);
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: wavePavementTex,
      roughness: 0.75,
    });

    // Central Avenue (Norte-Sul)
    // Runs from z = 36 to z = -12.5 (South) and z = -1.5 to z = -36 (North of river)
    // The bridge spans z = -12.5 to z = -1.5 seamlessly!
    const southAvenue = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 48.5), roadMat);
    southAvenue.position.set(0, 0.06, 12.25);
    southAvenue.receiveShadow = !this.isSoftwareGl;
    this.scene.add(southAvenue);

    const northAvenue = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 34.5), roadMat);
    northAvenue.position.set(0, 0.06, -18.75);
    northAvenue.receiveShadow = !this.isSoftwareGl;
    this.scene.add(northAvenue);

    // Bike lanes along the avenue
    [-3.3, 3.3].forEach((offset) => {
      const bike = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.11, 72), bikeLaneMat);
      bike.position.set(offset, 0.065, 0);
      this.scene.add(bike);
    });

    // Sidewalks with Boa Viagem wave patterns
    [-4.4, 4.4].forEach((offset) => {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 72), sidewalkMat);
      walk.position.set(offset, 0.08, 0);
      this.scene.add(walk);
    });

    // East-West Boulevard (Avenida Beira-Rio, z = 4)
    const ewRoad = new THREE.Mesh(new THREE.BoxGeometry(72, 0.1, 6), roadMat);
    ewRoad.position.set(0, 0.06, 4);
    ewRoad.receiveShadow = !this.isSoftwareGl;
    this.scene.add(ewRoad);

    [1.7, 6.3].forEach((zPos) => {
      const bikeLane = new THREE.Mesh(new THREE.BoxGeometry(72, 0.11, 0.8), bikeLaneMat);
      bikeLane.position.set(0, 0.065, zPos);
      this.scene.add(bikeLane);
    });
  }

  // ==========================================
  // RECIFE ICONIC ARCHED BRIDGES (PONTE ESTAIADA & ARCOS)
  // Arches smoothly so cars, buses and bicycles ride OVER the bridge,
  // while the solar catamaran sails with wide clearance UNDER the bridge
  // ==========================================
  private buildBridgesOverCapibaribe() {
    // 1. Hero Central Bridge: Ponte Estaiada Capibaribe 2050 (Avenida Central, x = 0)
    const bridgeGroup = new THREE.Group();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.2,
    });
    const bikeMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.5,
    });
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.7,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.25,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      metalness: 0.9,
    });

    // Build the arched bridge deck out of 20 smooth curved segments from z = -14.5 to z = 0.5
    const numSegs = 20;
    const startZ = -14.5;
    const endZ = 0.5;
    const segStep = (endZ - startZ) / numSegs;

    for (let i = 0; i < numSegs; i++) {
      const z1 = startZ + i * segStep;
      const z2 = startZ + (i + 1) * segStep;
      const midZ = (z1 + z2) / 2;
      const y1 = this.getRoadSurfaceY(0, z1);
      const y2 = this.getRoadSurfaceY(0, z2);
      const midY = (y1 + y2) / 2;

      const segLength = Math.hypot(z2 - z1, y2 - y1) * 1.02;
      const pitch = Math.atan2(y2 - y1, z2 - z1);

      const segGroup = new THREE.Group();
      segGroup.position.set(0, midY, midZ);
      segGroup.rotation.x = pitch;

      // Central vehicle asphalt road (width 6.2m, thickness 0.2m)
      const roadSlab = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.2, segLength), roadMat);
      roadSlab.position.y = -0.1;
      roadSlab.receiveShadow = !this.isSoftwareGl;
      roadSlab.castShadow = !this.isSoftwareGl;
      segGroup.add(roadSlab);

      // Dedicated green bike lanes (at x = -3.35 and 3.35, width 0.7m)
      [-3.35, 3.35].forEach((bx) => {
        const bikeSlab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.21, segLength), bikeMat);
        bikeSlab.position.set(bx, -0.095, 0);
        segGroup.add(bikeSlab);
      });

      // Outer pedestrian sidewalks (at x = -4.05 and 4.05, width 0.7m)
      [-4.05, 4.05].forEach((sx) => {
        const walkSlab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.23, segLength), sidewalkMat);
        walkSlab.position.set(sx, -0.085, 0);
        segGroup.add(walkSlab);
      });

      // Illuminated safety railings on the outer edge (at x = ±4.4)
      [-4.4, 4.4].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, segLength), railMat);
        rail.position.set(rx, 0.25, 0);
        segGroup.add(rail);
      });

      // Supporting steel arch beams underneath the deck
      [-4.45, 4.45].forEach((bx) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, segLength), steelMat);
        beam.position.set(bx, -0.22, 0);
        segGroup.add(beam);
      });

      bridgeGroup.add(segGroup);
    }

    // Concrete Abutments on the land riverbanks (at z = -14.5 and z = 0.5)
    [-14.5, 0.5].forEach((az) => {
      const abutment = new THREE.Mesh(
        new THREE.BoxGeometry(9.4, 0.8, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
      );
      abutment.position.set(0, 0.2, az);
      bridgeGroup.add(abutment);
    });

    // Twin iconic Cable-Stayed Pylons located at the river edge (x = ±4.8, z = -7)
    // NOTE: Set cleanly outside the river channel so boat navigation is 100% unobstructed!
    [-4.8, 4.8].forEach((px) => {
      const pylonMast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 9.5, 12),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.85 })
      );
      pylonMast.position.set(px, 4.5, -7);
      bridgeGroup.add(pylonMast);

      // Radiating stay cables connecting from top of pylon to arched bridge deck
      [-12, -9.5, -4.5, -2].forEach((cz) => {
        const topPt = new THREE.Vector3(px, 8.8, -7);
        const deckPt = new THREE.Vector3(px * 0.92, this.getRoadSurfaceY(0, cz), cz);
        const cable = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.LineCurve3(topPt, deckPt), 8, 0.035, 6, false),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 })
        );
        bridgeGroup.add(cable);
      });
    });

    this.scene.add(bridgeGroup);
  }

  // ==========================================
  // RECIFE 2050 ARCHITECTURE & BUILDINGS
  // ==========================================
  private buildDistrictsAndBuildings() {
    const solarTex = this.createSolarTexture();
    const cobogoTex = this.createCobogoTexture();
    const brickTex = this.createPortoDigitalBrickTexture();
    const glassTex = this.createFacadeTexture('glass');
    const bioTex = this.createFacadeTexture('biophilic');

    // 1. Torre Porto Digital Nexus 2050 (Hero: Inovação / Bairro do Recife)
    this.createPortoDigitalHeroTower({
      id: 'bldg_quantum_tower',
      pos: [16, 0, 16],
      brickTex,
      glassTex,
      cobogoTex,
      solarTex,
    });

    // 2. Bio-Hub Manguezal & Clima (Inovação)
    this.createBiophilicMangroveHub({
      id: 'bldg_biotech_lab',
      pos: [24, 0, 12],
      bioTex,
      solarTex,
      cobogoTex,
    });

    // Secondary buildings in Porto Digital district
    this.createSecondaryRecifeBuilding([25, 0, 24], 14, brickTex, glassTex, solarTex);
    this.createSecondaryRecifeBuilding([8, 0, 24], 10, brickTex, cobogoTex, solarTex);

    // 3. Torre Beira-Rio Capibaribe (Hero: Centro Cívico / Financeiro)
    this.createBeiraRioSkyscraper({
      id: 'bldg_helix_tower',
      pos: [-16, 0, 16],
      height: 30,
      glassTex,
      cobogoTex,
      solarTex,
    });

    // 4. Complexo Cais Estelita Inteligente (Financeiro)
    this.createCaisEstelitaComplex({
      id: 'bldg_fintech_spire',
      pos: [-24, 0, 24],
      glassTex,
      cobogoTex,
      solarTex,
    });

    this.createSecondaryRecifeBuilding([-24, 0, 8], 15, brickTex, glassTex, solarTex);
    this.createSecondaryRecifeBuilding([-8, 0, 24], 12, cobogoTex, glassTex, solarTex);

    // 5. Condomínio Bioclimático Brisa do Mar (Hero: Eco-Bairro Boa Viagem)
    this.createBoaViagemTropicalResidences({
      id: 'bldg_timber_residence',
      pos: [-16, 0, -16],
      cobogoTex,
      solarTex,
    });

    this.createResidentialTropicalCluster([-24, 0, -22], cobogoTex, solarTex);
    this.createResidentialTropicalCluster([-8, 0, -16], cobogoTex, solarTex);
    this.createResidentialTropicalCluster([-16, 0, -25], cobogoTex, solarTex);

    // 5.1 Parque Residencial Boa Viagem & Pet Garden das Acácias
    this.createResidentialPark({
      id: 'park_residential_boa_viagem',
      pos: [-22, 0, -14],
    });

    // 6. Estação Fluvial & Terminal Solar Capibaribe (Parque)
    this.createMarcoZeroFluvialHub({
      id: 'transit_hub_central',
      pos: [16, 0, -16],
      solarTex,
    });
  }

  // --- Hero: Torre Porto Digital Nexus 2050 ---
  private createPortoDigitalHeroTower(props: {
    id: string;
    pos: [number, number, number];
    brickTex: THREE.CanvasTexture;
    glassTex: THREE.CanvasTexture;
    cobogoTex: THREE.CanvasTexture;
    solarTex: THREE.CanvasTexture;
  }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    // 1. Historic Heritage Brick Podium Base (Porto Digital style)
    const baseGeo = new THREE.BoxGeometry(8.5, 3.5, 8.5);
    const baseMat = new THREE.MeshStandardMaterial({
      map: props.brickTex,
      roughness: 0.85,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 1.75;
    base.castShadow = !this.isSoftwareGl;
    group.add(base);

    // 2. Translucent Glass Lobby with Pilotis
    const lobbyGeo = new THREE.BoxGeometry(7.2, 1.8, 7.2);
    const lobbyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
    });
    const lobby = new THREE.Mesh(lobbyGeo, lobbyMat);
    lobby.position.y = 3.5 + 0.9;
    group.add(lobby);

    // 3. Mid-Tower with Solar Cobogós (Bioclimatic cross-ventilation screen)
    const cobogoShaftGeo = new THREE.BoxGeometry(6.5, 9, 6.5);
    const cobogoMat = new THREE.MeshStandardMaterial({
      map: props.cobogoTex,
      roughness: 0.4,
      metalness: 0.2,
    });
    const cobogoShaft = new THREE.Mesh(cobogoShaftGeo, cobogoMat);
    cobogoShaft.position.y = 5.3 + 4.5;
    cobogoShaft.castShadow = !this.isSoftwareGl;
    group.add(cobogoShaft);

    // 4. Upper Glass Spire with Photovoltaic Façade
    const glassTowerGeo = new THREE.BoxGeometry(5.2, 8, 5.2);
    const glassMat = new THREE.MeshStandardMaterial({
      map: props.glassTex,
      roughness: 0.15,
      metalness: 0.85,
    });
    this.windowMaterials.push(glassMat);
    const glassTower = new THREE.Mesh(glassTowerGeo, glassMat);
    glassTower.position.y = cobogoShaft.position.y + 4.5 + 4.0;
    glassTower.castShadow = !this.isSoftwareGl;
    group.add(glassTower);

    // 5. Rooftop Solar Photovoltaic Canopy
    const solGeo = new THREE.BoxGeometry(6.2, 0.25, 6.2);
    const solMat = new THREE.MeshStandardMaterial({
      map: props.solarTex,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });
    const sol = new THREE.Mesh(solGeo, solMat);
    sol.position.y = glassTower.position.y + 4.15;
    group.add(sol);

    // 6. Helipad for autonomous delivery drones
    const heliPad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 0.4 })
    );
    heliPad.position.y = sol.position.y + 0.2;
    group.add(heliPad);

    group.userData = { id: props.id, type: 'building' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  // --- Hero: Torre Beira-Rio Capibaribe (Slender, Pilotis & Wind Relief) ---
  private createBeiraRioSkyscraper(props: {
    id: string;
    pos: [number, number, number];
    height: number;
    glassTex: THREE.CanvasTexture;
    cobogoTex: THREE.CanvasTexture;
    solarTex: THREE.CanvasTexture;
  }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    // 1. Modern Concrete Pilotis on Ground Floor (Permite passagem da brisa do mar)
    const pilotisCoords = [
      [-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8],
      [0, -2.8], [0, 2.8], [-2.8, 0], [2.8, 0]
    ];
    pilotisCoords.forEach(([px, pz]) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 3.2, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 })
      );
      col.position.set(px, 1.6, pz);
      col.castShadow = !this.isSoftwareGl;
      group.add(col);
    });

    // 2. Tower Body with Deep Tropical Balconies & Aerodynamic Wind Slots
    const floors = 6;
    const floorH = props.height / floors;
    for (let f = 0; f < floors; f++) {
      const scale = 1 - (f / floors) * 0.25;
      const w = 6.4 * scale;

      // Glass core
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(w, floorH - 0.4, w),
        new THREE.MeshStandardMaterial({ map: props.glassTex, roughness: 0.15, metalness: 0.8 })
      );
      core.position.y = 3.2 + f * floorH + floorH / 2;
      core.castShadow = !this.isSoftwareGl;
      group.add(core);

      // Deep shading balcony slabs with hanging plants
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(w + 1.2, 0.2, w + 1.2),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
      );
      slab.position.y = 3.2 + f * floorH;
      group.add(slab);

      // Cobogó privacy and shade panels on west side (afternoon sun)
      const cobogoWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, floorH - 0.6, w),
        new THREE.MeshStandardMaterial({ map: props.cobogoTex, roughness: 0.5 })
      );
      cobogoWall.position.set(w / 2 + 0.45, 3.2 + f * floorH + floorH / 2, 0);
      group.add(cobogoWall);
    }

    // Aerodynamic crown spire with micro wind turbines
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.6, 5.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9 })
    );
    spire.position.y = props.height + 6.0;
    group.add(spire);

    group.userData = { id: props.id, type: 'building' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  // --- Hero: Condomínio Bioclimático Brisa do Mar (Boa Viagem) ---
  private createBoaViagemTropicalResidences(props: {
    id: string;
    pos: [number, number, number];
    cobogoTex: THREE.CanvasTexture;
    solarTex: THREE.CanvasTexture;
  }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    // Modular stepped residential blocks (Cobogó branco + madeira massiva)
    const blocks = [
      { x: -2.2, z: -2.2, h: 10 },
      { x: 2.2, z: -2.2, h: 8 },
      { x: -2.2, z: 2.2, h: 7 },
      { x: 2.2, z: 2.2, h: 9 },
    ];

    blocks.forEach((b) => {
      const geo = new THREE.BoxGeometry(4.0, b.h, 4.0);
      const mat = new THREE.MeshStandardMaterial({
        map: props.cobogoTex,
        roughness: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      mesh.castShadow = !this.isSoftwareGl;
      mesh.receiveShadow = !this.isSoftwareGl;
      group.add(mesh);

      // Angled Solar Roof
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.25, 4.4),
        new THREE.MeshStandardMaterial({ map: props.solarTex, roughness: 0.2, metalness: 0.7 })
      );
      roof.position.set(b.x, b.h + 0.15, b.z);
      roof.rotation.x = 0.08;
      group.add(roof);

      // Hanging flower balcony (Bougainvillea / Primavera tropical)
      const balc = new THREE.Mesh(
        new THREE.BoxGeometry(4.3, 0.35, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xdb2777 }) // Vibrant bougainvillea pink
      );
      balc.position.set(b.x, b.h * 0.55, b.z + 1.8);
      group.add(balc);
    });

    group.userData = { id: props.id, type: 'building' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  // --- Bio-Hub Manguezal & Clima ---
  private createBiophilicMangroveHub(props: {
    id: string;
    pos: [number, number, number];
    bioTex: THREE.CanvasTexture;
    solarTex: THREE.CanvasTexture;
    cobogoTex: THREE.CanvasTexture;
  }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1, 8),
      new THREE.MeshStandardMaterial({ color: 0x064e3b })
    );
    base.position.y = 0.5;
    group.add(base);

    // Twin organic curved towers
    const t1 = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 12, 6),
      new THREE.MeshStandardMaterial({ map: props.bioTex, roughness: 0.5 })
    );
    t1.position.set(-1.8, 7, 0);
    t1.castShadow = !this.isSoftwareGl;

    const t2 = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 9, 6),
      new THREE.MeshStandardMaterial({ map: props.cobogoTex, roughness: 0.4 })
    );
    t2.position.set(1.8, 5.5, 0);
    t2.castShadow = !this.isSoftwareGl;
    group.add(t1, t2);

    // Skybridge connecting them
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.2, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
    );
    bridge.position.set(0, 7.5, 0);
    group.add(bridge);

    group.userData = { id: props.id, type: 'building' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  // --- Cais Estelita Complex ---
  private createCaisEstelitaComplex(props: {
    id: string;
    pos: [number, number, number];
    glassTex: THREE.CanvasTexture;
    cobogoTex: THREE.CanvasTexture;
    solarTex: THREE.CanvasTexture;
  }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    const main = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 18, 6.2),
      new THREE.MeshStandardMaterial({ map: props.glassTex, roughness: 0.2, metalness: 0.8 })
    );
    main.position.y = 9;
    main.castShadow = !this.isSoftwareGl;
    group.add(main);

    // Shading side screen
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 16, 0.2),
      new THREE.MeshStandardMaterial({ map: props.cobogoTex, roughness: 0.5 })
    );
    screen.position.set(0, 9, 3.2);
    group.add(screen);

    group.userData = { id: props.id, type: 'building' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  // --- Estação Fluvial & Píer Capibaribe ---
  private createMarcoZeroFluvialHub(props: { id: string; pos: [number, number, number]; solarTex: THREE.CanvasTexture }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    // Curved tropical wave canopy
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 10, 32, 1, true, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.8, side: THREE.DoubleSide })
    );
    shell.rotation.z = Math.PI / 2;
    shell.rotation.y = Math.PI / 2;
    shell.position.y = 2.8;
    group.add(shell);

    // Solar skin
    const sol = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.2, 4.2),
      new THREE.MeshStandardMaterial({ map: props.solarTex, roughness: 0.2, metalness: 0.8, emissive: 0x0284c7, emissiveIntensity: 0.4 })
    );
    sol.position.y = 5.6;
    group.add(sol);

    // Pier Deck
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(11, 0.4, 7),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    deck.position.y = 0.2;
    group.add(deck);

    // Pontoons extending toward the water
    const pontoon = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 5),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 })
    );
    pontoon.position.set(0, 0.12, 5.5);
    group.add(pontoon);

    group.userData = { id: props.id, type: 'transit_hub' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  private createSecondaryRecifeBuilding(
    pos: [number, number, number],
    height: number,
    baseTex: THREE.CanvasTexture,
    upperTex: THREE.CanvasTexture,
    solarTex: THREE.CanvasTexture
  ) {
    const group = new THREE.Group();
    group.position.set(...pos);

    const bldg = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, height, 4.4),
      new THREE.MeshStandardMaterial({ map: baseTex, roughness: 0.5 })
    );
    bldg.position.y = height / 2;
    bldg.castShadow = !this.isSoftwareGl;
    group.add(bldg);

    const sol = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.2, 4.2),
      new THREE.MeshStandardMaterial({ map: solarTex, roughness: 0.2, metalness: 0.7 })
    );
    sol.position.y = height + 0.1;
    group.add(sol);

    this.scene.add(group);
  }

  private createResidentialTropicalCluster(
    pos: [number, number, number],
    cobogoTex: THREE.CanvasTexture,
    solarTex: THREE.CanvasTexture
  ) {
    const group = new THREE.Group();
    group.position.set(...pos);

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 6.5, 4.2),
      new THREE.MeshStandardMaterial({ map: cobogoTex, roughness: 0.5 })
    );
    block.position.y = 3.25;
    block.castShadow = !this.isSoftwareGl;
    group.add(block);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 1.4, 4),
      new THREE.MeshStandardMaterial({ map: solarTex, roughness: 0.3, metalness: 0.6 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 7.2;
    group.add(roof);

    this.scene.add(group);
  }

  // --- Parque Residencial Boa Viagem & Pet Garden das Acácias ---
  private createResidentialPark(props: { id: string; pos: [number, number, number] }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    // 1. Lush Green Park Lawn with rounded elevation
    const lawnGeo = new THREE.BoxGeometry(15, 0.16, 11);
    const lawnMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Lush emerald green lawn
      roughness: 0.85,
    });
    const lawn = new THREE.Mesh(lawnGeo, lawnMat);
    lawn.position.y = 0.08;
    lawn.receiveShadow = !this.isSoftwareGl;
    group.add(lawn);

    // 2. Permeable Curved Stone Walkway through the park
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.9,
    });
    const path1 = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.17, 1.6), pathMat);
    path1.position.set(0, 0.085, 0);
    group.add(path1);

    const pathCross = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.17, 9.5), pathMat);
    pathCross.position.set(-1.5, 0.085, 0);
    group.add(pathCross);

    // 3. Biopool / Rainwater Eco-Basin (Sponge City water garden)
    const basinGeo = new THREE.CylinderGeometry(2.0, 1.8, 0.18, 20);
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.9,
    });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.set(3.8, 0.1, -2.5);
    group.add(basin);

    // Stone basin rim
    const rimGeo = new THREE.TorusGeometry(2.05, 0.12, 8, 20);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(3.8, 0.14, -2.5);
    group.add(rim);

    // Water lily pads
    for (let l = 0; l < 4; l++) {
      const lily = new THREE.Mesh(
        new THREE.CircleGeometry(0.28, 8),
        new THREE.MeshStandardMaterial({ color: 0x15803d, side: THREE.DoubleSide })
      );
      lily.rotation.x = -Math.PI / 2;
      lily.position.set(3.8 + Math.cos(l * 1.5) * 0.9, 0.2, -2.5 + Math.sin(l * 1.5) * 0.9);
      group.add(lily);
    }

    // 4. Wooden Shading Pergola with Bougainvillea flowers
    const pergolaMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const pergolaGroup = new THREE.Group();
    pergolaGroup.position.set(-4.2, 0, 2.2);

    // 4 Columns
    [[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.2], [1.4, 1.2]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.4, 0.16), pergolaMat);
      col.position.set(px, 1.2, pz);
      col.castShadow = !this.isSoftwareGl;
      pergolaGroup.add(col);
    });

    // Overhead wooden roof slats
    for (let s = -1.2; s <= 1.2; s += 0.4) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.14), pergolaMat);
      slat.position.set(0, 2.42, s);
      pergolaGroup.add(slat);
    }

    // Purple bougainvillea climbing floral canopy
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.7 });
    for (let f = 0; f < 5; f++) {
      const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), flowerMat);
      bloom.position.set(-1.0 + f * 0.5, 2.55, f % 2 === 0 ? 0.4 : -0.4);
      pergolaGroup.add(bloom);
    }
    group.add(pergolaGroup);

    // 5. Ergonomic Park Benches with solar USB points
    const benchPositions: [number, number, number, number][] = [
      [-4.2, 0, 2.2, 0],       // Under pergola
      [0.8, 0, -2.8, -Math.PI / 4], // Facing water basin
      [-1.5, 0, -2.5, 0],      // Along path
    ];
    benchPositions.forEach(([bx, by, bz, rotY]) => {
      const bench = this.createParkBench();
      bench.position.set(bx, by, bz);
      bench.rotation.y = rotY;
      group.add(bench);
    });

    // 6. Pet Agility Zone (Dog Playground)
    const petZone = new THREE.Group();
    petZone.position.set(3.5, 0, 2.5);

    // Wooden jump hoop
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.04, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })
    );
    hoop.position.set(-1.2, 0.7, 0);
    petZone.add(hoop);

    const hoopPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f })
    );
    hoopPost.position.set(-1.2, 0.35, 0);
    petZone.add(hoopPost);

    // Slalom poles
    [-0.4, 0.4, 1.2].forEach((sx, idx) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8),
        new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0x0284c7 : 0x10b981 })
      );
      pole.position.set(sx, 0.45, idx % 2 === 0 ? 0.3 : -0.3);
      petZone.add(pole);
    });

    // Smart Pet Fountain / Hydration Point
    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
    );
    fountainBase.position.set(1.8, 0.25, 0);
    petZone.add(fountainBase);

    const bowl = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.04, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    bowl.rotation.x = Math.PI / 2;
    bowl.position.set(1.8, 0.52, 0);
    petZone.add(bowl);

    group.add(petZone);

    // 7. Shading Trees inside the park
    this.createIpeAmareloTree(-20, -11, 0.9);
    this.createRealisticCoconutPalm(-26, -16, 1.05, 0.1);

    // 8. Interactive Metadata
    group.userData = { id: props.id, type: 'park' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  // Ergonomic Park Bench with solar USB points
  private createParkBench(): THREE.Group {
    const bench = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

    // Seat slats
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.45), woodMat);
    seat.position.set(0, 0.42, 0);
    bench.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.36, 0.05), woodMat);
    back.position.set(0, 0.65, -0.2);
    bench.add(back);

    // Metal legs
    [-0.6, 0.6].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.45), ironMat);
      leg.position.set(lx, 0.21, 0);
      bench.add(leg);
    });

    return bench;
  }

  // ==========================================
  // SMART INFRASTRUCTURE: EV, 5G POLES, WASTE, AQI SENSORS
  // ==========================================
  private buildSmartInfrastructure() {
    this.createEVChargingStation({ id: 'ev_hub_innovation', pos: [12, 0, 22] });

    // 1. 4 Synchronized Smart Adaptive Traffic Signals (Avenida Central x Avenida Beira-Rio)
    this.createSmartAdaptiveTrafficSignal({
      id: 'smart_traffic_junction',
      pos: [4.2, 0, 1.2],
      rotY: Math.PI,
      axis: 'NS',
    });
    this.createSmartAdaptiveTrafficSignal({
      id: 'smart_signal_central_north',
      pos: [-4.2, 0, 6.8],
      rotY: 0,
      axis: 'NS',
    });
    this.createSmartAdaptiveTrafficSignal({
      id: 'smart_signal_beirario_west',
      pos: [-4.2, 0, 1.2],
      rotY: -Math.PI / 2,
      axis: 'EW',
    });
    this.createSmartAdaptiveTrafficSignal({
      id: 'smart_signal_beirario_east',
      pos: [4.2, 0, 6.8],
      rotY: Math.PI / 2,
      axis: 'EW',
    });

    const poleCoords: [number, number, number, string][] = [
      [8, 0, 16, 'smart_pole_5g_1'],
      [-12, 0, 8, 'pole_fin_1'],
      [8, 0, -18, 'pole_trans_1'],
      [-4.8, 0, -22, 'pole_main_1'],
      [4.8, 0, -22, 'pole_main_2'],
    ];

    poleCoords.forEach(([x, y, z, id]) => {
      this.createSmart5GPole(id, [x, y, z]);
    });

    this.createSmartWasteStation({ id: 'smart_waste_station_1', pos: [-22, 0, -8] });
    this.createAQISensorTower({ id: 'sensor_aqi_residential', pos: [-8, 0, -22] });
    this.createWaterQualityBuoy({ id: 'water_buoy_river', pos: [24, 0, -7] });
  }

  private createEVChargingStation(props: { id: string; pos: [number, number, number] }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.2, 2.5),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    base.position.y = 0.1;
    group.add(base);

    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
    pole1.position.set(-1.8, 1.4, 0);
    const pole2 = pole1.clone();
    pole2.position.set(1.8, 1.4, 0);
    group.add(pole1, pole2);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.15, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.35 })
    );
    canopy.position.y = 2.8;
    group.add(canopy);

    [-0.9, 0.9].forEach((cx) => {
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.4, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      cab.position.set(cx, 0.8, 0);
      group.add(cab);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.12, 0.18, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.9, side: THREE.DoubleSide })
      );
      ring.position.set(cx, 1.1, 0.21);
      group.add(ring);
    });

    group.userData = { id: props.id, type: 'ev_station' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  // ==========================================
  // SMART ADAPTIVE TRAFFIC SIGNALS (RECIFE 2050)
  // Cantilever mast arm + 3-aspect LED lenses + Pedestrian signal + 5G LiDAR sensor
  // ==========================================
  private createSmartAdaptiveTrafficSignal(props: {
    id: string;
    pos: [number, number, number];
    rotY: number;
    axis: 'NS' | 'EW';
  }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.rotation.y = props.rotY;
    group.name = props.id;

    // 1. Heavy-duty graphite steel vertical mast
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.14, 5.0, 16);
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.35,
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.5;
    mast.castShadow = !this.isSoftwareGl;
    group.add(mast);

    // Mast base anchor flange
    const flange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.28, 0.15, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    flange.position.y = 0.075;
    group.add(flange);

    // 2. Horizontal Cantilever Mast Arm reaching over traffic lane
    const armGeo = new THREE.CylinderGeometry(0.065, 0.08, 3.0, 12);
    const arm = new THREE.Mesh(armGeo, mastMat);
    arm.rotation.z = -Math.PI / 2;
    arm.position.set(1.5, 4.6, 0);
    group.add(arm);

    // Diagonal support truss
    const strutGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.3, 8);
    const strut = new THREE.Mesh(strutGeo, mastMat);
    strut.rotation.z = -Math.PI / 4;
    strut.position.set(0.55, 4.15, 0);
    group.add(strut);

    // 3. Overhead Vehicular Signal Housing (3 aspects: Red, Yellow, Green)
    const vehHousing = new THREE.Group();
    vehHousing.position.set(2.4, 4.2, 0);

    // Black anti-glare backplate
    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.6, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    vehHousing.add(backplate);

    // High-luminosity LED signal lenses
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.1,
      roughness: 0.2,
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.1,
      roughness: 0.2,
    });
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });

    const lensGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16);
    lensGeo.rotateX(Math.PI / 2);

    // Red lens (top)
    const redMesh = new THREE.Mesh(lensGeo, redMat);
    redMesh.position.set(0, 0.48, 0.12);
    vehHousing.add(redMesh);

    // Yellow lens (middle)
    const yellowMesh = new THREE.Mesh(lensGeo, yellowMat);
    yellowMesh.position.set(0, 0, 0.12);
    vehHousing.add(yellowMesh);

    // Green lens (bottom)
    const greenMesh = new THREE.Mesh(lensGeo, greenMat);
    greenMesh.position.set(0, -0.48, 0.12);
    vehHousing.add(greenMesh);

    // Visor hoods over lenses
    [-0.48, 0, 0.48].forEach((vy) => {
      const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.14, 12, 1, true, 0, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x020617, side: THREE.DoubleSide })
      );
      visor.rotation.x = Math.PI / 2;
      visor.position.set(0, vy, 0.14);
      vehHousing.add(visor);
    });

    group.add(vehHousing);

    // 4. Pole-Mounted Secondary Pedestrian Signal & Digital Countdown (height 2.2m)
    const pedHousing = new THREE.Group();
    pedHousing.position.set(0, 2.2, 0.2);

    const pedBackplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.75, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    pedHousing.add(pedBackplate);

    const pedStopMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.1,
    });
    const pedWalkMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 2.0,
    });

    const pedLensGeo = new THREE.BoxGeometry(0.24, 0.24, 0.05);
    const pedStopMesh = new THREE.Mesh(pedLensGeo, pedStopMat);
    pedStopMesh.position.set(0, 0.18, 0.1);
    pedHousing.add(pedStopMesh);

    const pedWalkMesh = new THREE.Mesh(pedLensGeo, pedWalkMat);
    pedWalkMesh.position.set(0, -0.18, 0.1);
    pedHousing.add(pedWalkMesh);

    group.add(pedHousing);

    // 5. Smart 5G AI Traffic Camera / LiDAR Radar Sensor on mast pinnacle (y = 5.2m)
    const camHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.18, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 })
    );
    camHousing.position.set(0, 5.15, 0);
    group.add(camHousing);

    // Camera lens / LiDAR aperture
    const camLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.2 })
    );
    camLens.rotation.x = Math.PI / 2;
    camLens.position.set(0, 5.15, 0.2);
    group.add(camLens);

    // V2X IoT Telemetry Antenna
    const ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 0.8 })
    );
    ant.position.set(0, 5.45, -0.08);
    group.add(ant);

    group.userData = { id: props.id, type: 'smart_traffic_light' };
    this.interactiveMeshes.push(group);
    this.mobilityLayerGroup.add(group);
    this.scene.add(group);

    this.trafficSignals.push({
      axis: props.axis,
      redMat,
      yellowMat,
      greenMat,
      pedWalkMat,
      pedStopMat,
    });
  }

  private createSmart5GPole(id: string, pos: [number, number, number]) {
    const group = new THREE.Group();
    group.position.set(...pos);
    group.name = id;

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 4.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    mast.position.y = 2.1;
    group.add(mast);

    const radome = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 })
    );
    radome.position.y = 3.6;
    group.add(radome);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.08, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    arm.position.set(0.4, 4.0, 0);
    group.add(arm);

    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.05, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.8 })
    );
    led.position.set(0.6, 3.94, 0);
    group.add(led);

    const ptLight = new THREE.PointLight(0xfef08a, 0.8, 8);
    ptLight.position.set(0.6, 3.8, 0);
    ptLight.visible = false;
    this.streetLightsGroup.add(ptLight);

    group.userData = { id, type: 'smart_pole' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  private createSmartWasteStation(props: { id: string; pos: [number, number, number] }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    pad.position.y = 0.05;
    group.add(pad);

    const colors = [0x10b981, 0x0ea5e9, 0xf59e0b];
    [-0.7, 0, 0.7].forEach((bx, idx) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 1.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 })
      );
      pillar.position.set(bx, 0.6, 0);
      group.add(pillar);

      const hatch = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.22, 0.1),
        new THREE.MeshStandardMaterial({ color: colors[idx], emissive: colors[idx], emissiveIntensity: 0.5 })
      );
      hatch.position.set(bx, 0.85, 0.2);
      group.add(hatch);
    });

    group.userData = { id: props.id, type: 'smart_waste' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  private createAQISensorTower(props: { id: string; pos: [number, number, number] }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.2, 5, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    mast.position.y = 2.5;
    group.add(mast);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.5), new THREE.MeshStandardMaterial({ color: 0x059669 }));
    box.position.y = 3.2;
    group.add(box);

    group.userData = { id: props.id, type: 'sensor_aqi' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  private createWaterQualityBuoy(props: { id: string; pos: [number, number, number] }) {
    const group = new THREE.Group();
    group.position.set(...props.pos);
    group.name = props.id;

    const buoy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.4, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
    );
    buoy.position.y = 0.15;
    group.add(buoy);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.9 })
    );
    beacon.position.y = 0.55;
    group.add(beacon);

    group.userData = { id: props.id, type: 'water_buoy' };
    this.interactiveMeshes.push(group);
    this.scene.add(group);
  }

  // ==========================================
  // COQUEIROS (COCONUT PALMS) & PARQUES TROPICAIS
  // ==========================================
  // ==========================================
  // BOTANICAL FOLIAGE & REALISTIC TROPICAL PARKS (RECIFE)
  // High-fidelity Coconut Palms, Golden Ipês, and Flamboyants
  // ==========================================
  private buildFoliageAndParks() {
    // Parque das Graças / Capibaribe Greensward
    const parkGrass = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.15, 20),
      new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.85 })
    );
    parkGrass.position.set(18, 0.08, -20);
    parkGrass.receiveShadow = !this.isSoftwareGl;
    this.scene.add(parkGrass);

    // Permeable pedestrian walkways winding through the park
    const parkPath = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.16, 18),
      new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9 })
    );
    parkPath.position.set(18, 0.085, -20);
    this.scene.add(parkPath);

    const parkPathCross = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.16, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9 })
    );
    parkPathCross.position.set(18, 0.085, -20);
    this.scene.add(parkPathCross);

    // 1. Iconic High-Definition Coconut Palms along waterfronts and avenues
    // 1. Iconic High-Definition Coconut Palms along waterfronts, riverbanks, and open avenues
    const palmPositions: [number, number, number, number][] = [
      // Rio Capibaribe North riverbank promenade (open pedestrian greenway)
      [-24, -3.8, 1.15, 0.12], [-18, -3.8, 1.0, -0.09], [-12, -3.8, 1.08, 0.14],
      [-6, -3.8, 0.95, -0.1], [6, -3.8, 1.05, 0.11], [12, -3.8, 1.1, -0.12],
      [18, -3.8, 1.0, 0.08], [24, -3.8, 0.95, -0.1],
      // Rio Capibaribe South riverbank promenade
      [-24, -10.2, 1.05, -0.11], [-18, -10.2, 1.1, 0.12], [-12, -10.2, 1.0, -0.08],
      [-6, -10.2, 1.12, 0.1], [6, -10.2, 1.08, -0.13], [12, -10.2, 0.96, 0.09],
      [22, -10.2, 1.05, 0.1], [26, -10.2, 0.94, -0.1],
      // Avenida Central open tree planting strips (clear of buildings)
      [-5.5, 0, 1.1, 0.12], [5.5, 0, 0.96, -0.07],
      [-5.5, 8, 1.0, -0.09], [5.5, 8, 1.05, 0.09],
      [-5.5, -2, 1.05, 0.08], [5.5, -2, 1.0, -0.1],
      [-5.5, 14, 1.02, 0.07], [5.5, 14, 0.98, -0.08],
      // Parque das Graças waterfront perimeter
      [8, -26, 1.1, 0.1], [14, -26, 1.0, -0.08], [20, -26, 1.05, 0.12], [26, -26, 0.95, -0.1],
    ];

    palmPositions.forEach(([x, z, scale, tilt]) => {
      this.createRealisticCoconutPalm(x, z, scale, tilt);
    });

    // 2. Ipês Amarelos de Recife (Golden Trumpet Trees - stunning yellow blooms)
    // Exclusively located in dedicated green parks and open civic plazas
    const ipePositions: [number, number, number][] = [
      // Parque Residencial Boa Viagem (around bio-pond & agility court)
      [-24, -12.5, 1.1],
      [-20, -12.5, 1.0],
      [-25, -15.5, 1.05],
      [-19, -15.5, 0.95],
      // Parque das Graças open lawn
      [10, -22, 1.1],
      [14, -22, 1.0],
      [22, -22, 1.15],
      [26, -22, 0.95],
      // Marco Zero Plaza open courtyard perimeter
      [6, 10, 1.05],
      [10, 6, 1.0],
      [14, 6, 0.95],
      [6, 14, 1.0],
    ];

    ipePositions.forEach(([x, z, scale]) => {
      this.createIpeAmareloTree(x, z, scale);
    });

    // 3. Flamboyants (Broad tropical shade trees with scarlet accents)
    // Distributed in open lawns and riverfront paths
    const flamboyantPositions: [number, number, number][] = [
      // Parque das Graças shady resting zone
      [10, -26, 1.1],
      [18, -26, 1.15],
      [24, -26, 1.05],
      // Parque Residencial Boa Viagem
      [-22, -11.5, 1.0],
      [-25, -14.0, 0.95],
      // Capibaribe riverbank shaded walkway
      [-15, -3.8, 1.05],
      [15, -3.8, 1.0],
    ];

    flamboyantPositions.forEach(([x, z, scale]) => {
      this.createFlamboyantTree(x, z, scale);
    });
  }

  // High-Definition Realistic Coconut Palm
  // Curved fibrous trunk + root flare + volumetric drooping 3D fronds + coconuts
  private createRealisticCoconutPalm(x: number, z: number, scale = 1.0, tilt = 0.1) {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);
    palm.scale.set(scale, scale, scale);

    // Root flare base
    const rootGeo = new THREE.CylinderGeometry(0.24, 0.35, 0.3, 10);
    const rootMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
    const root = new THREE.Mesh(rootGeo, rootMat);
    root.position.y = 0.15;
    root.receiveShadow = !this.isSoftwareGl;
    palm.add(root);

    // Curved fibrous segmented trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.9,
    });
    const trunkRingsMat = new THREE.MeshStandardMaterial({
      color: 0x5c2b09,
      roughness: 0.92,
    });

    const segments = 5;
    let curY = 0.25;
    let curOffset = 0;
    const heightPerSeg = 0.95;

    for (let i = 0; i < segments; i++) {
      const radiusTop = 0.16 - i * 0.015;
      const radiusBot = 0.18 - i * 0.015;
      const segGeo = new THREE.CylinderGeometry(radiusTop, radiusBot, heightPerSeg, 10);
      const seg = new THREE.Mesh(segGeo, trunkMat);

      curOffset += Math.sin((i / segments) * Math.PI) * tilt;
      seg.position.set(curOffset, curY + heightPerSeg / 2, 0);
      seg.rotation.z = -tilt * 0.45;
      seg.castShadow = !this.isSoftwareGl;
      palm.add(seg);

      // Ring accent at segment junction
      const ringGeo = new THREE.TorusGeometry(radiusTop + 0.012, 0.02, 6, 12);
      const ring = new THREE.Mesh(ringGeo, trunkRingsMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(curOffset, curY + heightPerSeg, 0);
      palm.add(ring);

      curY += heightPerSeg;
    }

    // Crown of 10 Volumetric 3D Fronds
    const frondUpperMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.65,
      side: THREE.DoubleSide,
    });
    const frondLowerMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.55,
      side: THREE.DoubleSide,
    });

    const numFronds = 10;
    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(curOffset, curY, 0);
      frondGroup.rotation.y = angle;

      // Central stem (curved spine)
      const spineGeo = new THREE.CylinderGeometry(0.02, 0.04, 2.4, 6);
      const spineMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 });
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.position.set(0, 0.35, 1.1);
      spine.rotation.x = Math.PI / 2.8;
      frondGroup.add(spine);

      // Volumetric feather blades (upper & lower arched planes creating genuine 3D body)
      const bladeGeo = new THREE.ConeGeometry(0.52, 2.2, 5);
      bladeGeo.scale(1, 0.12, 1);
      const blade = new THREE.Mesh(bladeGeo, f % 2 === 0 ? frondUpperMat : frondLowerMat);
      blade.position.set(0, 0.38, 1.15);
      blade.rotation.x = Math.PI / 2.7;
      blade.castShadow = !this.isSoftwareGl;
      frondGroup.add(blade);

      // Drooping tip
      const tipGeo = new THREE.ConeGeometry(0.32, 0.9, 4);
      tipGeo.scale(1, 0.08, 1);
      const tip = new THREE.Mesh(tipGeo, frondLowerMat);
      tip.position.set(0, 0.05, 2.2);
      tip.rotation.x = Math.PI / 2.1;
      frondGroup.add(tip);

      palm.add(frondGroup);
    }

    // Cluster of 4-6 coconuts nestled at crown
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.75 });
    for (let n = 0; n < 5; n++) {
      const nAngle = (n / 5) * Math.PI * 2;
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), nutMat);
      nut.position.set(
        curOffset + Math.cos(nAngle) * 0.22,
        curY - 0.05,
        Math.sin(nAngle) * 0.22
      );
      nut.castShadow = !this.isSoftwareGl;
      palm.add(nut);
    }

    this.scene.add(palm);
  }

  // Ipê Amarelo de Recife (Golden Trumpet Tree)
  // Multi-branching trunk + rich golden yellow volumetric blossoming canopy
  private createIpeAmareloTree(x: number, z: number, scale = 1.0) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.set(scale, scale, scale);

    // Gnarled woody trunk with bark
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x574130, roughness: 0.95 });
    const mainTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.2, 8), barkMat);
    mainTrunk.position.y = 1.1;
    mainTrunk.castShadow = !this.isSoftwareGl;
    tree.add(mainTrunk);

    // Spreading boughs/branches
    const boughs = [
      { pos: [0.35, 2.1, 0.3], rot: [0.4, 0.2, -0.5], length: 1.2 },
      { pos: [-0.35, 2.0, -0.2], rot: [-0.3, -0.4, 0.6], length: 1.3 },
      { pos: [0.1, 2.2, -0.4], rot: [-0.5, 0.1, 0.2], length: 1.1 },
    ];
    boughs.forEach((b) => {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, b.length, 6), barkMat);
      branch.position.set(b.pos[0] as number, b.pos[1] as number, b.pos[2] as number);
      branch.rotation.set(b.rot[0] as number, b.rot[1] as number, b.rot[2] as number);
      tree.add(branch);
    });

    // Golden flowering canopy foliage clusters
    const flowerMat1 = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Radiant Golden Canary Yellow
      roughness: 0.7,
      flatShading: true,
    });
    const flowerMat2 = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Warm Amber Gold
      roughness: 0.75,
      flatShading: true,
    });
    const flowerMatLight = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Sunlit highlights
      roughness: 0.65,
    });

    const canopyClusters = [
      { pos: [0, 3.4, 0], r: 1.55, mat: flowerMat1 },
      { pos: [1.1, 3.0, 0.6], r: 1.25, mat: flowerMat2 },
      { pos: [-1.0, 3.1, -0.5], r: 1.3, mat: flowerMat1 },
      { pos: [0.2, 3.2, -1.1], r: 1.2, mat: flowerMatLight },
      { pos: [-0.6, 3.3, 0.9], r: 1.15, mat: flowerMat2 },
      { pos: [0, 4.1, 0], r: 1.1, mat: flowerMatLight },
    ];

    canopyClusters.forEach((c) => {
      const geo = new THREE.DodecahedronGeometry(c.r, 1);
      const puff = new THREE.Mesh(geo, c.mat);
      puff.position.set(c.pos[0], c.pos[1], c.pos[2]);
      puff.castShadow = !this.isSoftwareGl;
      tree.add(puff);
    });

    // Fallen yellow flower petal ring on the ground
    const petalRingGeo = new THREE.RingGeometry(0.6, 2.2, 12);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const petalRing = new THREE.Mesh(petalRingGeo, petalMat);
    petalRing.rotation.x = -Math.PI / 2;
    petalRing.position.y = 0.085;
    tree.add(petalRing);

    this.scene.add(tree);
  }

  // Flamboyant Tropical (Broad Umbrella Shade Tree with scarlet-orange blossoms)
  private createFlamboyantTree(x: number, z: number, scale = 1.0) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.set(scale, scale, scale);

    // Thick buttressed trunk
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.95 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 2.0, 8), barkMat);
    trunk.position.y = 1.0;
    trunk.castShadow = !this.isSoftwareGl;
    tree.add(trunk);

    // Broad umbrella green canopy
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.8,
      flatShading: true,
    });
    const scarletMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48, // Fiery red-orange flamboyant flowers
      roughness: 0.7,
    });

    // Main spreading umbrella layers
    const umbrellaGeo1 = new THREE.CylinderGeometry(2.6, 1.8, 0.9, 8);
    const u1 = new THREE.Mesh(umbrellaGeo1, greenMat);
    u1.position.y = 2.6;
    u1.castShadow = !this.isSoftwareGl;
    tree.add(u1);

    const umbrellaGeo2 = new THREE.CylinderGeometry(2.0, 2.4, 0.7, 8);
    const u2 = new THREE.Mesh(umbrellaGeo2, greenMat);
    u2.position.y = 3.2;
    u2.castShadow = !this.isSoftwareGl;
    tree.add(u2);

    // Scarlet blossom crowns
    const blossomGeo = new THREE.DodecahedronGeometry(0.8, 1);
    [
      [1.4, 3.2, 0.5],
      [-1.3, 3.1, -0.6],
      [0.2, 3.5, 1.2],
      [-0.4, 3.4, -1.1],
    ].forEach(([bx, by, bz]) => {
      const bloom = new THREE.Mesh(blossomGeo, scarletMat);
      bloom.position.set(bx, by, bz);
      bloom.castShadow = !this.isSoftwareGl;
      tree.add(bloom);
    });

    this.scene.add(tree);
  }

  // ==========================================
  // TRAFFIC (EV CARS, TRANSIT BUSES, BIKES & SOLAR CATAMARAN)
  // Perfectly aligned with velocity vector: never driving sideways!
  // ==========================================
  private buildTrafficAndCitizens() {
    // 1. Autonomous Electric Cars
    const carRoutes = [
      // Central Avenue (crossing the bridge at z = -7) North-to-South
      [
        new THREE.Vector3(-1.8, 0, -32),
        new THREE.Vector3(-1.8, 0, 32),
      ],
      // Central Avenue South-to-North
      [
        new THREE.Vector3(1.8, 0, 32),
        new THREE.Vector3(1.8, 0, -32),
      ],
      // Boulevard Loop (West-to-East)
      [
        new THREE.Vector3(-32, 0, 2.5),
        new THREE.Vector3(32, 0, 2.5),
      ],
      // Boulevard Loop (East-to-West)
      [
        new THREE.Vector3(32, 0, 5.5),
        new THREE.Vector3(-32, 0, 5.5),
      ],
    ];

    const carColors = [0x0284c7, 0x10b981, 0xf8fafc, 0xf59e0b, 0x38bdf8];
    for (let i = 0; i < 8; i++) {
      const route = carRoutes[i % carRoutes.length];
      const car = this.createAutonomousEVCar(carColors[i % carColors.length]);
      this.vehicles.push({
        mesh: car,
        path: route,
        progress: (i * 0.25) % 1,
        speed: 0.0032 + (i % 3) * 0.0008,
      });
      this.scene.add(car);
    }

    // 2. Realistic Bi-Articulated BRT Electric Transit Bus (ConectaBus 2050)
    const busRoute = [
      new THREE.Vector3(0, 0, -30),
      new THREE.Vector3(0, 0, 30),
    ];
    const bus = this.createElectricTransitBus();
    this.vehicles.push({
      mesh: bus,
      path: busRoute,
      progress: 0.5,
      speed: 0.0022,
    });
    this.scene.add(bus);

    // 3. Shared E-Bikes on the designated bike paths
    const bikeRoutes = [
      [new THREE.Vector3(-3.35, 0, -32), new THREE.Vector3(-3.35, 0, 32)],
      [new THREE.Vector3(3.35, 0, 32), new THREE.Vector3(3.35, 0, -32)],
    ];
    for (let i = 0; i < 4; i++) {
      const bRoute = bikeRoutes[i % 2];
      const bike = this.createSharedEBike();
      this.vehicles.push({
        mesh: bike,
        path: bRoute,
        progress: (i * 0.25) % 1,
        speed: 0.0024,
      });
      this.scene.add(bike);
    }

    // 4. Solar Electric Catamaran Boat sailing along the Capibaribe River (z = -7)
    // Sits at water level and passes UNDER the bridge arches with 0.9m of open vertical clearance
    this.catamaranMesh = this.createSolarCatamaran();
    this.scene.add(this.catamaranMesh);

    // 5. CITIZENS ACROSS THE CITY (STREETS, RESIDENTIAL PARK, RIVERBANK & PLAZAS)
    const citizenOutfits = [
      { outfit: 0x0284c7, pants: 0x1e293b, skin: 0xfcd34d }, // Recife cyan
      { outfit: 0x10b981, pants: 0x334155, skin: 0x935116 }, // Emerald green
      { outfit: 0xf59e0b, pants: 0xf8fafc, skin: 0xd97706 }, // Warm amber & white linen
      { outfit: 0xe11d48, pants: 0x0f172a, skin: 0xfcd34d }, // Coral
      { outfit: 0xf8fafc, pants: 0x1e293b, skin: 0x78350f }, // White linen & dark trousers
      { outfit: 0x8b5cf6, pants: 0x334155, skin: 0xfcd34d }, // Purple tech
      { outfit: 0x06b6d4, pants: 0xf8fafc, skin: 0x935116 }, // Coastal sky
    ];

    // A. LINEAR WALKERS & JOGGERS ON STREET SIDEWALKS (crossing bridge & avenues)
    const streetWalkers = [
      // Central Avenue West Sidewalk (heading North to South)
      { start: new THREE.Vector3(-4.4, 0, -28), end: new THREE.Vector3(-4.4, 0, 28), speed: 0.0016, withDog: false, isJogger: false },
      // Central Avenue West Sidewalk (heading South to North, with dog!)
      { start: new THREE.Vector3(-4.4, 0, 22), end: new THREE.Vector3(-4.4, 0, -28), speed: 0.0018, withDog: true, isJogger: false },
      // Central Avenue East Sidewalk (heading South to North)
      { start: new THREE.Vector3(4.4, 0, 28), end: new THREE.Vector3(4.4, 0, -28), speed: 0.0015, withDog: false, isJogger: false },
      // Central Avenue East Sidewalk (heading North to South, jogger)
      { start: new THREE.Vector3(4.4, 0, -26), end: new THREE.Vector3(4.4, 0, 28), speed: 0.0028, withDog: false, isJogger: true },
      // East-West Boulevard South Sidewalk (West to East)
      { start: new THREE.Vector3(-28, 0, 1.8), end: new THREE.Vector3(28, 0, 1.8), speed: 0.0017, withDog: true, isJogger: false },
      // East-West Boulevard South Sidewalk (East to West)
      { start: new THREE.Vector3(26, 0, 1.8), end: new THREE.Vector3(-28, 0, 1.8), speed: 0.0019, withDog: false, isJogger: false },
      // East-West Boulevard North Sidewalk (West to East, jogger)
      { start: new THREE.Vector3(-28, 0, 6.2), end: new THREE.Vector3(28, 0, 6.2), speed: 0.0027, withDog: false, isJogger: true },
      // East-West Boulevard North Sidewalk (East to West)
      { start: new THREE.Vector3(26, 0, 6.2), end: new THREE.Vector3(-28, 0, 6.2), speed: 0.0016, withDog: false, isJogger: false },
    ];

    streetWalkers.forEach((sw, idx) => {
      const style = citizenOutfits[idx % citizenOutfits.length];
      const char = this.createCitizenCharacter({
        outfitColor: style.outfit,
        pantsColor: style.pants,
        skinTone: style.skin,
        isJogger: sw.isJogger,
        hasHat: idx % 3 === 0,
      });

      // If walker has dog on leash, add companion dog
      if (sw.withDog) {
        const dogData = this.createDomesticDog(idx % 2 === 0 ? 0xd97706 : 0x78350f, 0.75);
        dogData.group.position.set(0.45, 0, 0.3);
        char.group.add(dogData.group);

        // Visual leash cord
        const leash = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 0.65, 4),
          new THREE.MeshStandardMaterial({ color: 0xef4444 })
        );
        leash.position.set(0.22, 0.45, 0.15);
        leash.rotation.z = -Math.PI / 4;
        char.group.add(leash);
      }

      this.pedestrians.push({
        mesh: char.group,
        origin: sw.start.clone(),
        startPos: sw.start.clone(),
        endPos: sw.end.clone(),
        isLinear: true,
        progress: (idx * 0.22) % 1,
        angle: 0,
        radius: 0,
        speed: sw.speed,
        leftLeg: char.leftLeg,
        rightLeg: char.rightLeg,
        leftArm: char.leftArm,
        rightArm: char.rightArm,
      });
      this.scene.add(char.group);
    });

    // B. CITIZENS IN PARQUE RESIDENCIAL BOA VIAGEM (x = -22, z = -14)
    // Residents relaxing, walking, sitting under pergolas, and jogging in the residential green space
    const resParkPeople = [
      // Resident sitting under wooden pergola reading
      { pos: new THREE.Vector3(-26.2, 0.08, -11.8), isSitting: true, rotY: 0, isJogger: false, withDog: false },
      // Resident sitting on park bench facing the eco-basin
      { pos: new THREE.Vector3(-21.2, 0.08, -16.8), isSitting: true, rotY: -Math.PI / 4, isJogger: false, withDog: false },
      // Stroller walking along the curved residential path
      { origin: new THREE.Vector3(-22, 0, -14), radius: 2.8, speed: 0.014, isJogger: false, withDog: false, isSitting: false },
      // Jogger on the outer park perimeter path
      { origin: new THREE.Vector3(-22, 0, -14), radius: 4.5, speed: 0.026, isJogger: true, withDog: false, isSitting: false },
      // Pet owner with dog near the pet agility park
      { origin: new THREE.Vector3(-18.5, 0, -11.5), radius: 1.8, speed: 0.016, withDog: true, isJogger: false, isSitting: false },
    ];

    resParkPeople.forEach((rp, idx) => {
      const style = citizenOutfits[(idx + 2) % citizenOutfits.length];
      const char = this.createCitizenCharacter({
        outfitColor: style.outfit,
        pantsColor: style.pants,
        skinTone: style.skin,
        isSitting: rp.isSitting,
        isJogger: rp.isJogger,
        hasHat: idx % 2 === 0,
      });

      if (rp.isSitting && rp.pos) {
        char.group.position.copy(rp.pos);
        if (rp.rotY) char.group.rotation.y = rp.rotY;
        this.pedestrians.push({
          mesh: char.group,
          origin: rp.pos.clone(),
          angle: 0,
          radius: 0,
          speed: 0,
          isSitting: true,
        });
      } else if (rp.origin) {
        if (rp.withDog) {
          const dog = this.createDomesticDog(0x1e293b, 0.7);
          dog.group.position.set(0.4, 0, 0.2);
          char.group.add(dog.group);
        }
        this.pedestrians.push({
          mesh: char.group,
          origin: rp.origin.clone(),
          angle: (idx * Math.PI) / 2.5,
          radius: rp.radius,
          speed: rp.speed,
          leftLeg: char.leftLeg,
          rightLeg: char.rightLeg,
          leftArm: char.leftArm,
          rightArm: char.rightArm,
        });
      }
      this.scene.add(char.group);
    });

    // C. CITIZENS IN PARQUE DAS GRAÇAS & MARCO ZERO PLAZA
    const plazaAndGracasCitizens = [
      // Parque das Graças garden strollers
      { origin: new THREE.Vector3(18, 0, -20), radius: 3.5, speed: 0.014, isJogger: false },
      { origin: new THREE.Vector3(18, 0, -20), radius: 5.5, speed: 0.022, isJogger: true },
      { origin: new THREE.Vector3(14, 0, -22), radius: 2.2, speed: 0.016, isJogger: false },
      // Marco Zero Plaza strollers (strolling on the open compass rose plaza)
      { origin: new THREE.Vector3(10, 0, 10), radius: 2.2, speed: 0.015, isJogger: false },
      { origin: new THREE.Vector3(10, 0, 10), radius: 3.2, speed: 0.018, isJogger: false },
      // Innovation / Waterfront promenade walkers
      { origin: new THREE.Vector3(-10, 0, 1.5), radius: 2.2, speed: 0.015, isJogger: false },
      { origin: new THREE.Vector3(10, 0, 1.5), radius: 2.5, speed: 0.017, isJogger: false },
      { origin: new THREE.Vector3(-18, 0, -10.2), radius: 2.0, speed: 0.016, isJogger: false },
    ];

    plazaAndGracasCitizens.forEach((cp, idx) => {
      const style = citizenOutfits[(idx + 4) % citizenOutfits.length];
      const char = this.createCitizenCharacter({
        outfitColor: style.outfit,
        pantsColor: style.pants,
        skinTone: style.skin,
        isJogger: cp.isJogger,
      });
      this.pedestrians.push({
        mesh: char.group,
        origin: cp.origin.clone(),
        angle: (idx * Math.PI) / 3,
        radius: cp.radius,
        speed: cp.speed,
        leftLeg: char.leftLeg,
        rightLeg: char.rightLeg,
        leftArm: char.leftArm,
        rightArm: char.rightArm,
      });
      this.scene.add(char.group);
    });

    // 6. ANIMALS & FAUNA (DOGS IN PET PARK, CAPYBARAS ON RIVERBANK & TROPICAL BIRDS)
    // A. Active Dogs in the Residential Pet Park
    const dog1 = this.createDomesticDog(0xd97706, 0.85); // Golden retriever running playfully
    this.animals.push({
      mesh: dog1.group,
      type: 'dog',
      origin: new THREE.Vector3(-18.5, 0, -11.5),
      angle: 0,
      radius: 1.6,
      speed: 0.035, // Trotting fast
      tail: dog1.tail,
    });
    this.scene.add(dog1.group);

    const dog2 = this.createDomesticDog(0xf1f5f9, 0.8); // White / Dalmatian in park
    this.animals.push({
      mesh: dog2.group,
      type: 'dog',
      origin: new THREE.Vector3(-24.5, 0, -15.5),
      angle: Math.PI,
      radius: 1.4,
      speed: 0.024,
      tail: dog2.tail,
    });
    this.scene.add(dog2.group);

    // B. Native Capybaras grazing on the Capibaribe Riverbanks
    const capyPositions: [number, number, number, number][] = [
      [-14.5, 0.12, -4.2, 1.05], // Adult capybara on riverbank
      [-13.2, 0.12, -4.4, 0.85], // Young capybara
      [-15.8, 0.12, -4.3, 0.75], // Baby capybara
      [11.5, 0.12, -4.3, 1.0],   // Adult capybara on East riverbank
    ];
    capyPositions.forEach(([cx, cy, cz, cScale]) => {
      const capy = this.createCapybara(cScale);
      capy.group.position.set(cx, cy, cz);
      capy.group.rotation.y = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      this.animals.push({
        mesh: capy.group,
        type: 'capybara',
        origin: new THREE.Vector3(cx, cy, cz),
        angle: 0,
        radius: 0,
        speed: 0,
        headGroup: capy.headGroup,
      });
      this.scene.add(capy.group);
    });

    // C. Tropical Birds (Garças Brancas & Guarás Vermelhos) flying over the river and parks
    const birdsData = [
      { type: 'garca' as const, origin: new THREE.Vector3(0, 0, -7), radius: 22, speed: 0.012, alt: 14 },
      { type: 'garca' as const, origin: new THREE.Vector3(0, 0, -7), radius: 18, speed: 0.014, alt: 16 },
      { type: 'guara' as const, origin: new THREE.Vector3(-10, 0, -10), radius: 19, speed: 0.015, alt: 17 },
      { type: 'guara' as const, origin: new THREE.Vector3(12, 0, -12), radius: 21, speed: 0.013, alt: 15 },
    ];
    birdsData.forEach((bd, idx) => {
      const bird = this.createTropicalBird(bd.type);
      this.animals.push({
        mesh: bird.group,
        type: 'bird',
        origin: bd.origin.clone(),
        angle: (idx * Math.PI) / 2,
        radius: bd.radius,
        speed: bd.speed,
        altitude: bd.alt,
        leftWing: bird.leftWing,
        rightWing: bird.rightWing,
      });
      this.scene.add(bird.group);
    });
  }

  // Multi-part Solar Electric Catamaran (Iconic Capibaribe river transit)
  // Designed with a low, hydrodynamic profile so it glides smoothly UNDER all bridges
  private createSolarCatamaran(): THREE.Group {
    const cat = new THREE.Group();
    // Catamaran rests on water (water is at y = 0.04)
    cat.position.set(-26, 0.04, -7);

    // Twin Hydrodynamic Hulls partially in water
    [-0.65, 0.65].forEach((hx) => {
      const hullGeo = new THREE.BoxGeometry(0.36, 0.18, 3.8);
      const hullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.position.set(hx, 0.06, 0);
      cat.add(hull);
    });

    // Sleek passenger deck
    const deckGeo = new THREE.BoxGeometry(1.85, 0.06, 3.4);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.15;
    cat.add(deck);

    // Ultra-slim Solar Roof Canopy (total boat height < 0.58m above water)
    const roofGeo = new THREE.BoxGeometry(1.9, 0.04, 3.2);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.50;
    cat.add(roof);

    // Canopy slender support pillars
    [-0.75, 0.75].forEach((cx) => {
      [-1.2, 1.2].forEach((cz) => {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
        );
        pillar.position.set(cx, 0.33, cz);
        cat.add(pillar);
      });
    });

    return cat;
  }

  // Realistic Autonomous Electric Vehicle
  // Local -Z is FORWARD (headlights), Local +Z is REAR (taillights)
  private createAutonomousEVCar(bodyColor: number): THREE.Group {
    const car = new THREE.Group();

    // Main aerodynamic sculpted body chassis
    const chassisGeo = new THREE.BoxGeometry(1.3, 0.34, 2.6);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.2,
      metalness: 0.7,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.32;
    chassis.castShadow = !this.isSoftwareGl;
    car.add(chassis);

    // Front aerodynamic tapered hood (slopes down toward -Z)
    const hoodGeo = new THREE.BoxGeometry(1.24, 0.18, 0.8);
    const hood = new THREE.Mesh(hoodGeo, chassisMat);
    hood.position.set(0, 0.38, -0.9);
    hood.rotation.x = 0.12;
    car.add(hood);

    // Panoramic dark tinted glass cabin (slanted forward toward -Z)
    const cabinGeo = new THREE.BoxGeometry(1.12, 0.38, 1.35);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.95,
      transparent: true,
      opacity: 0.88,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.64, 0.05);
    car.add(cabin);

    // 4 Wheels with rubber tires and alloy wheel hubs
    const tireGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 14);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });

    const wheelPositions: [number, number, number][] = [
      [-0.67, 0.22, -0.78], // Front Left (toward -Z)
      [0.67, 0.22, -0.78],  // Front Right (toward -Z)
      [-0.67, 0.22, 0.78],  // Rear Left (toward +Z)
      [0.67, 0.22, 0.78],   // Rear Right (toward +Z)
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wx, wy, wz);

      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      wheelGroup.add(tire);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 8), hubMat);
      hub.rotation.z = Math.PI / 2;
      wheelGroup.add(hub);

      car.add(wheelGroup);
    });

    // Front Projector Headlights & Cyan Daytime Running Light (DRL) strip at -Z (front)
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.2,
    });
    const headBar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 0.08), headMat);
    headBar.position.set(0, 0.33, -1.31);
    car.add(headBar);

    // Rear Full-Width Taillight & Brake Light bar at +Z (rear)
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.1,
    });
    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 0.08), tailMat);
    tailBar.position.set(0, 0.35, 1.31);
    car.add(tailBar);

    // Autonomous LiDAR Sensor Puck on roof
    const lidarPuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.8 })
    );
    lidarPuck.position.set(0, 0.86, -0.05);
    car.add(lidarPuck);

    return car;
  }

  // Realistic Bi-Articulated BRT Electric Transit Bus (ConectaBus 2050)
  // Two aerodynamic coaches joined by a flexible accordion bellow
  // Front at -Z, Rear at +Z
  private createElectricTransitBus(): THREE.Group {
    const bus = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Recife Metro Cyan-Blue
      roughness: 0.25,
      metalness: 0.6,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.88,
    });

    const interiorGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 0.3,
    });

    const wheelTireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const wheelRimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

    // Helper for bus wheels
    const addWheelSet = (targetGroup: THREE.Group, zPos: number) => {
      [-0.94, 0.94].forEach((wx) => {
        const wg = new THREE.Group();
        wg.position.set(wx, 0.32, zPos);

        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), wheelTireMat);
        tire.rotation.z = Math.PI / 2;
        wg.add(tire);

        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.23, 10), wheelRimMat);
        rim.rotation.z = Math.PI / 2;
        wg.add(rim);

        targetGroup.add(wg);
      });
    };

    // ----------------------------------------------------
    // SECTION 1: FRONT COACH (Length 4.4m, positioned z = -2.4)
    // ----------------------------------------------------
    const frontCoach = new THREE.Group();
    frontCoach.position.set(0, 0, -2.4);

    // Front coach body
    const fBody = new THREE.Mesh(new THREE.BoxGeometry(1.84, 1.25, 4.4), bodyMat);
    fBody.position.y = 1.0;
    fBody.castShadow = !this.isSoftwareGl;
    frontCoach.add(fBody);

    // Aerodynamic slanted front nose (at z = -2.2 of frontCoach)
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.82, 1.15, 0.6), bodyMat);
    nose.position.set(0, 0.95, -2.35);
    nose.rotation.x = 0.12;
    frontCoach.add(nose);

    // Windshield & panoramic passenger windows
    const fWin = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.52, 4.2), glassMat);
    fWin.position.set(0, 1.15, -0.1);
    frontCoach.add(fWin);

    // Warm passenger interior illumination
    const fGlow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 3.8), interiorGlowMat);
    fGlow.position.set(0, 1.12, 0);
    frontCoach.add(fGlow);

    // Front Wheels
    addWheelSet(frontCoach, -1.3);

    // Digital LED Destination Matrix Sign ("BRT 2050 CAPIBARIBE EXPR")
    const ledMatrixMat = new THREE.MeshStandardMaterial({
      color: 0x042f2e,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.4,
    });
    const ledSign = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.08), ledMatrixMat);
    ledSign.position.set(0, 1.48, -2.52);
    frontCoach.add(ledSign);

    // Modern DRL LED headlights at the very front
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
    });
    const head1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.08), headMat);
    head1.position.set(-0.65, 0.55, -2.54);
    const head2 = head1.clone();
    head2.position.set(0.65, 0.55, -2.54);
    frontCoach.add(head1, head2);

    bus.add(frontCoach);

    // ----------------------------------------------------
    // SECTION 2: ARTICULATED ACCORDION BELLOW ("SANFONA")
    // ----------------------------------------------------
    const bellowMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.95,
      metalness: 0.1,
    });
    const bellow = new THREE.Mesh(new THREE.BoxGeometry(1.78, 1.18, 0.65), bellowMat);
    bellow.position.set(0, 1.0, 0);
    bus.add(bellow);

    // Bellow rib folds
    for (let r = -2; r <= 2; r++) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(1.82, 1.22, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x111827 })
      );
      rib.position.set(0, 1.0, r * 0.1);
      bus.add(rib);
    }

    // ----------------------------------------------------
    // SECTION 3: REAR TRAILER COACH (Length 4.4m, positioned z = 2.4)
    // ----------------------------------------------------
    const rearCoach = new THREE.Group();
    rearCoach.position.set(0, 0, 2.4);

    const rBody = new THREE.Mesh(new THREE.BoxGeometry(1.84, 1.25, 4.4), bodyMat);
    rBody.position.y = 1.0;
    rBody.castShadow = !this.isSoftwareGl;
    rearCoach.add(rBody);

    const rWin = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.52, 4.2), glassMat);
    rWin.position.set(0, 1.15, 0);
    rearCoach.add(rWin);

    const rGlow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 3.8), interiorGlowMat);
    rGlow.position.set(0, 1.12, 0);
    rearCoach.add(rGlow);

    // Middle and Rear Wheels
    addWheelSet(rearCoach, -0.8);
    addWheelSet(rearCoach, 1.3);

    // Rear Full-Width LED Brake Light Bar at +Z
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.4,
    });
    const rTail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.08), tailMat);
    rTail.position.set(0, 0.72, 2.22);
    rearCoach.add(rTail);

    bus.add(rearCoach);

    // ----------------------------------------------------
    // ROOFTOP: SOLID-STATE BATTERY PACKS & SOLAR PANTOGRAPH
    // ----------------------------------------------------
    const roofEquipMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });

    // Solar panels on front roof
    const fSolar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 3.6), roofEquipMat);
    fSolar.position.set(0, 1.7, -2.4);
    bus.add(fSolar);

    // High-capacity battery enclosure on rear roof
    const rBat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 3.2), roofEquipMat);
    rBat.position.set(0, 1.72, 2.4);
    bus.add(rBat);

    // Overhead ultra-fast flash-charging pantograph
    const pantographGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
    const pantoMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
    const panto = new THREE.Mesh(pantographGeo, pantoMat);
    panto.position.set(0, 1.84, -1.2);
    bus.add(panto);

    return bus;
  }

  // Shared Smart E-Bike (Front at -Z, Rear at +Z)
  private createSharedEBike(): THREE.Group {
    const bike = new THREE.Group();

    // Emerald eco-smart bicycle frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.7), frameMat);
    frame.position.y = 0.32;
    bike.add(frame);

    // Battery pack cylinder along down-tube
    const bat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    bat.rotation.x = Math.PI / 4;
    bat.position.set(0, 0.3, -0.05);
    bike.add(bat);

    // Front fork & Handlebar at -Z (front)
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.05), frameMat);
    fork.position.set(0, 0.32, -0.42);
    fork.rotation.x = -0.15;
    bike.add(fork);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.04, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    handle.position.set(0, 0.48, -0.42);
    bike.add(handle);

    // Front LED Light at -Z
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 1.0 })
    );
    light.position.set(0, 0.44, -0.47);
    bike.add(light);

    // Wheels: Front at -Z, Rear at +Z
    const wGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 16);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    const frontWheel = new THREE.Mesh(wGeo, wMat);
    frontWheel.rotation.y = Math.PI / 2;
    frontWheel.position.set(0, 0.18, -0.45);

    const rearWheel = new THREE.Mesh(wGeo, wMat);
    rearWheel.rotation.y = Math.PI / 2;
    rearWheel.position.set(0, 0.18, 0.45);

    bike.add(frontWheel, rearWheel);

    // Red reflector at +Z (rear)
    const tailReflector = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.0 })
    );
    tailReflector.position.set(0, 0.34, 0.48);
    bike.add(tailReflector);

    return bike;
  }

  // Multi-part Citizen Character with customizable outfits, skin tones, limbs & accessories
  private createCitizenCharacter(options?: {
    outfitColor?: number;
    pantsColor?: number;
    skinTone?: number;
    isJogger?: boolean;
    isSitting?: boolean;
    hasHat?: boolean;
  }): {
    group: THREE.Group;
    leftLeg?: THREE.Mesh;
    rightLeg?: THREE.Mesh;
    leftArm?: THREE.Mesh;
    rightArm?: THREE.Mesh;
  } {
    const person = new THREE.Group();

    const outfit = options?.outfitColor ?? 0x0ea5e9;
    const pants = options?.pantsColor ?? 0x1e293b;
    const skin = options?.skinTone ?? 0xfcd34d;

    const outfitMat = new THREE.MeshStandardMaterial({ color: outfit, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pants, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.18), outfitMat);
    torso.position.y = options?.isSitting ? 0.52 : 0.66;
    torso.castShadow = !this.isSoftwareGl;
    person.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), skinMat);
    head.position.y = options?.isSitting ? 0.8 : 0.94;
    person.add(head);

    // Optional Hat / Cap
    if (options?.hasHat) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      cap.position.set(0, options?.isSitting ? 0.9 : 1.04, 0.02);
      person.add(cap);
    }

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.32, 6);
    const leftArm = new THREE.Mesh(armGeo, outfitMat);
    leftArm.position.set(-0.17, options?.isSitting ? 0.52 : 0.64, 0);
    const rightArm = new THREE.Mesh(armGeo, outfitMat);
    rightArm.position.set(0.17, options?.isSitting ? 0.52 : 0.64, 0);
    person.add(leftArm, rightArm);

    // Legs
    let leftLeg: THREE.Mesh | undefined;
    let rightLeg: THREE.Mesh | undefined;

    if (options?.isSitting) {
      // Sitting position: thighs bent forward
      const thighGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.32, 6);
      const lThigh = new THREE.Mesh(thighGeo, pantsMat);
      lThigh.rotation.x = Math.PI / 2;
      lThigh.position.set(-0.08, 0.42, 0.16);
      const rThigh = new THREE.Mesh(thighGeo, pantsMat);
      rThigh.rotation.x = Math.PI / 2;
      rThigh.position.set(0.08, 0.42, 0.16);

      const shinGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.38, 6);
      const lShin = new THREE.Mesh(shinGeo, pantsMat);
      lShin.position.set(-0.08, 0.2, 0.32);
      const rShin = new THREE.Mesh(shinGeo, pantsMat);
      rShin.position.set(0.08, 0.2, 0.32);

      person.add(lThigh, rThigh, lShin, rShin);
    } else {
      const legGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.42, 6);
      leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.08, 0.28, 0);
      rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.08, 0.28, 0);
      person.add(leftLeg, rightLeg);
    }

    return { group: person, leftLeg, rightLeg, leftArm, rightArm };
  }

  // Procedural Domestic Dog with animated legs and wagging tail
  private createDomesticDog(color = 0xd97706, scale = 0.85): {
    group: THREE.Group;
    tail: THREE.Mesh;
    legs: THREE.Mesh[];
  } {
    const dog = new THREE.Group();
    dog.scale.set(scale, scale, scale);

    const furMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    // Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.46), furMat);
    body.position.y = 0.28;
    body.castShadow = !this.isSoftwareGl;
    dog.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.2), furMat);
    head.position.set(0, 0.42, -0.25);
    dog.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.12), furMat);
    snout.position.set(0, 0.38, -0.37);
    dog.add(snout);

    // Black nose tip
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.03), darkMat);
    nose.position.set(0, 0.41, -0.44);
    dog.add(nose);

    // Ears
    [-0.08, 0.08].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), furMat);
      ear.position.set(ex, 0.52, -0.24);
      ear.rotation.x = -0.2;
      dog.add(ear);
    });

    // Smart GPS Collar
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.02, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.6 })
    );
    collar.position.set(0, 0.36, -0.16);
    dog.add(collar);

    // Wagging tail (angled up at +Z)
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.22, 6), furMat);
    tail.position.set(0, 0.36, 0.28);
    tail.rotation.x = Math.PI / 3.5;
    dog.add(tail);

    // 4 Walking legs
    const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6);
    const legs: THREE.Mesh[] = [];
    [
      [-0.08, 0.11, -0.15],
      [0.08, 0.11, -0.15],
      [-0.08, 0.11, 0.15],
      [0.08, 0.11, 0.15],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.position.set(lx, ly, lz);
      dog.add(leg);
      legs.push(leg);
    });

    return { group: dog, tail, legs };
  }

  // Capivara Urbana de Recife (Iconic Brazilian Semi-Aquatic River Fauna)
  private createCapybara(scale = 1.0): { group: THREE.Group; headGroup: THREE.Group } {
    const capy = new THREE.Group();
    capy.scale.set(scale, scale, scale);

    const furMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.95 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x27190f, roughness: 0.9 });

    // Barrel stout body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.74, 10), furMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.35;
    body.castShadow = !this.isSoftwareGl;
    capy.add(body);

    // Rounded rear rump
    const rump = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), furMat);
    rump.position.set(0, 0.35, 0.32);
    capy.add(rump);

    // Head group (can gently bob while grazing)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.42, -0.38);

    // Signature blunt rectangular snout
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.32), furMat);
    head.position.set(0, 0, -0.12);
    headGroup.add(head);

    // Nostrils
    const snoutDark = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.05), darkMat);
    snoutDark.position.set(0, -0.04, -0.28);
    headGroup.add(snoutDark);

    // Small rounded ears
    [-0.1, 0.1].forEach((ex) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), darkMat);
      ear.position.set(ex, 0.12, -0.04);
      headGroup.add(ear);
    });

    capy.add(headGroup);

    // 4 Sturdy short legs
    const legGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.24, 8);
    [
      [-0.14, 0.12, -0.22],
      [0.14, 0.12, -0.22],
      [-0.15, 0.12, 0.22],
      [0.15, 0.12, 0.22],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.position.set(lx, ly, lz);
      capy.add(leg);
    });

    return { group: capy, headGroup };
  }

  // Aves Tropicais de Recife (Garça Branca & Guará Vermelho)
  private createTropicalBird(birdType: 'garca' | 'guara' = 'garca'): {
    group: THREE.Group;
    leftWing: THREE.Mesh;
    rightWing: THREE.Mesh;
  } {
    const bird = new THREE.Group();

    const isGarca = birdType === 'garca';
    const featherColor = isGarca ? 0xf8fafc : 0xef4444; // White egret or scarlet ibis
    const beakColor = isGarca ? 0xfacc15 : 0x1e293b;

    const featherMat = new THREE.MeshStandardMaterial({
      color: featherColor,
      roughness: 0.6,
    });
    const beakMat = new THREE.MeshStandardMaterial({ color: beakColor, roughness: 0.4 });

    // Aerodynamic body
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.58, 8), featherMat);
    body.rotation.x = -Math.PI / 2;
    body.position.y = 0;
    bird.add(body);

    // Long graceful neck & head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.32, 6), featherMat);
    neck.position.set(0, 0.1, -0.32);
    neck.rotation.x = -0.4;
    bird.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), featherMat);
    head.position.set(0, 0.22, -0.4);
    bird.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.22, 6), beakMat);
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0.22, -0.52);
    bird.add(beak);

    // Left Wing (with pivot at left side)
    const wingGeo = new THREE.BoxGeometry(0.65, 0.02, 0.28);
    wingGeo.translate(-0.32, 0, 0); // translate so origin is at the hinge
    const leftWing = new THREE.Mesh(wingGeo, featherMat);
    leftWing.position.set(-0.1, 0.04, -0.05);
    bird.add(leftWing);

    // Right Wing (with pivot at right side)
    const rightWingGeo = new THREE.BoxGeometry(0.65, 0.02, 0.28);
    rightWingGeo.translate(0.32, 0, 0); // translate so origin is at the hinge
    const rightWing = new THREE.Mesh(rightWingGeo, featherMat);
    rightWing.position.set(0.1, 0.04, -0.05);
    bird.add(rightWing);

    return { group: bird, leftWing, rightWing };
  }

  // ==========================================
  // SMART LAYERS: ENERGY, MOBILITY, AQI, IOT, WASTE
  // ==========================================
  private buildLayerOverlays() {
    // 1. SMART GRID CABLES
    const gridCables: [number, number, number, number][] = [
      [16, 16, -16, 16],
      [-16, 16, -16, -16],
      [-16, -16, 16, -16],
      [16, -16, 16, 16],
      [0, 0, 16, 16],
      [0, 0, -16, 16],
    ];

    gridCables.forEach(([x1, z1, x2, z2]) => {
      const path = new THREE.LineCurve3(new THREE.Vector3(x1, 0.12, z1), new THREE.Vector3(x2, 0.12, z2));
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(path, 20, 0.08, 8, false),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.85,
        })
      );
      this.energyLayerGroup.add(tube);

      const pulseMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 1.0 })
      );
      this.energyLayerGroup.add(pulseMesh);
      this.energyPulses.push({
        mesh: pulseMesh,
        path,
        t: Math.random(),
        speed: 0.008 + Math.random() * 0.004,
      });
    });

    // 2. MOBILITY LAYER
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.2, 32),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(12, 0.14, 22);
    this.mobilityLayerGroup.add(halo);

    // 3. ENVIRONMENT & AQI
    [
      { x: 18, z: 18, color: 0x06b6d4 },
      { x: -18, z: 18, color: 0x3b82f6 },
      { x: -18, z: -18, color: 0x10b981 },
      { x: 18, z: -18, color: 0x10b981 },
    ].forEach((dd) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(6.5, 7.5, 32),
        new THREE.MeshStandardMaterial({
          color: dd.color,
          emissive: dd.color,
          emissiveIntensity: 0.6,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(dd.x, 0.15, dd.z);
      this.environmentLayerGroup.add(ring);
    });

    // 4. CONNECTIVITY IOT
    const iotNodes = [
      new THREE.Vector3(8, 4.0, 16),
      new THREE.Vector3(-8, 4.0, 8),
      new THREE.Vector3(-8, 4.0, 20),
      new THREE.Vector3(8, 4.0, -18),
      new THREE.Vector3(-2, 4.0, 10),
      new THREE.Vector3(-2, 4.0, -14),
    ];
    for (let i = 0; i < iotNodes.length - 1; i++) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([iotNodes[i], iotNodes[i + 1]]);
      const lineMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.8, gapSize: 0.4 });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      this.connectivityLayerGroup.add(line);
    }

    // 5. WASTE PNEUMATIC TUBES
    const wasteTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 28, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.4, transparent: true, opacity: 0.5 })
    );
    wasteTube.rotation.z = Math.PI / 2;
    wasteTube.position.set(-14, 0.08, -12);
    this.wasteLayerGroup.add(wasteTube);
  }

  // ==========================================
  // SELECTION RETICLE
  // ==========================================
  private createSelectionMarker(): THREE.Group {
    const group = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 2.7, 32),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    group.add(ring);

    const pointer = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.9, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.9 })
    );
    pointer.rotation.x = Math.PI;
    pointer.position.y = 6.5;
    group.add(pointer);

    return group;
  }

  // ==========================================
  // INTERACTIVE RAYCASTING & CAMERA FOCUS
  // ==========================================
  private onPointerMove = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

    if (intersects.length > 0) {
      let root: THREE.Object3D | null = intersects[0].object;
      while (root && !root.userData?.id && root.parent && root.parent !== this.scene) {
        root = root.parent;
      }
      if (root?.userData?.id) {
        const found = SMART_OBJECTS.find((o) => o.id === root!.userData.id);
        if (found && found !== this.hoveredObject) {
          this.hoveredObject = found;
          this.renderer.domElement.style.cursor = 'pointer';
          this.callbacks.onHoverObject?.(found);
          return;
        }
      }
    }

    if (this.hoveredObject) {
      this.hoveredObject = null;
      this.renderer.domElement.style.cursor = 'default';
      this.callbacks.onHoverObject?.(null);
    }
  };

  private onPointerDown = (event: MouseEvent) => {
    if (event.button !== 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, true);

    if (intersects.length > 0) {
      let root: THREE.Object3D | null = intersects[0].object;
      while (root && !root.userData?.id && root.parent && root.parent !== this.scene) {
        root = root.parent;
      }
      if (root?.userData?.id) {
        const found = SMART_OBJECTS.find((o) => o.id === root!.userData.id);
        if (found) {
          this.selectObject(found);
          return;
        }
      }
    }
  };

  public selectObject(obj: SmartObjectData | null) {
    this.selectedObject = obj;
    this.callbacks.onSelectObject(obj);

    if (obj) {
      this.selectionMarker.position.set(obj.position[0], 0, obj.position[2]);
      this.selectionMarker.visible = true;

      this.focusCameraOn(
        new THREE.Vector3(obj.position[0] + 16, 14, obj.position[2] + 16),
        new THREE.Vector3(obj.position[0], 2, obj.position[2])
      );
    } else {
      this.selectionMarker.visible = false;
    }
  }

  public focusDistrict(districtId: string) {
    const dist = DISTRICTS[districtId];
    if (!dist) return;
    this.focusCameraOn(
      new THREE.Vector3(...dist.cameraPosition),
      new THREE.Vector3(...dist.cameraTarget)
    );
  }

  public resetView() {
    this.focusCameraOn(new THREE.Vector3(46, 35, 46), new THREE.Vector3(0, 0, 0));
    this.selectObject(null);
  }

  public setCameraPreset(mode: 'iso' | 'street' | 'bird') {
    if (mode === 'iso') {
      this.focusCameraOn(new THREE.Vector3(44, 34, 44), new THREE.Vector3(0, 0, 0));
    } else if (mode === 'street') {
      this.focusCameraOn(new THREE.Vector3(0, 3.2, 22), new THREE.Vector3(0, 2, 2));
    } else if (mode === 'bird') {
      this.focusCameraOn(new THREE.Vector3(0, 68, 0.1), new THREE.Vector3(0, 0, 0));
    }
  }

  private focusCameraOn(pos: THREE.Vector3, lookAt: THREE.Vector3) {
    this.camTargetPos.copy(pos);
    this.camTargetLookAt.copy(lookAt);
    this.isTransitioningCamera = true;
  }

  // ==========================================
  // LAYER TOGGLES & TIME OF DAY (SUNNY RECIFE)
  // ==========================================
  public toggleLayer(layer: SmartLayer, enabled: boolean) {
    if (enabled) {
      this.activeLayers.add(layer);
    } else {
      this.activeLayers.delete(layer);
    }

    if (layer === 'energia') this.energyLayerGroup.visible = enabled;
    if (layer === 'mobilidade') this.mobilityLayerGroup.visible = enabled;
    if (layer === 'ambiente') this.environmentLayerGroup.visible = enabled;
    if (layer === 'conectividade') this.connectivityLayerGroup.visible = enabled;
    if (layer === 'residuos') this.wasteLayerGroup.visible = enabled;
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.currentTimeOfDay = time;

    if (time === 'dia') {
      // Radiant tropical Recife sunshine
      this.scene.background = new THREE.Color('#67e8f9'); // Sunny Atlantic sky
      this.scene.fog = new THREE.FogExp2('#cffafe', 0.0055);
      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 4.2;
      this.dirLight.position.set(45, 60, 32);
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0xfef08a);
      this.hemiLight.intensity = 1.8;
      this.ambientLight.intensity = 0.65;
      this.renderer.toneMappingExposure = 1.32;
      this.streetLightsGroup.children.forEach((c) => (c.visible = false));
      this.windowMaterials.forEach((m) => (m.emissiveIntensity = 0.05));
    } else if (time === 'entardecer') {
      // Warm northeastern golden hour
      this.scene.background = new THREE.Color('#fb923c');
      this.scene.fog = new THREE.FogExp2('#ea580c', 0.009);
      this.dirLight.color.setHex(0xfbbf24);
      this.dirLight.intensity = 2.8;
      this.dirLight.position.set(58, 20, 20);
      this.hemiLight.intensity = 1.1;
      this.ambientLight.intensity = 0.5;
      this.renderer.toneMappingExposure = 1.15;
      this.streetLightsGroup.children.forEach((c) => (c.visible = true));
      this.windowMaterials.forEach((m) => (m.emissiveIntensity = 0.35));
    } else {
      // Noite Tecnológica Tropical
      this.scene.background = new THREE.Color('#030712');
      this.scene.fog = new THREE.FogExp2('#030712', 0.014);
      this.dirLight.color.setHex(0x1e3a8a);
      this.dirLight.intensity = 0.6;
      this.dirLight.position.set(20, 45, 20);
      this.hemiLight.intensity = 0.4;
      this.ambientLight.intensity = 0.3;
      this.renderer.toneMappingExposure = 1.05;
      this.streetLightsGroup.children.forEach((c) => (c.visible = true));
      this.windowMaterials.forEach((m) => {
        m.emissive.setHex(0x38bdf8);
        m.emissiveIntensity = 0.65;
      });
    }
  }

  // ==========================================
  // RENDER & ANIMATION LOOP (WITH ROAD HEIGHT ELEVATION)
  // ==========================================
  private onResize = () => {
    if (this.isDisposed || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private startLoop() {
    let lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.isDisposed) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      this.timeElapsed += delta;

      // 1. Camera transition damping
      if (this.isTransitioningCamera) {
        this.camera.position.lerp(this.camTargetPos, 0.06);
        this.controls.target.lerp(this.camTargetLookAt, 0.06);
        this.controls.update();
        if (
          this.camera.position.distanceTo(this.camTargetPos) < 0.2 &&
          this.controls.target.distanceTo(this.camTargetLookAt) < 0.2
        ) {
          this.isTransitioningCamera = false;
        }
      } else {
        this.controls.update();
      }

      // 2. Animate traffic actors along trajectories WITH EXACT BRIDGE SURFACE ELEVATION & SLOPE PITCH
      this.vehicles.forEach((veh) => {
        veh.progress = (veh.progress + veh.speed) % 1;
        const p1 = veh.path[0];
        const p2 = veh.path[1];

        // Linear interpolation along X and Z
        const curX = THREE.MathUtils.lerp(p1.x, p2.x, veh.progress);
        const curZ = THREE.MathUtils.lerp(p1.z, p2.z, veh.progress);

        // Get exact road surface height so cars, buses AND bikes drive firmly ON TOP of the bridge deck!
        const curY = this.getRoadSurfaceY(curX, curZ);
        veh.mesh.position.set(curX, curY, curZ);

        // Calculate forward direction vector along both X and Z axes
        // and pitch angle following bridge arches so vehicles drive straight forward along their road
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) {
          const dirX = dx / dist;
          const dirZ = dz / dist;
          const forwardStep = 0.5;
          const nextX = curX + dirX * forwardStep;
          const nextZ = curZ + dirZ * forwardStep;
          const nextY = this.getRoadSurfaceY(nextX, nextZ);

          veh.mesh.lookAt(new THREE.Vector3(nextX, nextY, nextZ));
        }
      });

      // 3. Animate Solar Catamaran along the Capibaribe River
      // Sails at water level and passes completely UNDER the bridge arches with wide clearance
      if (this.catamaranMesh) {
        this.catamaranProgress = (this.catamaranProgress + 0.0012) % 1;
        // Continuous navigation along the river channel at z = -7
        const boatX = Math.sin(this.catamaranProgress * Math.PI * 2) * 24;
        const boatDir = Math.cos(this.catamaranProgress * Math.PI * 2) >= 0 ? 1 : -1;
        this.catamaranMesh.position.x = boatX;
        this.catamaranMesh.position.y = 0.04 + Math.sin(this.timeElapsed * 2) * 0.012; // Natural water bobbing
        this.catamaranMesh.rotation.y = boatDir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      // 4. Animate pedestrians (sidewalk walkers, park strollers, joggers, bench sitters)
      this.pedestrians.forEach((ped, idx) => {
        if (ped.isSitting) {
          // Subtle natural breathing / idle motion on bench
          ped.mesh.position.y = (ped.origin.y || 0.44) + Math.sin(this.timeElapsed * 2 + idx) * 0.008;
          return;
        }

        if (ped.isLinear && ped.startPos && ped.endPos) {
          ped.progress = ((ped.progress ?? 0) + ped.speed) % 1;
          const curX = THREE.MathUtils.lerp(ped.startPos.x, ped.endPos.x, ped.progress);
          const curZ = THREE.MathUtils.lerp(ped.startPos.z, ped.endPos.z, ped.progress);
          const curY = this.getRoadSurfaceY(curX, curZ);
          ped.mesh.position.set(curX, curY + Math.abs(Math.sin(this.timeElapsed * 8 + idx)) * 0.04, curZ);

          const stepDir = ped.endPos.z !== ped.startPos.z ? (ped.endPos.z > ped.startPos.z ? 1 : -1) : 0;
          const lookDirX = ped.endPos.x !== ped.startPos.x ? (ped.endPos.x > ped.startPos.x ? 1 : -1) : 0;
          ped.mesh.lookAt(curX + lookDirX * 0.5, curY, curZ + stepDir * 0.5);
        } else {
          ped.angle += ped.speed;
          ped.mesh.position.x = ped.origin.x + Math.cos(ped.angle) * ped.radius;
          ped.mesh.position.z = ped.origin.z + Math.sin(ped.angle) * ped.radius;
          ped.mesh.position.y = Math.abs(Math.sin(this.timeElapsed * 6 + idx)) * 0.03;
          ped.mesh.rotation.y = -ped.angle + Math.PI / 2;
        }

        // Animated swinging limbs
        if (ped.leftLeg && ped.rightLeg) {
          const swing = Math.sin(this.timeElapsed * 8 + idx) * 0.45;
          ped.leftLeg.rotation.x = swing;
          ped.rightLeg.rotation.x = -swing;
        }
        if (ped.leftArm && ped.rightArm) {
          const swing = Math.sin(this.timeElapsed * 8 + idx) * 0.45;
          ped.leftArm.rotation.x = -swing;
          ped.rightArm.rotation.x = swing;
        }
      });

      // 4.1 Animate animals (dogs, capybaras, tropical birds)
      this.animals.forEach((animal, idx) => {
        if (animal.type === 'dog') {
          animal.angle += animal.speed;
          animal.mesh.position.x = animal.origin.x + Math.cos(animal.angle) * animal.radius;
          animal.mesh.position.z = animal.origin.z + Math.sin(animal.angle) * animal.radius;
          animal.mesh.position.y = Math.abs(Math.sin(this.timeElapsed * 10 + idx)) * 0.025;
          animal.mesh.rotation.y = -animal.angle + Math.PI / 2;

          if (animal.tail) {
            animal.tail.rotation.z = Math.sin(this.timeElapsed * 14 + idx) * 0.45;
          }
        } else if (animal.type === 'capybara') {
          // Gentle grazing motion
          if (animal.headGroup) {
            animal.headGroup.rotation.x = Math.sin(this.timeElapsed * 2.2 + idx) * 0.08;
            animal.headGroup.rotation.y = Math.cos(this.timeElapsed * 1.6 + idx) * 0.06;
          }
        } else if (animal.type === 'bird') {
          // Flight path above river and city
          animal.angle += animal.speed;
          const flyX = animal.origin.x + Math.cos(animal.angle) * animal.radius;
          const flyZ = animal.origin.z + Math.sin(animal.angle) * animal.radius;
          const alt = (animal.altitude ?? 15) + Math.sin(this.timeElapsed * 1.8 + idx) * 0.8;
          animal.mesh.position.set(flyX, alt, flyZ);
          animal.mesh.rotation.y = -animal.angle + Math.PI / 2;

          // Wing flapping
          if (animal.leftWing && animal.rightWing) {
            const flap = Math.sin(this.timeElapsed * 9 + idx) * 0.45;
            animal.leftWing.rotation.z = flap;
            animal.rightWing.rotation.z = -flap;
          }
        }
      });

      // 4.2 Animate Intelligent Adaptive Traffic Light Cycles (14-second cycle)
      // NS Phase: 0-6s Green, 6-8s Yellow, 8-14s Red
      // EW Phase: 0-8s Red, 8-13s Green, 13-14s Yellow
      const sigCycle = this.timeElapsed % 14.0;
      let nsSignal: 'green' | 'yellow' | 'red' = 'green';
      let ewSignal: 'green' | 'yellow' | 'red' = 'red';

      if (sigCycle < 6.0) {
        nsSignal = 'green';
        ewSignal = 'red';
      } else if (sigCycle < 8.0) {
        nsSignal = 'yellow';
        ewSignal = 'red';
      } else if (sigCycle < 13.0) {
        nsSignal = 'red';
        ewSignal = 'green';
      } else {
        nsSignal = 'red';
        ewSignal = 'yellow';
      }

      this.trafficSignals.forEach((sig) => {
        const state = sig.axis === 'NS' ? nsSignal : ewSignal;
        if (state === 'green') {
          sig.greenMat.emissiveIntensity = 2.4;
          sig.yellowMat.emissiveIntensity = 0.05;
          sig.redMat.emissiveIntensity = 0.05;
          if (sig.pedWalkMat) sig.pedWalkMat.emissiveIntensity = 0.05;
          if (sig.pedStopMat) sig.pedStopMat.emissiveIntensity = 2.4;
        } else if (state === 'yellow') {
          sig.greenMat.emissiveIntensity = 0.05;
          sig.yellowMat.emissiveIntensity = 2.4;
          sig.redMat.emissiveIntensity = 0.05;
          if (sig.pedWalkMat) sig.pedWalkMat.emissiveIntensity = 0.05;
          if (sig.pedStopMat) sig.pedStopMat.emissiveIntensity = 2.4;
        } else {
          sig.greenMat.emissiveIntensity = 0.05;
          sig.yellowMat.emissiveIntensity = 0.05;
          sig.redMat.emissiveIntensity = 2.4;
          if (sig.pedWalkMat) sig.pedWalkMat.emissiveIntensity = 2.4;
          if (sig.pedStopMat) sig.pedStopMat.emissiveIntensity = 0.05;
        }
      });

      // 5. Animate energy grid flow pulses
      this.energyPulses.forEach((pulse) => {
        pulse.t = (pulse.t + pulse.speed) % 1;
        const pt = pulse.path.getPoint(pulse.t);
        pulse.mesh.position.copy(pt);
      });

      // 6. Animate selection reticle
      if (this.selectionMarker.visible) {
        this.selectionMarker.children[1].position.y = 6.2 + Math.sin(this.timeElapsed * 4) * 0.3;
        this.selectionMarker.children[0].rotation.z = this.timeElapsed * 1.5;
      }

      // 7. Render Scene
      this.renderer.render(this.scene, this.camera);

      // Pacing
      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  // ==========================================
  // DISPOSAL & RESOURCE CLEANUP
  // ==========================================
  public dispose() {
    this.isDisposed = true;
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }

    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);

    this.controls.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
