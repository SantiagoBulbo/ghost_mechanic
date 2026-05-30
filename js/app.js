document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const buttonsContainer = document.getElementById('marker-buttons-container');

    // Baza danych wskaźników
    const carData = {
        markers: [
            { id: "oil", label: "Bagnet oleju", color: "#FFC107", position: "-0.4 0.1 0.1", desc: "Sprawdzaj poziom oleju na ostudzonym silniku. Poziom powinien znajdować się między znacznikami MIN i MAX." },
            { id: "washer", label: "Płyn do spryskiwaczy", color: "#00BFFF", position: "0.5 -0.2 0", desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby." },
            { id: "coolant", label: "Płyn chłodniczy", color: "#FF4500", position: "0.1 0.4 0.1", desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku." }
        ]
    };

    // Pętla HYBRYDOWA - Generuje 3D z numerkami i 2D
    carData.markers.forEach((marker, index) => {
        const markerNumber = index + 1; // Numerek (1, 2, 3...)
        
        // --- 1. GENEROWANIE OBIEKTU 3D W AR ---
        // Kontener grupy, żebySphere i Text były razem
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position); 

        // KULA (Zamiast stożka)
        const visualSphere = document.createElement('a-sphere');
        visualSphere.setAttribute('radius', '0.03'); // Promień 3cm
        visualSphere.setAttribute('color', marker.color);
        visualPoint.setAttribute('position', '0 0 0'); // Środek wrappera
        
        wrapper.appendChild(visualSphere);

        // NUMEREK W 3D (A-Text)
        const visualText = document.createElement('a-text');
        visualText.setAttribute('value', markerNumber); // Wstawiamy numer
        visualText.setAttribute('color', '#111111'); // Ciemny tekst na jasnej kuli
        visualText.setAttribute('align', 'center'); // Środkowanie
        visualText.setAttribute('width', '1'); // Szerokość pola tekstowego
        visualText.setAttribute('wrap-count', '10'); // Skalowanie czcionki
        
        // Przesuwamy tekst leciutko do przodu na osi Z (np. o 3.1cm), 
        // żeby nie "wchodził" w kulę i był czytelny (nie migotał - błąd Z-fighting)
        visualText.setAttribute('position', '0 0 0.031'); 
        
        wrapper.appendChild(visualText);
        anchor.appendChild(wrapper);

        // --- 2. GENEROWANIE PRZYCISKU 2D W INTERFEJSIE ---
        const uiButton = document.createElement('div');
        uiButton.className = 'ui-marker-btn';
        uiButton.style.backgroundColor = marker.color; 
        uiButton.innerText = markerNumber; // Ten sam numerek co w 3D!

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

    // Zamykanie panelu opisowego
    closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Zamykanie opisów po kliknięciu w tło (poza przyciskami UI)
    window.addEventListener('click', (e) => {
        if (e.target.id !== 'flashlight-btn' && !e.target.closest('#info-panel') && !e.target.closest('.ui-marker-btn')) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    });

    // --- NOWA SEKCJA: LOGIKA WYKRYWANIA SILNIKA (MindAR Eventy) ---
    // Event: Silnik znaleziony -> pokaż menu przycisków
    anchor.addEventListener("targetFound", (event) => {
        console.log("Silnik wykryty - pokazuję menu.");
        buttonsContainer.classList.add('visible');
    });

    // Event: Silnik zgubiony -> schowaj menu przycisków
    anchor.addEventListener("targetLost", (event) => {
        console.log("Silnik zgubiony - chowam menu.");
        buttonsContainer.classList.remove('visible');
        // Opcjonalnie: zamknij też panel opisowy, jeśli był otwarty
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
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
                if (isTorchOn) { flashlightBtn.classList.add('active'); } 
                else { flashlightBtn.classList.remove('active'); }
            } catch (err) { console.error("Błąd podczas włączania latarki:", err); }
        });
    }
});