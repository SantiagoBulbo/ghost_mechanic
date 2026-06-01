document.addEventListener("DOMContentLoaded", () => {
    const anchor = document.getElementById('engine-anchor');
    const infoPanel = document.getElementById('info-panel');
    const infoTitle = document.getElementById('info-title');
    const infoDesc = document.getElementById('info-desc');
    const closeBtn = document.getElementById('close-btn');
    const flashlightBtn = document.getElementById('flashlight-btn');
    const buttonsContainer = document.getElementById('marker-buttons-container');
    const splashScreen = document.getElementById('splash-screen');
    const startBtn = document.getElementById('start-btn');
    const sceneEl = document.querySelector('a-scene');

    // --- LOGIKA EKRANU POWITALNEGO I PAMIĘCI SESJI (SMART FIX) ---
    // 1. Sprawdzamy, czy użytkownik już dzisiaj kliknął "Przejdź dalej"
    if (sessionStorage.getItem('arGhostStarted') === 'true') {
        // Jeśli tak: od razu ukrywamy ekran powitalny
        splashScreen.classList.add('hidden');
        
        // Dajemy ułamek sekundy na inicjalizację A-Frame po restarcie i odpalamy AR!
        setTimeout(() => {
            sceneEl.systems["mindar-image-system"].start();
        }, 100);
    }

    // 2. Co się dzieje przy pierwszym kliknięciu (gdy ktoś wchodzi pierwszy raz)
    startBtn.addEventListener('click', () => {
        sessionStorage.setItem('arGhostStarted', 'true'); // Zapisujemy w pamięci przeglądarki
        splashScreen.classList.add('hidden');
        sceneEl.systems["mindar-image-system"].start();
    });

    // Baza danych ze ŚCIEŻKAMI DO PLIKÓW PNG
    const carData = {
        markers: [
            { 
                id: "oil", 
                label: "Wlew oleju", 
                color: "#ffee00", 
                position: "-0.4 0.1 0.1", 
                desc: "Pamiętaj, aby poziom oleju był zawsze między MIN a MAX. Używaj oleju zalecanego przez producenta samochodu.",
                icon: "assets/oil.png" 
            },
            { 
                id: "oil_dipstick", 
                label: "Bagnet oleju", 
                color: "#f3a702", 
                position: "-0.3 0.07 0.1", 
                desc: "Bagnet służy do sprawdzania poziomu oleju.Pamiętaj aby samochód stał na poziomym terenie oraz silnik był zimny. Wyciągnij go, wytrzyj, włóż z powrotem i ponownie wyciągnij, aby odczytać poziom.",
                icon: "assets/bagnet_oleju.png" 
            },
            { 
                id: "washer", 
                label: "Płyn spryskiwaczy", 
                color: "#00BFFF", 
                position: "0.5 -0.2 0", 
                desc: "Używaj płynu zimowego (do -20°C). Korek ma zazwyczaj niebieski kolor i symbol szyby.",
                icon: "assets/washer.png"
            },
            { 
                id: "coolant", 
                label: "Płyn chłodniczy", 
                color: "#FF4500", 
                position: "0.1 0.4 0.1", 
                desc: "UWAGA: Układ znajduje się pod ciśnieniem! Otwieraj zbiornik wyrównawczy tylko na całkowicie zimnym silniku.",
                icon: "assets/coolant.png"
            }
        ]
    };

    carData.markers.forEach((marker) => {
        // --- 1. GENEROWANIE OBIEKTU 3D W AR (Kulki) ---
        const wrapper = document.createElement('a-entity');
        wrapper.setAttribute('position', marker.position); 

        const visualSphere = document.createElement('a-sphere');
        visualSphere.setAttribute('radius', '0.02'); 
        visualSphere.setAttribute('color', marker.color);
        visualSphere.setAttribute('position', '0 0 0'); 
        
        wrapper.appendChild(visualSphere);
        anchor.appendChild(wrapper);

        // --- 2. GENEROWANIE PRZYCISKU 2D Z PLIKIEM PNG ---
        const uiButton = document.createElement('div');
        uiButton.className = 'ui-marker-btn';
        uiButton.style.backgroundColor = marker.color; 
        
        // Tworzymy tag <img> i wrzucamy do przycisku
        const imgIcon = document.createElement('img');
        imgIcon.src = marker.icon;
        uiButton.appendChild(imgIcon);

        uiButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            
            // Funkcja, która ładuje nowe dane i wysuwa panel
            const showNewContent = () => {
                infoTitle.innerText = marker.label;
                infoDesc.innerText = marker.desc;
                infoPanel.classList.remove('hidden');
                infoPanel.classList.add('visible');
            };

            // Sprawdzamy, czy panel jest już wysunięty
            if (infoPanel.classList.contains('visible')) {
                // Jeśli tak: najpierw go chowamy...
                infoPanel.classList.remove('visible');
                infoPanel.classList.add('hidden');
                
                // ...czekamy 300 milisekund (tyle trwa zjazd w dół w CSS), a potem pokazujemy nowy!
                setTimeout(showNewContent, 300);
            } else {
                // Jeśli był schowany, po prostu go wysuwamy
                showNewContent();
            }
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

    anchor.addEventListener("targetFound", () => {
        buttonsContainer.classList.add('visible');
    });

    anchor.addEventListener("targetLost", () => {
        buttonsContainer.classList.remove('visible');
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    });

    // Latarka
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

    // --- RATUNKOWY HACK NA OBRACANIE EKRANU ---
    // Nasłuchujemy zmiany orientacji urządzenia
    window.addEventListener("orientationchange", () => {
        // Czekamy pół sekundy, aż system telefonu skończy animację obracania
        setTimeout(() => {
            window.location.reload(); // Odświeżamy stronę!
        }, 500);
    });

    // --- OBSŁUGA GESTU SWIPE W DÓŁ (Przeciągnięcie palcem) ---
    let startY = 0; // Tu zapiszemy, gdzie użytkownik położył palec

    // Kiedy użytkownik dotyka panelu...
    infoPanel.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY; // Zapisujemy pozycję Y palca
    }, { passive: true });

    // Kiedy użytkownik puszcza ekran...
    infoPanel.addEventListener('touchend', (e) => {
        let endY = e.changedTouches[0].clientY; // Sprawdzamy, gdzie palec wylądował
        
        // Jeśli pozycja końcowa jest o 50 pikseli niżej niż początkowa (czyli zjechał w dół)
        if (endY > startY + 50) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    }, { passive: true });

});