document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const buttonsContainer = document.getElementById('marker-buttons-container');

    // Baza danych wskaźników z dodanym kodem SVG dla KONTROLEK Z AUTA
    const carData = {
        markers: [
            { 
                id: "oil", 
                label: "Bagnet oleju", 
                color: "#FFC107", 
                position: "-0.4 0.1 0.1", 
                desc: "Sprawdzaj poziom oleju na ostudzonym silniku. Poziom powinien znajdować się między znacznikami MIN i MAX.",
                // Ikona Oliwiarki
                icon: `<svg viewBox="0 0 24 24"><path d="M19 15c0-4.62-3.5-8-8-8H6c-1.65 0-3 1.35-3 3v2c0 1.65 1.35 3 3 3h1.5v3.5c0 1.38 1.12 2.5 2.5 2.5h5c1.38 0 2.5-1.12 2.5-2.5V15H20c.55 0 1-.45 1-1s-.45-1-1-1h-1zm-9 5.5V15H7.5v5.5H10z"/><path d="M13 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`
            },
            { 
                id: "washer", 
                label: "Płyn spryskiwaczy", 
                color: "#00BFFF", 
                position: "0.5 -0.2 0", 
                desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby.",
                // Ikona Szyby i Wycieraczki (z kropelkami)
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16c2-4 6-6 8-6s6 2 8 6"/><path d="M12 10v-4"/><path d="M8 10v-2"/><path d="M16 10v-2"/><circle cx="12" cy="3" r="1"/></svg>`
            },
            { 
                id: "coolant", 
                label: "Płyn chłodniczy", 
                color: "#FF4500", 
                position: "0.1 0.4 0.1", 
                desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku.",
                // Ikona Termometru w wodzie (Chłodziwo)
                icon: `<svg viewBox="0 0 24 24"><path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-3 7c-1.1 0-2-.9-2-2 0-.74.4-1.38 1-1.73V5c0-.55.45-1 1-1s1 .45 1 1v6.27c.6.35 1 1.01 1 1.73 0 1.1-.9 2-2 2z"/><path d="M3 19c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm18-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`
            }
        ]
    };

    carData.markers.forEach((marker) => {
        // --- 1. GENEROWANIE OBIEKTU 3D W AR ---
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position); 

        // Tylko czysty, elegancki stożek (bez tekstu!)
        const visualCone = document.createElement('a-cone');
        visualCone.setAttribute('radius-bottom', '0.03'); 
        visualCone.setAttribute('radius-top', '0');       
        visualCone.setAttribute('height', '0.08');        
        visualCone.setAttribute('color', marker.color);
        visualCone.setAttribute('rotation', '180 0 0'); 
        visualCone.setAttribute('position', '0 0.04 0'); 
        
        wrapper.appendChild(visualCone);
        anchor.appendChild(wrapper);

        // --- 2. GENEROWANIE PRZYCISKU 2D W INTERFEJSIE Z IKONĄ ---
        const uiButton = document.createElement('div');
        uiButton.className = 'ui-marker-btn';
        uiButton.style.backgroundColor = marker.color; 
        
        // Magia: Wstrzykujemy kod SVG kontrolki do środka przycisku!
        uiButton.innerHTML = marker.icon; 

        // Ustawienie koloru ikony wewnątrz na ciemny dla lepszego kontrastu
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