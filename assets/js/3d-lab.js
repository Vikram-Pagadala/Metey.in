
    // Initialize the integrated METEY 3D Lab
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('viewport-3d');
      const hotspotOverlay = document.getElementById('hotspot-overlay');
      const detailCard = document.getElementById('hotspot-detail-card');
      const cardTitle = document.getElementById('hotspot-card-title');
      const cardDesc = document.getElementById('hotspot-card-desc');

      // Telemetry Data lookup
      const telemetry = {
        jindal: {
          title: 'Jindal Corporate Tower',
          subtitle: 'Commercial High-Rise',
          system: 'Composite RC Core + Steel Diagrid',
          concrete: 'M40 / M50 Self-Compacting',
          steel: 'Fe550D High-Ductility TMT',
          seismic: 'Zone III Compliant (R=5)',
          cycle: '4.5 Days / Floor',
          carbon: '-24% Savings'
        },
        dundigal: {
          title: 'Dundigal Precast Housing',
          subtitle: '11-Storey Fast-Track Monolithic',
          system: 'Total Precast Shear Walls + Hollow-Core',
          concrete: 'Factory-Controlled M40 Precast',
          steel: 'Grouted Rebar Sleeve Couplers',
          seismic: 'Zone II/III Monolithic Emulation',
          cycle: '3.5 Days / Floor',
          carbon: '-31% Savings'
        },
        sailife: {
          title: 'Sai Life Sciences R&D Hub',
          subtitle: 'Pharma Research & Industrial',
          system: 'Long-Span Steel Trusses (22m)',
          concrete: 'M35 Heavy Industrial Foundation',
          steel: 'Fe350 High-Tensile Structural Steel',
          seismic: 'Vibration-Damped Foundation',
          cycle: 'Fast-Track 6 Months',
          carbon: '-18% Savings'
        }
      };

      const projectRoutes = { jindal: 'jindal', dundigal: 'dundigal', sailife: 'sai-life' };
      const requestedModel = new URLSearchParams(location.search).get('model');
      const initialModel = Object.hasOwn(telemetry, requestedModel) ? requestedModel : 'jindal';
      const viewerStatus = document.getElementById('viewer-status');
      const pins = new Map();
      let viewer;
      try {
        viewer = createMetey3DViewer({
          container,
          mode: 'fullscreen',
          initialTypology: initialModel,
          autoRotate: false,
          onHotspotsUpdate: spots => {
            const ids = new Set(spots.map(spot => spot.id));
            for (const [id, pin] of pins) {
              if (!ids.has(id)) { pin.remove(); pins.delete(id); }
            }
            for (const spot of spots) {
              let pin = pins.get(spot.id);
              if (!pin) {
                pin = document.createElement('button');
                pin.type = 'button';
                pin.className = 'hotspot-pin';
                pin.innerHTML = '<span class="hotspot-dot"></span><span class="hotspot-tag"></span>';
                pin.querySelector('.hotspot-tag').textContent = spot.title;
                pin.setAttribute('aria-label', 'Inspect ' + spot.title);
                pin.addEventListener('click', () => {
                  detailCard.classList.add('visible');
                  cardTitle.textContent = spot.title;
                  cardDesc.textContent = spot.desc;
                });
                pins.set(spot.id, pin);
                hotspotOverlay.appendChild(pin);
              }
              pin.hidden = !spot.visible;
              pin.style.left = spot.x + 'px';
              pin.style.top = spot.y + 'px';
            }
          }
        });
        viewerStatus.textContent = '● LIVE 3D';
      } catch {
        viewerStatus.textContent = '3D UNAVAILABLE';
        document.querySelector('.viewer-fallback').hidden = false;
        document.querySelector('.exp-scene-hint').hidden = true;
        container.replaceChildren();
        document.querySelectorAll('.exp-tab,.exp-mode-btn,.exp-tool-btn,.exp-left-dock button,.exp-left-dock input').forEach(control => { control.disabled = true; });
        return;
      }

      // Typology Tabs
      const tabs = document.querySelectorAll('.exp-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const type = tab.getAttribute('data-typology');
          viewer.setTypology(type);
          viewer.setXRayRatio(Number(document.getElementById('slider-xray').value) / 100);
          viewer.setExplodeRatio(Number(document.getElementById('slider-explode').value) / 100);
          const url = new URL(location.href);
          url.searchParams.set('model', type);
          history.replaceState(null, '', url);
          document.getElementById('model-project-link').href = '/projects/' + projectRoutes[type] + '/';

          // Update HUD
          const data = telemetry[type];
          if (data) {
            document.getElementById('hud-typology-title').innerHTML = `<strong>${data.title}</strong><span>${data.subtitle}</span>`;
            document.getElementById('spec-system').textContent = data.system;
            document.getElementById('spec-concrete').textContent = data.concrete;
            document.getElementById('spec-steel').textContent = data.steel;
            document.getElementById('spec-seismic').textContent = data.seismic;
            document.getElementById('spec-cycle').textContent = data.cycle;
            document.getElementById('spec-carbon').textContent = data.carbon;
          }
          closeCard();
        });
      });

      // Modes
      const btnArch = document.getElementById('btn-mode-arch');
      const btnStruct = document.getElementById('btn-mode-struct');
      const sliderXRay = document.getElementById('slider-xray');
      const valXRay = document.getElementById('val-xray');

      btnArch.addEventListener('click', () => {
        btnArch.classList.add('active');
        btnStruct.classList.remove('active');
        sliderXRay.value = 0;
        valXRay.textContent = '0%';
        viewer.setXRayRatio(0);
      });

      btnStruct.addEventListener('click', () => {
        btnStruct.classList.add('active');
        btnArch.classList.remove('active');
        sliderXRay.value = 100;
        valXRay.textContent = '100%';
        viewer.setXRayRatio(1);
      });

      sliderXRay.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        valXRay.textContent = `${val}%`;
        viewer.setXRayRatio(val / 100);
        if (val > 50) {
          btnStruct.classList.add('active');
          btnArch.classList.remove('active');
        } else {
          btnArch.classList.add('active');
          btnStruct.classList.remove('active');
        }
      });

      // Explode Slider
      const sliderExplode = document.getElementById('slider-explode');
      const valExplode = document.getElementById('val-explode');
      sliderExplode.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        valExplode.textContent = `${val}%`;
        viewer.setExplodeRatio(val / 100);
      });

      // Precast Crane Assembly Simulator
      const btnAssembly = document.getElementById('btn-toggle-assembly');
      const statusAssembly = document.getElementById('status-assembly');
      const assemblyIcon = document.getElementById('assembly-icon');
      const assemblyText = document.getElementById('assembly-btn-text');
      let isPlaying = false;

      btnAssembly.addEventListener('click', () => {
        isPlaying = viewer.toggleAssembly();
        statusAssembly.textContent = isPlaying ? 'ERECTING' : 'PAUSED';
        statusAssembly.dataset.state = isPlaying ? 'playing' : 'paused';
        assemblyIcon.textContent = isPlaying ? '⏸' : '▶';
        assemblyText.textContent = isPlaying ? 'Pause Precast Crane Simulation' : 'Simulate Precast Crane Erection';
        btnAssembly.setAttribute('aria-pressed', String(isPlaying));
      });

      // Hotspot detail card
      const closeCard = () => detailCard.classList.remove('visible');
      document.getElementById('hotspot-close').addEventListener('click', closeCard);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCard(); });

      // Camera Presets
      const camBtns = document.querySelectorAll('.exp-tool-btn[data-preset]');
      camBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          camBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          viewer.setCameraPreset(btn.getAttribute('data-preset'));
          rotating = false;
          rotateLabel.textContent = 'Auto-Spin: OFF';
          btnRotate.classList.remove('active');
          btnRotate.setAttribute('aria-pressed', 'false');
        });
      });

      // Lighting Presets
      const lightBtns = document.querySelectorAll('.exp-tool-btn[data-lighting]');
      lightBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          lightBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          viewer.setLighting(btn.getAttribute('data-lighting'));
        });
      });

      // Auto Rotate
      const btnRotate = document.getElementById('btn-autorotate');
      const rotateLabel = document.getElementById('autorotate-label');
      let rotating = false;
      rotateLabel.textContent = 'Auto-Spin: OFF';
      btnRotate.setAttribute('aria-pressed', 'false');
      btnRotate.addEventListener('click', () => {
        rotating = viewer.toggleAutoRotate();
        rotateLabel.textContent = `Auto-Spin: ${rotating ? 'ON' : 'OFF'}`;
        btnRotate.classList.toggle('active', rotating);
        btnRotate.setAttribute('aria-pressed', String(rotating));
      });
      const stateButtons = document.querySelectorAll('.exp-tab,.exp-mode-btn,.exp-tool-btn:not(#btn-autorotate)');
      function syncStates() { stateButtons.forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active')))); }
      document.querySelector('[data-typology="' + initialModel + '"]').click();
      syncStates();
      document.addEventListener('click', syncStates);
      document.addEventListener('input', syncStates);
      addEventListener('pagehide', event => { if (!event.persisted) viewer.destroy(); });
    });
