document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const buttonsContainer = document.getElementById('marker-buttons-container');

    // Baza danych wskaźników z NOWYMI, REALISTYCZNYMI IKONAMI
    const carData = {
        markers: [
            { 
                id: "oil", 
                label: "Bagnet oleju", 
                color: "#FFC107", 
                position: "-0.4 0.1 0.1", 
                desc: "Sprawdzaj poziom oleju na ostudzonym silniku. Poziom powinien znajdować się między znacznikami MIN i MAX.",
                // Ikona: Kółko na palec i długi bagnet z nacięciami MIN/MAX
                icon: `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="22"/><line x1="9" y1="18" x2="15" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`
            },
            { 
                id: "washer", 
                label: "Płyn spryskiwaczy", 
                color: "#00BFFF", 
                position: "0.5 -0.2 0", 
                desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby.",
                // Ikona: Szyba, wycieraczka i kropelki
                icon: `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16s5-7 9-7 9 7 9 7"/><path d="M12 16v-6"/><path d="M12 4v2"/><path d="M8 5v1"/><path d="M16 5v1"/></svg>`
            },
            { 
                id: "coolant", 
                label: "Płyn chłodniczy", 
                color: "#FF4500", 
                position: "0.1 0.4 0.1", 
                desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku.",
                // Ikona: Fizyczna chłodnica z żeberkami i korkiem
                icon: `<svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="14" rx="1"/><line x1="8" y1="6" x2="8" y2="20"/><line x1="16" y1="6" x2="16" y2="20"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="16" x2="20" y2="16"/><path d="M8 3v3"/><path d="M16 3v3"/><line x1="10" y1="3" x2="14" y2="3"/></svg>`
            }
        ]
    };

    carData.markers.forEach((marker) => {
        // --- 1. GENEROWANIE OBIEKTU 3D W AR (Wracamy do kulek!) ---
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position); 

        // Klasyczna, dyskretna kulka
        const visualSphere = document.createElement('a-sphere');
        visualSphere.setAttribute('radius', '0.02'); // Zgrabne 2 cm
        visualSphere.setAttribute('color', marker.color);
        visualSphere.setAttribute('position', '0 0 0'); 
        
        wrapper.appendChild(visualSphere);
        anchor.appendChild(wrapper);

        // --- 2. GENEROWANIE PRZYCISKU 2D Z NOWĄ IKONĄ ---
        const uiButton = document.createElement('div');
        uiButton.className = 'ui-marker-btn';
        uiButton.style.backgroundColor = marker.color; 
        
        // Wstrzykujemy nowy kod SVG
        uiButton.innerHTML = marker.icon; 

        // Czarny kolor linii wewnątrz ikony
        uiButton.style.color = '#111';

        uiButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');
        });

        buttonsContainer.appendChild(uiButton);
    });

    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target.id !== 'flashlight-btn' && !e.target.closest('#info-panel') && !e.target.closest('.ui-marker-btn')) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    });

    // --- LOGIKA WYKRYWANIA SILNIKA ---
    anchor.addEventListener("targetFound", () => {
        buttonsContainer.classList.add('visible');
    });

    anchor.addEventListener("targetLost", () => {
        buttonsContainer.classList.remove('visible');
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // --- LOGIKA LATARKI ---
    let isTorchOn = false;
    if (flashlightBtn) {
        flashlightBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                const videoElement = document.querySelector('video');
                if (!videoElement || !videoElement.srcObject) {
                    alert("Kamera jeszcze się ładuje!");
                    return;
                }
                const stream = videoElement.srcObject;
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities && track.getCapabilities();
                if (!capabilities || !capabilities.torch) {
                    alert("Twoja przeglądarka blokuje latarkę z poziomu strony WWW.");
                    return;
                }
                isTorchOn = !isTorchOn;
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
                if (isTorchOn) { flashlightBtn.classList.add('active'); } 
                else { flashlightBtn.classList.remove('active'); }
            } catch (err) { console.error("Błąd włączania latarki:", err); }
        });
    }
});