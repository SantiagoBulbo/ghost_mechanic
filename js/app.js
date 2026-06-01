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

    // --- BEZPIECZNA FUNKCJA STARTUJĄCA MINDAR (BEZ RACE CONDITION) ---
    const safeStartAR = () => {
        const startSystem = () => {
            if (sceneEl.systems && sceneEl.systems["mindar-image-system"]) {
                sceneEl.systems["mindar-image-system"].start();
            } else {
                console.error("System MindAR nie został jeszcze zainicjalizowany!");
            }
        };

        // Jeśli scena już się załadowała – odpalaj od razu
        if (sceneEl.hasLoaded) {
            startSystem();
        } else {
            // Jeśli jeszcze się ładuje – czekaj na oficjalne zdarzenie 'loaded' od A-Frame
            sceneEl.addEventListener("loaded", startSystem);
        }
    };

    // --- LOGIKA EKRANU POWITALNEGO I PAMIĘCI SESJI ---
    if (sessionStorage.getItem('arGhostStarted') === 'true') {
        splashScreen.classList.add('hidden');
        safeStartAR(); // Odpalamy bezpieczną funkcję
    }

    startBtn.addEventListener('click', () => {
        sessionStorage.setItem('arGhostStarted', 'true');
        splashScreen.classList.add('hidden');
        safeStartAR(); // Odpalamy bezpieczną funkcję
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
                desc: "Bagnet służy do sprawdzania poziomu oleju. Pamiętaj, aby samochód stał na poziomym terenie oraz silnik był zimny. Wyciągnij go, wytrzyj, włóż z powrotem i ponownie wyciągnij, aby odczytać poziom.",
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
        
        const imgIcon = document.createElement('img');
        imgIcon.src = marker.icon;
        uiButton.appendChild(imgIcon);

        uiButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            
            const showNewContent = () => {
                infoTitle.innerText = marker.label;
                infoDesc.innerText = marker.desc;
                infoPanel.classList.remove('hidden');
                infoPanel.classList.add('visible');
            };

            if (infoPanel.classList.contains('visible')) {
                infoPanel.classList.remove('visible');
                infoPanel.classList.add('hidden');
                setTimeout(showNewContent, 300);
            } else {
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

    // --- HACK NA OBRACANIE EKRANU ---
    window.addEventListener("orientationchange", () => {
        setTimeout(() => {
            window.location.reload(); 
        }, 500);
    });

    // --- OBSŁUGA GESTU SWIPE W DÓŁ ---
    let startY = 0;
    infoPanel.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    }, { passive: true });

    infoPanel.addEventListener('touchend', (e) => {
        let endY = e.changedTouches[0].clientY;
        if (endY > startY + 50) {
            infoPanel.classList.remove('visible');
            infoPanel.classList.add('hidden');
        }
    }, { passive: true });
});