document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const buttonsContainer = document.getElementById('marker-buttons-container'); // Nowy kontener z HTML

    // Baza danych wskaźników
    const carData = {
        markers: [
            { id: "oil", label: "Bagnet oleju", color: "#FFC107", position: "-0.4 0.1 0.1", desc: "Sprawdzaj poziom oleju na ostudzonym silniku. Poziom powinien znajdować się między znacznikami MIN i MAX." },
            { id: "washer", label: "Płyn do spryskiwaczy", color: "#00BFFF", position: "0.5 -0.2 0", desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby." },
            { id: "coolant", label: "Płyn chłodniczy", color: "#FF4500", position: "0.1 0.4 0.1", desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku." }
        ]
    };

    // Pętla HYBRYDOWA - Generuje 3D i 2D jednocześnie!
    carData.markers.forEach((marker, index) => {
        
        // --- 1. GENEROWANIE OBIEKTU 3D W AR (Tylko do patrzenia) ---
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position); 

        const visualPoint = document.createElement('a-cone');
        visualPoint.setAttribute('radius-bottom', '0.02');
        visualPoint.setAttribute('radius-top', '0');       
        visualPoint.setAttribute('height', '0.06');        
        visualPoint.setAttribute('color', marker.color);
        visualPoint.setAttribute('rotation', '180 0 0');
        visualPoint.setAttribute('position', '0 0.03 0'); 
        
        wrapper.appendChild(visualPoint);
        anchor.appendChild(wrapper);

        // --- 2. GENEROWANIE PRZYCISKU 2D W INTERFEJSIE (Do klikania) ---
        const uiButton = document.createElement('div');
        uiButton.className = 'ui-marker-btn';
        uiButton.style.backgroundColor = marker.color; // Przycisk dostaje kolor wskaźnika
        uiButton.innerText = index + 1; // Wstawiamy numerek do środka (1, 2, 3...)

        // Pancerny event kliknięcia HTML (Nigdy nie zawodzi)
        uiButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            
            infoTitle.innerText = marker.label;
            infoDesc.innerText = marker.desc;
            
            infoPanel.classList.remove('hidden');
            infoPanel.classList.add('visible');
        });

        // Wstrzykujemy przycisk na ekran pod latarkę
        buttonsContainer.appendChild(uiButton);
    });

    // Zamykanie panelu
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Zamykanie po kliknięciu w dowolne inne miejsce
    window.addEventListener('click', (e) => {
        if (e.target.id !== 'flashlight-btn' && !e.target.closest('#info-panel') && !e.target.closest('.ui-marker-btn')) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    });

    // --- LOGIKA LATARKI (Zostaje bez zmian) ---
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

                if (isTorchOn) {
                    flashlightBtn.classList.add('active');
                } else {
                    flashlightBtn.classList.remove('active');
                }
            } catch (err) {
                console.error("Błąd podczas włączania latarki:", err);
            }
        });
    }
});