/**
 * METEY 3D Architectural & Structural Engineering Interactive Engine
 * Powered by Three.js
 */
(function(window) {
  'use strict';

  function createMetey3DViewer(config) {
    const container = config.container;
    if (!container) return null;

    const isHero = config.mode === 'hero';
    let width = container.clientWidth || 800;
    let height = container.clientHeight || 600;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = isHero ? null : new THREE.Color(0x0d1a3b);
    scene.fog = isHero ? null : new THREE.FogExp2(0x0d1a3b, 0.009);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(isHero ? 49 : 45, isHero ? 34 : 30, isHero ? 62 : 55);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', 'Interactive building model. Drag to orbit; use the controls to inspect the structure.');

    // Orbit Controls
    let controls = null;
    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2 + 0.02; // allow slightly below ground
      controls.minDistance = 15;
      controls.maxDistance = 180;
      controls.target.set(0, 16, 0);
      if (isHero) {
        controls.enableZoom = false;
        controls.enablePan = false;
        renderer.domElement.style.touchAction = 'pan-y';
      }
      controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && config.autoRotate === true;
      controls.autoRotateSpeed = 0.6;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(50, 80, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    blueRimLight.position.set(-60, 40, -50);
    scene.add(blueRimLight);

    const amberFillLight = new THREE.PointLight(0xf59e0b, 1.2, 80);
    amberFillLight.position.set(0, 20, 0);
    scene.add(amberFillLight);

    // Master Groups
    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    let currentTypology = config.initialTypology || 'jindal';
    let currentXRay = Math.max(0, Math.min(1, config.initialXRay || 0)); // 0 = architecture, 1 = structure
    let currentExplode = 0;
    let floorNodes = [];
    let archMeshes = [];
    let structMeshes = [];
    let loadLines = [];
    let craneMesh = null;
    let hotspots = [];
    let isAssemblyPlaying = false;
    let assemblyProgress = 0;

    // Build Ground Grid & Site
    function buildGround() {
      const groundGroup = new THREE.Group();

      // Subtle architectural grid
      const grid = new THREE.GridHelper(120, 60, 0x46557c, 0x24345a);
      grid.position.y = -0.05;
      groundGroup.add(grid);

      // Ground disc with soft reflection tone
      const discGeo = new THREE.CircleGeometry(58, 64);
      const discMat = new THREE.MeshStandardMaterial({
        color: 0x11241c,
        roughness: 0.85,
        metalness: 0.2
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = -0.08;
      disc.receiveShadow = true;
      groundGroup.add(disc);

      // Concentric site circles
      const circleGeo = new THREE.RingGeometry(24, 24.3, 64);
      const circleMat = new THREE.MeshBasicMaterial({ color: 0x4a7c64, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(circleGeo, circleMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.04;
      groundGroup.add(ring);

      const circleGeo2 = new THREE.RingGeometry(40, 40.2, 64);
      const ring2 = new THREE.Mesh(circleGeo2, circleMat);
      ring2.rotation.x = -Math.PI / 2;
      ring2.position.y = -0.04;
      groundGroup.add(ring2);

      scene.add(groundGroup);
    }
    if (!isHero) buildGround();

    // Materials Palette
    const mats = {
      glassFacade: new THREE.MeshStandardMaterial({
        color: 0x5c8976,
        metalness: 0.35,
        roughness: 0.2,
        transparent: true,
        opacity: 0.92
      }),
      mullion: new THREE.MeshStandardMaterial({
        color: 0x22322a,
        metalness: 0.7,
        roughness: 0.3
      }),
      spandrel: new THREE.MeshStandardMaterial({
        color: 0x2e463a,
        metalness: 0.3,
        roughness: 0.5
      }),
      concreteSlab: new THREE.MeshStandardMaterial({
        color: 0xd8ded6,
        roughness: 0.7,
        metalness: 0.1
      }),
      rcColumn: new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.5,
        metalness: 0.2
      }),
      rcColumnXRay: new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0x0369a1,
        emissiveIntensity: 0.35
      }),
      shearCore: new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6,
        metalness: 0.3
      }),
      shearCoreXRay: new THREE.MeshStandardMaterial({
        color: 0xf97316,
        roughness: 0.2,
        metalness: 0.5,
        emissive: 0xc2410c,
        emissiveIntensity: 0.45
      }),
      steelTruss: new THREE.MeshStandardMaterial({
        color: 0xeab308,
        metalness: 0.8,
        roughness: 0.25,
        emissive: 0xca8a04,
        emissiveIntensity: 0.2
      }),
      foundation: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.9,
        metalness: 0.2
      }),
      rebarOrange: new THREE.MeshBasicMaterial({
        color: 0xfb923c,
        wireframe: true
      }),
      glowGreen: new THREE.MeshBasicMaterial({
        color: 0x10b981
      }),
      craneYellow: new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.6,
        roughness: 0.3
      }),
      craneCable: new THREE.MeshBasicMaterial({
        color: 0xffffff
      }),
      precastPanelArch: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.6,
        metalness: 0.1
      }),
      precastPanelXRay: new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.3,
        metalness: 0.4,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3
      })
    };

    // Build Tower Crane for Precast Simulator
    function createTowerCrane() {
      const crane = new THREE.Group();
      crane.position.set(24, 0, -18);

      // Mast / Tower
      const mastHeight = 44;
      const mastGeo = new THREE.BoxGeometry(1.6, mastHeight, 1.6);
      const mast = new THREE.Mesh(mastGeo, mats.craneYellow);
      mast.position.y = mastHeight / 2;
      crane.add(mast);

      // Mast lattice wireframe accent
      const wireMast = new THREE.BoxGeometry(1.7, mastHeight, 1.7, 2, 22, 2);
      const wireMesh = new THREE.Mesh(wireMast, new THREE.MeshBasicMaterial({ color: 0xca8a04, wireframe: true }));
      wireMesh.position.y = mastHeight / 2;
      crane.add(wireMesh);

      // Slewing unit & Cabin
      const cabGeo = new THREE.BoxGeometry(2.4, 2.8, 2.2);
      const cab = new THREE.Mesh(cabGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      cab.position.set(0, mastHeight + 1.4, 0);
      crane.add(cab);

      // Apex / Tower Head
      const apexGeo = new THREE.ConeGeometry(1.4, 6, 4);
      const apex = new THREE.Mesh(apexGeo, mats.craneYellow);
      apex.position.set(0, mastHeight + 5.8, 0);
      crane.add(apex);

      // Horizontal Jib & Counter-Jib Group (can rotate)
      const jibGroup = new THREE.Group();
      jibGroup.position.set(0, mastHeight + 2.8, 0);

      // Front Jib
      const frontJibGeo = new THREE.BoxGeometry(32, 1.2, 1.2);
      const frontJib = new THREE.Mesh(frontJibGeo, mats.craneYellow);
      frontJib.position.set(-15, 0, 0);
      jibGroup.add(frontJib);

      // Counter Jib with concrete weights
      const counterJibGeo = new THREE.BoxGeometry(12, 1.2, 1.2);
      const counterJib = new THREE.Mesh(counterJibGeo, mats.craneYellow);
      counterJib.position.set(7, 0, 0);
      jibGroup.add(counterJib);

      const weightGeo = new THREE.BoxGeometry(3.5, 2.2, 2.6);
      const weight = new THREE.Mesh(weightGeo, new THREE.MeshStandardMaterial({ color: 0x64748b }));
      weight.position.set(11, 0, 0);
      jibGroup.add(weight);

      // Trolley on Jib
      const trolleyGeo = new THREE.BoxGeometry(1.5, 0.6, 1.5);
      const trolley = new THREE.Mesh(trolleyGeo, new THREE.MeshStandardMaterial({ color: 0x334155 }));
      trolley.position.set(-18, -0.8, 0);
      jibGroup.add(trolley);

      // Hoist Cable
      const cablePoints = [new THREE.Vector3(-18, -0.8, 0), new THREE.Vector3(-18, -16, 0)];
      const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
      const cable = new THREE.Line(cableGeo, mats.craneCable);
      jibGroup.add(cable);

      // Suspended Precast Panel
      const panelGroup = new THREE.Group();
      panelGroup.position.set(-18, -17, 0);

      const panelGeo = new THREE.BoxGeometry(5.5, 3.2, 0.5);
      const panelMesh = new THREE.Mesh(panelGeo, mats.craneYellow);
      panelMesh.castShadow = true;
      panelGroup.add(panelMesh);

      // Precast branding tag
      const tagGeo = new THREE.PlaneGeometry(3.5, 1.2);
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 128;
      tagCanvas.height = 48;
      const tCtx = tagCanvas.getContext('2d');
      tCtx.fillStyle = '#0f172a';
      tCtx.fillRect(0, 0, 128, 48);
      tCtx.fillStyle = '#38bdf8';
      tCtx.font = 'bold 18px monospace';
      tCtx.fillText('METEY-PC', 8, 30);
      const tagTex = new THREE.CanvasTexture(tagCanvas);
      const tagMesh = new THREE.Mesh(tagGeo, new THREE.MeshBasicMaterial({ map: tagTex, side: THREE.DoubleSide }));
      tagMesh.position.z = 0.28;
      panelGroup.add(tagMesh);

      jibGroup.add(panelGroup);
      crane.add(jibGroup);

      crane.userData = { jibGroup, panelGroup, cable, cablePoints };
      return crane;
    }

    // Dispose model-specific resources while retaining the shared material palette.
    function disposeObjects(root, keepSharedMaterials = false) {
      const geometries = new Set();
      const materials = new Set();
      const shared = new Set(Object.values(mats));
      root.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      const textures = new Set();
      materials.forEach(material => {
        if (keepSharedMaterials && shared.has(material)) return;
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
        material.dispose();
      });
      textures.forEach(texture => texture.dispose());
    }

    // Build Model Typologies
    function buildBuilding(typology) {
      // Clear old model
      disposeObjects(modelRoot, true);
      while (modelRoot.children.length > 0) {
        modelRoot.remove(modelRoot.children[0]);
      }
      floorNodes = [];
      archMeshes = [];
      structMeshes = [];
      loadLines = [];
      hotspots = [];

      craneMesh = isHero ? null : createTowerCrane();
      if (craneMesh) modelRoot.add(craneMesh);

      if (typology === 'jindal') {
        buildJindalTower();
      } else if (typology === 'dundigal') {
        buildDundigalPrecast();
      } else {
        buildSaiLifeIndustrial();
      }

      updateXRayMaterials(currentXRay);
      updateExplodedView(currentExplode);
      updateHotspotPositions();
    }

    // TYPOLOGY 1: Jindal Corporate Tower (Commercial High-Rise with Diagrid & Glass Curtain)
    function buildJindalTower() {
      const numFloors = 10;
      const floorHeight = 3.2;
      const bWidth = 18;
      const bDepth = 14;

      // Foundation Base
      const foundationGroup = new THREE.Group();
      const fGeo = new THREE.BoxGeometry(bWidth + 4, 1.5, bDepth + 4);
      const fMesh = new THREE.Mesh(fGeo, mats.foundation);
      fMesh.position.y = 0.75;
      fMesh.receiveShadow = true;
      foundationGroup.add(fMesh);

      // Pile caps underneath
      for (let x = -8; x <= 8; x += 8) {
        for (let z = -6; z <= 6; z += 6) {
          const pileGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
          const pile = new THREE.Mesh(pileGeo, mats.rcColumn);
          pile.position.set(x, -1.5, z);
          foundationGroup.add(pile);
        }
      }
      foundationGroup.userData = { baseElevation: 0, explodeIndex: 0 };
      modelRoot.add(foundationGroup);
      floorNodes.push(foundationGroup);

      // Floor by floor building
      for (let i = 0; i < numFloors; i++) {
        const floorGroup = new THREE.Group();
        const baseElevation = 1.5 + i * floorHeight;
        floorGroup.position.y = baseElevation;
        floorGroup.userData = { baseElevation, explodeIndex: i + 1 };

        // 1. Concrete Slab
        const slabGeo = new THREE.BoxGeometry(bWidth, 0.45, bDepth);
        const slab = new THREE.Mesh(slabGeo, mats.concreteSlab);
        slab.position.y = 0.225;
        slab.castShadow = true;
        slab.receiveShadow = true;
        floorGroup.add(slab);

        // 2. Central Shear Core (Elevator Shafts & Shear Walls)
        const coreGeo = new THREE.BoxGeometry(5.2, floorHeight, 4.2);
        const core = new THREE.Mesh(coreGeo, mats.shearCoreXRay);
        core.position.set(0, floorHeight / 2, 0);
        core.castShadow = true;
        floorGroup.add(core);
        structMeshes.push(core);

        // 3. Reinforced Concrete Columns Grid
        const colRadius = 0.45;
        const colGeo = new THREE.CylinderGeometry(colRadius, colRadius, floorHeight, 16);
        const xPositions = [-7.5, 0, 7.5];
        const zPositions = [-5.5, 0, 5.5];

        xPositions.forEach(x => {
          zPositions.forEach(z => {
            // omit core center
            if (x === 0 && z === 0) return;
            const col = new THREE.Mesh(colGeo, mats.rcColumnXRay);
            col.position.set(x, floorHeight / 2, z);
            col.castShadow = true;
            floorGroup.add(col);
            structMeshes.push(col);
          });
        });

        // 4. Perimeter Beams (Structural skeleton)
        const beamXGeo = new THREE.BoxGeometry(bWidth, 0.4, 0.4);
        const beamZGeo = new THREE.BoxGeometry(0.4, 0.4, bDepth);

        const beamFront = new THREE.Mesh(beamXGeo, mats.steelTruss);
        beamFront.position.set(0, floorHeight - 0.2, 5.5);
        floorGroup.add(beamFront);
        structMeshes.push(beamFront);

        const beamBack = new THREE.Mesh(beamXGeo, mats.steelTruss);
        beamBack.position.set(0, floorHeight - 0.2, -5.5);
        floorGroup.add(beamBack);
        structMeshes.push(beamBack);

        const beamLeft = new THREE.Mesh(beamZGeo, mats.steelTruss);
        beamLeft.position.set(-7.5, floorHeight - 0.2, 0);
        floorGroup.add(beamLeft);
        structMeshes.push(beamLeft);

        const beamRight = new THREE.Mesh(beamZGeo, mats.steelTruss);
        beamRight.position.set(7.5, floorHeight - 0.2, 0);
        floorGroup.add(beamRight);
        structMeshes.push(beamRight);

        // 5. Diagrid Cross-Bracing on alternating bays
        if (i % 2 === 0) {
          const braceGeo = new THREE.CylinderGeometry(0.18, 0.18, Math.hypot(bWidth * 0.4, floorHeight), 8);
          const brace1 = new THREE.Mesh(braceGeo, mats.steelTruss);
          brace1.rotation.z = Math.PI / 4;
          brace1.position.set(0, floorHeight / 2, 5.6);
          floorGroup.add(brace1);
          structMeshes.push(brace1);

          const brace2 = brace1.clone();
          brace2.rotation.z = -Math.PI / 4;
          floorGroup.add(brace2);
          structMeshes.push(brace2);
        }

        // 6. Architectural Curtain Wall Glass Enclosure
        const glassGeo = new THREE.BoxGeometry(bWidth + 0.1, floorHeight - 0.1, bDepth + 0.1);
        const glass = new THREE.Mesh(glassGeo, mats.glassFacade);
        glass.position.y = floorHeight / 2;
        floorGroup.add(glass);
        archMeshes.push(glass);

        // Mullions (horizontal and vertical architectural bands)
        const mullionHGeo = new THREE.BoxGeometry(bWidth + 0.25, 0.18, bDepth + 0.25);
        const mullionH = new THREE.Mesh(mullionHGeo, mats.mullion);
        mullionH.position.y = floorHeight;
        floorGroup.add(mullionH);
        archMeshes.push(mullionH);

        for (let mx = -bWidth / 2 + 2; mx <= bWidth / 2 - 2; mx += 3.6) {
          const mullionVGeo = new THREE.BoxGeometry(0.12, floorHeight, bDepth + 0.22);
          const mullionV = new THREE.Mesh(mullionVGeo, mats.mullion);
          mullionV.position.set(mx, floorHeight / 2, 0);
          floorGroup.add(mullionV);
          archMeshes.push(mullionV);
        }

        // Vertical Load Flow Stream lines inside columns
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(7.5, floorHeight, 5.5),
          new THREE.Vector3(7.5, 0, 5.5)
        ]);
        const loadLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }));
        floorGroup.add(loadLine);
        loadLines.push(loadLine);

        modelRoot.add(floorGroup);
        floorNodes.push(floorGroup);
      }

      // Sky Terrace Roof Crown
      const roofElevation = 1.5 + numFloors * floorHeight;
      const roofGroup = new THREE.Group();
      roofGroup.position.y = roofElevation;
      roofGroup.userData = { baseElevation: roofElevation, explodeIndex: numFloors + 1 };

      const roofSlabGeo = new THREE.BoxGeometry(bWidth + 0.8, 0.6, bDepth + 0.8);
      const roofSlab = new THREE.Mesh(roofSlabGeo, mats.concreteSlab);
      roofSlab.position.y = 0.3;
      roofGroup.add(roofSlab);

      // Pergola / Crown Steel Louvers
      for (let z = -5; z <= 5; z += 1.8) {
        const louverGeo = new THREE.BoxGeometry(bWidth - 2, 0.3, 0.4);
        const louver = new THREE.Mesh(louverGeo, mats.steelTruss);
        louver.position.set(0, 3.2, z);
        roofGroup.add(louver);
        archMeshes.push(louver);
      }

      // Rooftop MEP & Glass Pavilion
      const pavilionGeo = new THREE.BoxGeometry(8, 2.8, 6);
      const pavilion = new THREE.Mesh(pavilionGeo, mats.glassFacade);
      pavilion.position.set(0, 1.7, 0);
      roofGroup.add(pavilion);
      archMeshes.push(pavilion);

      modelRoot.add(roofGroup);
      floorNodes.push(roofGroup);

      // Define Hotspots
      hotspots = [
        {
          id: 'facade',
          title: 'Low-E Unitized Curtain Wall',
          category: 'Architecture',
          desc: 'High-performance solar control double glazing with integrated thermal breaks. U-value 1.4 W/m²K, SHGC 0.26.',
          position: new THREE.Vector3(bWidth / 2 + 0.5, 18, 0)
        },
        {
          id: 'shear-core',
          title: 'Monolithic Shear Core',
          category: 'Structural Engineering',
          desc: 'Continuous slipformed high-strength core wall accommodating high lateral wind and seismic shears (Zone III design).',
          position: new THREE.Vector3(0, 14, 0)
        },
        {
          id: 'composite-columns',
          title: 'Precast & Steel Composite Grid',
          category: 'Structural Optimization',
          desc: 'Grade M50 self-compacting concrete with heavy-duty Fe550D rebar cage, transferring over 1,200 tons axial load per column.',
          position: new THREE.Vector3(7.5, 8, 5.5)
        },
        {
          id: 'sky-terrace',
          title: 'Biophilic Sky Terrace & Crown',
          category: 'Sustainable Design',
          desc: 'Structural steel crown acting as tuned mass damper housing and accessible rooftop breakout zone for building occupants.',
          position: new THREE.Vector3(0, roofElevation + 2, 4)
        }
      ];
    }

    // TYPOLOGY 2: Dundigal Monolithic Precast Housing (Modular precast panels & hollow-core slabs)
    function buildDundigalPrecast() {
      const numFloors = 7;
      const floorHeight = 2.9;
      const bWidth = 24;
      const bDepth = 12;

      // Foundation
      const foundationGroup = new THREE.Group();
      const raftGeo = new THREE.BoxGeometry(bWidth + 3, 1.2, bDepth + 3);
      const raft = new THREE.Mesh(raftGeo, mats.foundation);
      raft.position.y = 0.6;
      raft.receiveShadow = true;
      foundationGroup.add(raft);
      foundationGroup.userData = { baseElevation: 0, explodeIndex: 0 };
      modelRoot.add(foundationGroup);
      floorNodes.push(foundationGroup);

      for (let i = 0; i < numFloors; i++) {
        const floorGroup = new THREE.Group();
        const baseElevation = 1.2 + i * floorHeight;
        floorGroup.position.y = baseElevation;
        floorGroup.userData = { baseElevation, explodeIndex: i + 1 };

        // Precast Hollow-Core Floor Slabs
        for (let slabX = -bWidth / 2 + 2; slabX <= bWidth / 2 - 2; slabX += 4) {
          const slabGeo = new THREE.BoxGeometry(3.8, 0.35, bDepth);
          const slab = new THREE.Mesh(slabGeo, mats.concreteSlab);
          slab.position.set(slabX, 0.175, 0);
          slab.castShadow = true;
          floorGroup.add(slab);
        }

        // Modular Precast Wall Panels (Exterior)
        for (let px = -bWidth / 2 + 1.8; px <= bWidth / 2 - 1.8; px += 3.6) {
          const panelGeo = new THREE.BoxGeometry(3.4, floorHeight - 0.2, 0.4);
          const panel = new THREE.Mesh(panelGeo, mats.precastPanelArch);
          panel.position.set(px, floorHeight / 2, bDepth / 2);
          panel.castShadow = true;
          floorGroup.add(panel);
          archMeshes.push(panel);

          const panelBack = panel.clone();
          panelBack.position.z = -bDepth / 2;
          floorGroup.add(panelBack);
          archMeshes.push(panelBack);
        }

        // Precast Internal Cross Shear Walls
        for (let wx = -8; wx <= 8; wx += 8) {
          const wallGeo = new THREE.BoxGeometry(0.35, floorHeight - 0.1, bDepth - 1);
          const wall = new THREE.Mesh(wallGeo, mats.shearCoreXRay);
          wall.position.set(wx, floorHeight / 2, 0);
          floorGroup.add(wall);
          structMeshes.push(wall);
        }

        // Precast joint reveal lines (seams)
        for (let px = -bWidth / 2; px <= bWidth / 2; px += 3.6) {
          const seamGeo = new THREE.BoxGeometry(0.08, floorHeight, 0.45);
          const seam = new THREE.Mesh(seamGeo, mats.mullion);
          seam.position.set(px, floorHeight / 2, bDepth / 2);
          floorGroup.add(seam);
          archMeshes.push(seam);
        }

        modelRoot.add(floorGroup);
        floorNodes.push(floorGroup);
      }

      hotspots = [
        {
          id: 'precast-panel',
          title: '3D Modular Precast Sandwich Wall',
          category: 'Precast Technology',
          desc: 'Factory-cast concrete panels with built-in thermal insulation and electrical conduits. Zero wet plaster required.',
          position: new THREE.Vector3(5, 10, bDepth / 2 + 0.4)
        },
        {
          id: 'precast-joint',
          title: 'Grouted Rebar Coupler Joint',
          category: 'Structural Connections',
          desc: 'High-tolerance sleeve couplers filled with non-shrink high-strength grout, providing full moment continuity.',
          position: new THREE.Vector3(0, 7, bDepth / 2 + 0.4)
        },
        {
          id: 'hollow-core',
          title: 'Pre-Stressed Hollow-Core Slab',
          category: 'Material Efficiency',
          desc: 'Pre-tensioned strand floor system reducing self-weight by 35% and accelerating floor cycles to 4 days/slab.',
          position: new THREE.Vector3(-6, 8, 0)
        }
      ];
    }

    // TYPOLOGY 3: Sai Life Sciences R&D Hub (Industrial / Long-Span / Clean Facility)
    function buildSaiLifeIndustrial() {
      const numBays = 4;
      const bayWidth = 7;
      const bDepth = 22;
      const height = 9;

      const facilityGroup = new THREE.Group();
      facilityGroup.userData = { baseElevation: 0, explodeIndex: 0 };

      // Base slab
      const slabGeo = new THREE.BoxGeometry(numBays * bayWidth + 4, 1, bDepth + 4);
      const slab = new THREE.Mesh(slabGeo, mats.foundation);
      slab.position.y = 0.5;
      facilityGroup.add(slab);

      // Cleanroom Steel Portal Frames & Trusses
      for (let i = 0; i <= numBays; i++) {
        const x = - (numBays * bayWidth) / 2 + i * bayWidth;

        // Heavy steel columns
        const colGeo = new THREE.BoxGeometry(0.8, height, 0.8);
        const col1 = new THREE.Mesh(colGeo, mats.rcColumnXRay);
        col1.position.set(x, height / 2 + 1, bDepth / 2);
        facilityGroup.add(col1);
        structMeshes.push(col1);

        const col2 = col1.clone();
        col2.position.z = -bDepth / 2;
        facilityGroup.add(col2);
        structMeshes.push(col2);

        // Long-span Pratt Truss
        const trussSpan = bDepth;
        const topChord = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, trussSpan), mats.steelTruss);
        topChord.position.set(x, height + 2, 0);
        facilityGroup.add(topChord);
        structMeshes.push(topChord);

        const botChord = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, trussSpan), mats.steelTruss);
        botChord.position.set(x, height + 0.5, 0);
        facilityGroup.add(botChord);
        structMeshes.push(botChord);

        // Diagonal web members
        for (let z = -bDepth / 2 + 2; z <= bDepth / 2 - 2; z += 4) {
          const webGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 8);
          const web = new THREE.Mesh(webGeo, mats.steelTruss);
          web.rotation.x = Math.PI / 4;
          web.position.set(x, height + 1.25, z);
          facilityGroup.add(web);
          structMeshes.push(web);
        }
      }

      // Architectural Exterior Glazing & Insulated Panels
      const glassFrontGeo = new THREE.BoxGeometry(numBays * bayWidth, height, 0.2);
      const glassFront = new THREE.Mesh(glassFrontGeo, mats.glassFacade);
      glassFront.position.set(0, height / 2 + 1, bDepth / 2 + 0.2);
      facilityGroup.add(glassFront);
      archMeshes.push(glassFront);

      // Industrial Roof Deck
      const roofDeckGeo = new THREE.BoxGeometry(numBays * bayWidth + 2, 0.4, bDepth + 2);
      const roofDeck = new THREE.Mesh(roofDeckGeo, mats.spandrel);
      roofDeck.position.set(0, height + 2.4, 0);
      facilityGroup.add(roofDeck);
      archMeshes.push(roofDeck);

      modelRoot.add(facilityGroup);
      floorNodes.push(facilityGroup);

      hotspots = [
        {
          id: 'long-span-truss',
          title: '22m Column-Free Clear Span',
          category: 'Structural Efficiency',
          desc: 'High-strength castellated steel truss system ensuring vibration-free cleanroom laboratory floor below.',
          position: new THREE.Vector3(0, height + 1.2, 0)
        },
        {
          id: 'cleanroom-envelope',
          title: 'Aseptic Sealed Envelope',
          category: 'Industrial Architecture',
          desc: 'Interlocking insulated wall panels with antimicrobial silicone seals for negative-pressure pharma labs.',
          position: new THREE.Vector3(8, height / 2, bDepth / 2 + 0.4)
        }
      ];
    }

    // Material Blending for X-Ray
    function updateXRayMaterials(ratio) {
      currentXRay = ratio;

      // Facade transparency: from 0.92 down to 0.06 wireframe/semi-transparent
      mats.glassFacade.opacity = 0.92 * (1 - ratio) + 0.06 * ratio;
      mats.glassFacade.roughness = 0.2 * (1 - ratio) + 0.7 * ratio;
      mats.glassFacade.metalness = 0.35 * (1 - ratio) + 0.1 * ratio;
      mats.mullion.opacity = (1 - ratio * 0.82);
      mats.mullion.transparent = ratio > 0.05;
      mats.precastPanelArch.opacity = 1 - ratio * 0.9;
      mats.precastPanelArch.transparent = ratio > 0.05;

      // Structural Glow and Emissive intensity
      const glowScale = 0.2 + ratio * 0.9;
      mats.shearCoreXRay.emissiveIntensity = glowScale * 0.7;
      mats.rcColumnXRay.emissiveIntensity = glowScale * 0.6;
      mats.steelTruss.emissiveIntensity = glowScale * 0.5;

      loadLines.forEach(line => {
        line.visible = ratio > 0.15;
        line.material.color.setHex(ratio > 0.6 ? 0xf59e0b : 0x0284c7);
      });
    }

    // Exploded View Height Separation
    function updateExplodedView(ratio) {
      currentExplode = ratio;
      floorNodes.forEach(node => {
        const index = node.userData.explodeIndex || 0;
        const baseElevation = node.userData.baseElevation || 0;
        // explode upwards based on floor index
        const explodeOffset = index * ratio * 3.8;
        node.position.y = baseElevation + explodeOffset;
      });
    }

    // Kinetic Precast Assembly Animation Step
    function updateAssemblyAnimation(delta) {
      if (!isAssemblyPlaying || !craneMesh) return;

      assemblyProgress += delta * 0.5; // cycle
      if (assemblyProgress > Math.PI * 2) {
        assemblyProgress = 0;
      }

      const { jibGroup, panelGroup, cable, cablePoints } = craneMesh.userData;
      if (jibGroup) {
        // Rotate jib slowly towards building
        jibGroup.rotation.y = Math.sin(assemblyProgress) * 0.6 + 0.3;
      }

      if (panelGroup && cable) {
        // Lower panel down into place, then lift back up
        const targetY = -22 + Math.sin(assemblyProgress) * 6;
        panelGroup.position.y = targetY;

        // Update cable geometry
        cablePoints[1].y = targetY + 1;
        cable.geometry.setFromPoints(cablePoints);
      }
    }

    // Hotspot Screen Projection
    function updateHotspotPositions() {
      if (!config.onHotspotsUpdate) return;
      const screenHotspots = hotspots.map(h => {
        const worldPos = h.position.clone();
        // apply model transform if needed
        worldPos.project(camera);

        const x = (worldPos.x * 0.5 + 0.5) * width;
        const y = -(worldPos.y * 0.5 - 0.5) * height;
        const visible = worldPos.z > -1 && worldPos.z < 1 && x > 16 && x < width - 16 && y > 16 && y < height - 16;

        return {
          id: h.id,
          title: h.title,
          category: h.category,
          desc: h.desc,
          x,
          y,
          visible
        };
      });

      config.onHotspotsUpdate(screenHotspots);
    }

    // Set Lighting Mode
    function setLighting(mode) {
      if (mode === 'day') {
        scene.background = isHero ? null : new THREE.Color(0x0d1a3b);
        ambientLight.intensity = 0.8;
        dirLight.intensity = 1.4;
        dirLight.color.setHex(0xfffaed);
        amberFillLight.intensity = 1.0;
      } else if (mode === 'sunset') {
        scene.background = new THREE.Color(0x1a1528);
        ambientLight.intensity = 0.5;
        dirLight.intensity = 1.8;
        dirLight.color.setHex(0xf97316);
        amberFillLight.intensity = 2.2;
      } else if (mode === 'night') {
        scene.background = new THREE.Color(0x070d20);
        ambientLight.intensity = 0.25;
        dirLight.intensity = 0.4;
        dirLight.color.setHex(0x38bdf8);
        amberFillLight.intensity = 3.0; // bright internal office lights
      }
    }

    // Camera Presets
    function setCameraPreset(preset) {
      if (!controls) return;
      controls.autoRotate = false;
      if (preset === 'perspective') {
        camera.position.set(45, 32, 55);
        controls.target.set(0, 16, 0);
      } else if (preset === 'elevation') {
        camera.position.set(0, 20, 75);
        controls.target.set(0, 18, 0);
      } else if (preset === 'top') {
        camera.position.set(0, 80, 0.1);
        controls.target.set(0, 0, 0);
      } else if (preset === 'foundation') {
        camera.position.set(30, 4, 30);
        controls.target.set(0, 4, 0);
      }
      controls.update();
    }

    // Fill the hero area while leaving room for the full building as it rotates.
    function fitHeroCamera() {
      if (!isHero || !controls) return;
      const distance = Math.max(68, 45 / camera.aspect);
      camera.position.sub(controls.target).normalize().multiplyScalar(distance).add(controls.target);
      controls.update();
    }
    fitHeroCamera();

    // Resize Handler
    function onResize() {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      fitHeroCamera();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    }
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId = null;
    let visible = true;
    let destroyed = false;
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); });
    observer.observe(container);
    function resume() {
      if (!destroyed && visible && !document.hidden && animId === null) { clock.getDelta(); animate(); }
    }
    document.addEventListener('visibilitychange', resume);

    function animate() {
      animId = null;
      if (destroyed || !visible || document.hidden) return;
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      if (controls) controls.update();
      updateAssemblyAnimation(delta);
      updateHotspotPositions();

      renderer.render(scene, camera);
    }

    // Initialize first model
    buildBuilding(currentTypology);
    setLighting('day');
    animate();

    // Public API
    return {
      setTypology: function(typology) {
        currentTypology = typology;
        buildBuilding(typology);
      },
      setXRayRatio: function(ratio) {
        updateXRayMaterials(Math.max(0, Math.min(1, ratio)));
      },
      setExplodeRatio: function(ratio) {
        updateExplodedView(Math.max(0, Math.min(1, ratio)));
      },
      toggleAssembly: function(play) {
        isAssemblyPlaying = play !== undefined ? play : !isAssemblyPlaying;
        return isAssemblyPlaying;
      },
      setLighting: setLighting,
      setCameraPreset: setCameraPreset,
      toggleAutoRotate: function(enable) {
        if (controls) {
          controls.autoRotate = enable !== undefined ? enable : !controls.autoRotate;
          return controls.autoRotate;
        }
        return false;
      },
      resize: onResize,
      destroy: function() {
        destroyed = true;
        cancelAnimationFrame(animId);
        observer.disconnect();
        resizeObserver.disconnect();
        document.removeEventListener('visibilitychange', resume);
        window.removeEventListener('resize', onResize);
        controls?.dispose();
        disposeObjects(scene);
        Object.values(mats).forEach(material => material.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }

  window.createMetey3DViewer = createMetey3DViewer;
})(window);
