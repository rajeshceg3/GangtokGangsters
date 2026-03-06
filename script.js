// --- Lightweight Audio Engine ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const playTone = (freq = 440, type = 'sine', duration = 0.1, vol = 0.1) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
};

let activeAmbientNodes = [];

const stopAmbient = () => {
    activeAmbientNodes.forEach(node => {
        if (node.gain) {
            node.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
        }
        setTimeout(() => {
            if (node.source) {
                try { node.source.stop(); } catch (e) {}
                node.source.disconnect();
            }
            if (node.gain) {
                node.gain.disconnect();
            }
        }, 2000);
    });
    activeAmbientNodes = [];
};

const playAmbient = (mode) => {
    stopAmbient();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.setTargetAtTime(0.05, audioCtx.currentTime, 2); // Fade in
    gainNode.connect(audioCtx.destination);

    if (mode === 'wind') {
        // Simple white noise with lowpass filter for wind
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Deep wind rumble
        filter.Q.value = 1;

        // LFO for wind gusting
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.2; // Slow gusts
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        noise.connect(filter);
        filter.connect(gainNode);
        noise.start();

        activeAmbientNodes.push({ source: noise, gain: gainNode });
        activeAmbientNodes.push({ source: lfo, gain: null }); // Keep track to stop LFO
    } else if (mode === 'spiritual') {
        // Deep low frequency drones
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 110; // A2

        const osc2 = audioCtx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = 110.5; // Slight detune for beating

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);

        osc1.start();
        osc2.start();

        activeAmbientNodes.push({ source: osc1, gain: gainNode });
        activeAmbientNodes.push({ source: osc2, gain: null });
    } else if (mode === 'water') {
        // White noise with bandpass for water rushing
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800; // Higher frequency for water
        filter.Q.value = 0.5;

        noise.connect(filter);
        filter.connect(gainNode);
        noise.start();

        activeAmbientNodes.push({ source: noise, gain: gainNode });
    }
};

// --- Dynamic Color Extraction ---
const getAverageColor = (imgElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.naturalWidth || imgElement.width || 1;
    canvas.height = imgElement.naturalHeight || imgElement.height || 1;

    try {
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        // Sample center area to avoid borders
        const data = ctx.getImageData(canvas.width * 0.25, canvas.height * 0.25, canvas.width * 0.5, canvas.height * 0.5).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
            r += data[i];
            g += data[i+1];
            b += data[i+2];
            count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Ensure color isn't too dark or too bright for UI
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (luminance < 0.2) { r += 50; g += 50; b += 50; }
        if (luminance > 0.8) { r -= 50; g -= 50; b -= 50; }

        return {r, g, b};
    } catch (e) {
        return {r: 99, g: 102, b: 241}; // Default Indigo
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Data
    const locations = [
        {
            name: "MG Marg",
            description: "The vibrant, pedestrian-only heart of Gangtok. Lined with shops, cafes, and Victorian lamps, it's a pristine, litter-free zone perfect for evening strolls.",
            coords: [27.3314, 88.6138],
            image: "https://upload.wikimedia.org/wikipedia/commons/9/97/M.G._Marg%2C_Gangtok_01.jpg",
            url: "https://en.wikipedia.org/wiki/Mahatma_Gandhi_Marg_(Gangtok)",
            tags: ["Vibrant", "Heart of City"]
        },
        {
            name: "Rumtek Monastery",
            description: "A stunning Tibetan Buddhist monastery and a center of spiritual learning. It houses some of the world's most unique religious art objects and golden stupas.",
            coords: [27.2895, 88.5785],
            image: "https://upload.wikimedia.org/wikipedia/commons/7/75/Rumtek_Monastery_NEW.jpg",
            url: "https://en.wikipedia.org/wiki/Rumtek_Monastery",
            tags: ["Spiritual", "Buddhist"]
        },
        {
            name: "Tsomgo Lake",
            description: "A breathtaking glacial lake nestled at 12,313 ft. The lake changes color with the seasons, freezes in winter, and is revered as a sacred site by locals.",
            coords: [27.3747, 88.7629],
            image: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Tsongmo_Lake_or_Changu_Lake_-_East_Sikkim.jpg",
            url: "https://en.wikipedia.org/wiki/Lake_Tsomgo",
            tags: ["12,313 ft", "Nature"]
        },
        {
            name: "Nathu La Pass",
            description: "A high-altitude mountain pass on the historic Silk Road. It connects Sikkim with Tibet and offers dramatic, snowy Himalayan vistas that leave you speechless.",
            coords: [27.3861, 88.8306],
            image: "https://upload.wikimedia.org/wikipedia/commons/6/65/Nathu_La%2C_a_mountain_pass_in_the_Himalayas_on_the_Indo-China_Border.jpg",
            url: "https://en.wikipedia.org/wiki/Nathu_La",
            tags: ["High-Altitude", "Historical"]
        },
        {
            name: "Ganesh Tok",
            description: "A small, colorful temple dedicated to Lord Ganesha. Perched on a hill, it offers one of the best panoramic views of Gangtok city and the Kanchenjunga range.",
            coords: [27.3491, 88.6221],
            image: "https://upload.wikimedia.org/wikipedia/commons/1/11/Ganesh_Tok.jpg",
            url: "https://en.wikipedia.org/wiki/Ganesh_Tok",
            tags: ["Panoramic Views", "Temple"]
        },
        {
            name: "Ban Jhakri Falls",
            description: "A landscaped energy park featuring a 100-foot waterfall, shamanistic statues, and beautiful gardens highlighting the Ban Jhakri tradition.",
            coords: [27.3508, 88.6036],
            image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/A_scenic_view_of_Ban_Jhakri_Falls_Gangtok_Sikkim_India_2015.jpg",
            url: "https://en.wikipedia.org/wiki/Banjhakri_Falls_and_Energy_Park",
            tags: ["Nature", "Waterfall"]
        },
        {
            name: "Tashi View Point",
            description: "Famous for its sunrise views, offering a spectacular panorama of Mount Kanchenjunga and the Siniolchu peaks on a clear day.",
            coords: [27.3685, 88.6128],
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Tashi_view_point%2C_Gangtok.jpg",
            url: "https://en.wikipedia.org/wiki/Gangtok#Tourism",
            tags: ["Sunrise", "Scenic"]
        },
        {
            name: "Enchey Monastery",
            description: "A 200-year-old monastery belonging to the Nyingma order, built on a site believed to be blessed by Lama Drupthob Karpo.",
            coords: [27.3448, 88.6206],
            image: "https://upload.wikimedia.org/wikipedia/commons/d/db/Enchey_Monastery_-_Gangtok_-_Sikkim_-_India.jpg",
            url: "https://en.wikipedia.org/wiki/Enchey_Monastery",
            tags: ["Spiritual", "Historical"]
        },
        {
            name: "Do Drul Chorten",
            description: "A massive stupa surrounded by 108 prayer wheels. It is one of the most important and significant stupas in Sikkim.",
            coords: [27.3163, 88.6046],
            image: "https://upload.wikimedia.org/wikipedia/commons/8/87/Do-Drul_Chorten_Stupa.jpg",
            url: "https://en.wikipedia.org/wiki/Dro-dul_Chorten",
            tags: ["Stupa", "Spiritual"]
        },
        {
            name: "Namgyal Institute of Tibetology",
            description: "A museum and research centre dedicated to the religion, history, language, art and culture of the people of the Tibetan cultural area.",
            coords: [27.3155, 88.6045],
            image: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Namgyal_Institute_of_Tibetology.jpg",
            url: "https://en.wikipedia.org/wiki/Namgyal_Institute_of_Tibetology",
            tags: ["Culture", "Museum"]
        },
        {
            name: "Hanuman Tok",
            description: "A temple complex dedicated to Lord Hanuman, maintained by the Indian Army, offering bird's-eye views of Gangtok and the surrounding hills.",
            coords: [27.3562, 88.6318],
            image: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Hanuman_Tok.jpg",
            url: "https://en.wikipedia.org/wiki/Hanuman_Tok",
            tags: ["Temple", "Scenic"]
        }
    ];

    // Utility
    const triggerHaptic = (pattern = 10) => {
        if (navigator.vibrate) navigator.vibrate(pattern);
    };

    // Immersive Cursor Glow
    const cursorGlow = document.getElementById('cursor-glow');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;

    // Ambient light trailing the cursor
    if (window.innerWidth > 768) {
        cursorGlow.classList.add('active');
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        const renderGlow = () => {
            glowX += (mouseX - glowX) * 0.1;
            glowY += (mouseY - glowY) * 0.1;
            cursorGlow.style.transform = `translate(${glowX}px, ${glowY}px)`;
            requestAnimationFrame(renderGlow);
        };
        requestAnimationFrame(renderGlow);
    }

    // Interactive Button Magnetism
    const makeMagnetic = (element) => {
        if (window.innerWidth <= 768) return;

        let hasEntered = false;

        element.addEventListener('mouseenter', () => {
            if (!hasEntered) {
                playTone(800, 'sine', 0.05, 0.05); // Soft tick on hover
                hasEntered = true;
            }
        });

        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Subtle pull
            element.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        element.addEventListener('mouseleave', () => {
            hasEntered = false;
            element.style.transform = '';
            element.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            setTimeout(() => {
                element.style.transition = '';
            }, 400);
        });
    };

    // UI Elements
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const exploreBtn = document.getElementById('explore-btn');
    const infoPanel = document.getElementById('info-panel');
    const infoName = document.getElementById('info-name');
    const infoDescription = document.getElementById('info-description');
    const infoImage = document.getElementById('info-image');
    infoImage.crossOrigin = "Anonymous"; // Required for canvas sampling
    const infoLink = document.getElementById('info-link');
    const closePanel = document.getElementById('close-panel');

    // Controls
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const resetViewBtn = document.getElementById('reset-view');
    const exploreRandomBtn = document.getElementById('explore');
    const tourBtn = document.getElementById('tour-mode');

    // Apply Magnetism
    makeMagnetic(exploreBtn);
    makeMagnetic(zoomInBtn);
    makeMagnetic(zoomOutBtn);
    makeMagnetic(resetViewBtn);
    makeMagnetic(exploreRandomBtn);
    if (tourBtn) makeMagnetic(tourBtn);

    let selectedMarker = null; // Leaflet Marker object
    let selectedMarkerElement = null; // DOM Element
    const initialView = { lat: 27.3314, lng: 88.6138, zoom: 13 };
    const locationMarkers = [];

    let tourInterval = null;
    let currentTourIndex = -1;

    const stopTour = () => {
        if (!tourInterval) return;
        clearInterval(tourInterval);
        tourInterval = null;
        if (tourBtn) {
            tourBtn.setAttribute('data-tooltip', 'Auto Tour');
            const icon = tourBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('ph-pause');
                icon.classList.add('ph-play');
            }
        }
    };

    const startTour = () => {
        if (locationMarkers.length === 0) return;
        if (tourInterval) stopTour();

        if (tourBtn) {
            tourBtn.setAttribute('data-tooltip', 'Stop Tour');
            const icon = tourBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('ph-play');
                icon.classList.add('ph-pause');
            }
        }

        const nextLocation = () => {
            currentTourIndex = (currentTourIndex + 1) % locationMarkers.length;
            const marker = locationMarkers[currentTourIndex];
            if (marker) marker.fire('click');
        };

        nextLocation(); // start immediately
        tourInterval = setInterval(nextLocation, 10000); // every 10 seconds
    };

    // Initialize Map
    const map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        fadeAnimation: true,
        zoomAnimation: true
    }).setView([initialView.lat, initialView.lng], initialView.zoom);

    // Custom Dark Theme Map Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Welcome Screen Interaction
    const welcomeCard = document.querySelector('.welcome-card');
    welcomeOverlay.addEventListener('mousemove', (e) => {
        if (window.innerWidth <= 768) return;
        const rect = welcomeOverlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = (y - centerY) / centerY * -5;
        const tiltY = (x - centerX) / centerX * 5;
        welcomeCard.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        welcomeCard.style.transition = 'transform 0.1s ease-out';
    }, { passive: true });

    welcomeOverlay.addEventListener('mouseleave', () => {
        if (window.innerWidth <= 768) return;
        welcomeCard.style.transform = '';
        welcomeCard.style.transition = 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';
    });

    exploreBtn.addEventListener('click', () => {
        triggerHaptic(20);
        playTone(150, 'triangle', 0.8, 0.2); // Deep whoosh
        welcomeOverlay.classList.add('hidden');

        // Start atmospheric particles
        if (window.particleSystem) {
            window.particleSystem.start();
            document.getElementById('atmosphere').classList.add('active');
        }

        setTimeout(() => {
            map.flyTo([initialView.lat, initialView.lng], 14, {
                animate: true,
                duration: 2.5,
                easeLinearity: 0.25
            });

            // Stagger reveal markers after fly-in begins
            setTimeout(() => {
                locationMarkers.forEach((marker, index) => {
                    setTimeout(() => {
                        const el = marker.getElement().querySelector('.custom-marker-container');
                        if (el) el.classList.add('revealed');
                    }, index * 100); // 100ms stagger between each pin
                });
            }, 1000);

        }, 300);
    });

    // --- 3D Tilt Effect on Desktop Panel ---
    infoPanel.addEventListener('mousemove', (e) => {
        // Only apply on desktop
        if (window.innerWidth <= 768) return;

        const rect = infoPanel.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Calculate tilt
        const tiltX = (y - centerY) / centerY * -10; // Max tilt 10deg
        const tiltY = (x - centerX) / centerX * 10;

        infoPanel.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        infoPanel.style.transition = 'transform 0.1s ease-out';

        // Enhanced Parallax for the Image inside
        // Move opposite to the mouse direction
        const imgOffsetX = (x - centerX) / centerX * -5; // max 5% translation
        const imgOffsetY = (y - centerY) / centerY * -5;

        // Ensure image has transition and isn't fighting the Ken Burns animation too much
        if (infoImage.classList.contains('loaded')) {
             infoImage.style.transform = `scale(1.15) translate(${imgOffsetX}%, ${imgOffsetY}%)`;
             infoImage.style.transition = 'transform 0.1s ease-out';
        }

    }, { passive: true });

    infoPanel.addEventListener('mouseleave', () => {
        if (window.innerWidth <= 768) return;
        // Reset transform to let CSS class rules take over (or reset to 0)
        infoPanel.style.transform = '';
        infoPanel.style.transition = 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';

        if (infoImage.classList.contains('loaded')) {
             infoImage.style.transform = '';
             infoImage.style.transition = 'transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';
        }
    });

    // Close Panel Logic
    const closeInfoPanel = () => {
        triggerHaptic();
        playTone(300, 'sine', 0.1, 0.1);

        // Stop immersive experiences
        stopAmbient();
        if (window.particleSystem) {
            window.particleSystem.setMode('default');
        }

        // Only fly out if a marker was actually selected
        if (selectedMarker) {
            map.flyTo([initialView.lat, initialView.lng], initialView.zoom, {
                animate: true,
                duration: 1.8,
                easeLinearity: 0.2
            });
        }

        infoPanel.classList.remove('visible');
        if (selectedMarkerElement) {
            selectedMarkerElement.classList.remove('selected');
            selectedMarkerElement = null;
        }
        if (selectedMarker) {
            selectedMarker.setZIndexOffset(0); // Reset z-index
            selectedMarker = null;
        }
        infoImage.classList.remove('loaded');
        infoImage.style.transform = ''; // Reset parallax
    };

    closePanel.addEventListener('click', closeInfoPanel);

    map.on('click', (e) => {
        if (e.originalEvent && e.originalEvent.isTrusted) {
            playTone(200, 'sine', 0.1, 0.05);
            const ripple = document.createElement('div');
            ripple.className = 'map-ripple';
            ripple.style.left = e.containerPoint.x + 'px';
            ripple.style.top = e.containerPoint.y + 'px';
            document.getElementById('map').appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        }

        // Close if clicking on the map (background)
        if (!e.originalEvent.target.closest('.custom-marker-container')) {
            closeInfoPanel();
            stopTour();
        }
    });

    // Control Dock Logic
    const addClickSound = (btn) => btn.addEventListener('click', () => playTone(600, 'sine', 0.05, 0.1));
    addClickSound(zoomInBtn);
    addClickSound(zoomOutBtn);
    addClickSound(resetViewBtn);
    addClickSound(exploreRandomBtn);
    if (tourBtn) addClickSound(tourBtn);

    zoomInBtn.addEventListener('click', () => map.setZoom(map.getZoom() + 1));
    zoomOutBtn.addEventListener('click', () => map.setZoom(map.getZoom() - 1));
    resetViewBtn.addEventListener('click', closeInfoPanel);

    if (tourBtn) {
        tourBtn.addEventListener('click', () => {
            triggerHaptic();
            if (tourInterval) {
                stopTour();
            } else {
                startTour();
            }
        });
    }

    exploreRandomBtn.addEventListener('click', () => {
        triggerHaptic();
        if (locationMarkers.length === 0) return;

        let randomIndex;
        let randomMarker;
        // Avoid picking the same marker twice in a row if possible
        do {
            randomIndex = Math.floor(Math.random() * locationMarkers.length);
            randomMarker = locationMarkers[randomIndex];
        } while (randomMarker === selectedMarker && locationMarkers.length > 1);

        randomMarker.fire('click');
    });

    // --- Mobile Bottom Sheet Swipe Logic ---
    const mobileHandle = document.querySelector('.panel-handle-mobile');
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    // Use passive listeners for better scroll performance
    mobileHandle.addEventListener('touchstart', (e) => {
        if (window.innerWidth > 768) return; // Disable on desktop
        triggerHaptic();
        startY = e.touches[0].clientY;
        currentY = startY;
        isDragging = true;
        infoPanel.style.transition = 'none';
    }, { passive: true });

    mobileHandle.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Only allow dragging down, but with some resistance if dragging up (rubber band)
        // Actually, just prevent dragging up to avoid confusion
        if (deltaY > 0) {
            infoPanel.style.transform = `translateY(${deltaY}px)`;
        }
    }, { passive: true });

    mobileHandle.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        triggerHaptic();
        isDragging = false;
        infoPanel.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

        const deltaY = currentY - startY;
        // If dragged down more than 80px or at high velocity (simplified check here), close it
        if (deltaY > 80) {
            closeInfoPanel();
            // Reset transform after animation
            setTimeout(() => {
                infoPanel.style.transform = '';
            }, 500);
        } else {
            // Snap back
            infoPanel.style.transform = '';
        }
    });

    // Create Markers
    locations.forEach(location => {
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="custom-marker-container">
                    <div class="pin-head"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        const marker = L.marker(location.coords, { icon: customIcon }).addTo(map);
        locationMarkers.push(marker);

        marker.on('mouseover', () => {
            playTone(600, 'sine', 0.05, 0.02);
        });

        marker.on('click', (e) => {
            triggerHaptic(15);
            playTone(800, 'sine', 0.1, 0.1); // Marker click sound
            L.DomEvent.stopPropagation(e);

            // Only stop tour if it was a real user click, not programmatic
            if (e.originalEvent && e.originalEvent.isTrusted) {
                stopTour();
            }

            // Snap content elements to their initial state
            const contentElements = document.querySelectorAll('#info-content > .location-meta, #info-content > #info-name, #info-content > #info-description, #info-content > .action-bar');
            contentElements.forEach(el => {
                el.style.transition = 'none';
                el.style.opacity = '0';
                el.style.transform = 'translateY(16px)';
            });

            // Force reflow to register the initial state
            void infoPanel.offsetWidth;

            // Clear inline styles so CSS classes take over and trigger transitions
            contentElements.forEach(el => {
                el.style.transition = '';
                el.style.opacity = '';
                el.style.transform = '';
            });

            // Deselect previous
            if (selectedMarkerElement) {
                selectedMarkerElement.classList.remove('selected');
            }
            if (selectedMarker) {
                selectedMarker.setZIndexOffset(0);
            }

            // Select new
            const element = e.target.getElement().querySelector('.custom-marker-container');
            if (element) {
                element.classList.add('selected');
                selectedMarkerElement = element;
            }
            selectedMarker = marker;
            marker.setZIndexOffset(1000); // Bring to front

            // Update Info
            infoName.textContent = location.name;
            infoDescription.textContent = location.description;
            infoLink.href = location.url;

            // Update Location Meta Tags
            const metaContainer = document.querySelector('#info-content > .location-meta');
            if (metaContainer && location.tags) {
                metaContainer.innerHTML = '';
                location.tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'meta-tag';
                    span.textContent = tag;
                    metaContainer.appendChild(span);
                });
            }

            // Image Loading Logic
            infoImage.classList.remove('loaded');
            infoImage.src = location.image;
            infoImage.onload = () => {
                infoImage.classList.add('loaded');

                // Dynamic Theming
                const color = getAverageColor(infoImage);
                const rgbString = `${color.r}, ${color.g}, ${color.b}`;
                const hexString = `#${color.r.toString(16).padStart(2,'0')}${color.g.toString(16).padStart(2,'0')}${color.b.toString(16).padStart(2,'0')}`;

                document.documentElement.style.setProperty('--brand-primary', hexString);
                document.documentElement.style.setProperty('--brand-glow', `rgba(${rgbString}, 0.6)`);
                document.documentElement.style.setProperty('--brand-gradient', `linear-gradient(135deg, rgba(${color.r+40}, ${color.g+40}, ${color.b+40}, 1) 0%, ${hexString} 100%)`);

                if (window.particleSystem) {
                    window.particleSystem.setThemeColor(color);
                }
            };

            // Contextual Immersion based on Tags
            if (location.tags && window.particleSystem) {
                const tagStr = location.tags.join(' ').toLowerCase();
                let newMode = 'default';
                let ambientMode = null;

                if (tagStr.includes('12,313 ft') || tagStr.includes('high-altitude')) {
                    newMode = 'snow';
                    ambientMode = 'wind';
                } else if (tagStr.includes('spiritual') || tagStr.includes('buddhist') || tagStr.includes('temple')) {
                    newMode = 'embers';
                    ambientMode = 'spiritual';
                } else if (tagStr.includes('waterfall')) {
                    newMode = 'rain';
                    ambientMode = 'water';
                } else if (tagStr.includes('nature')) {
                    newMode = 'fireflies';
                    ambientMode = 'water';
                }

                window.particleSystem.setMode(newMode);
                if (ambientMode) playAmbient(ambientMode);
                else stopAmbient();
            }

            // Show Panel
            infoPanel.classList.add('visible');
            infoPanel.style.transform = '';

            // Fly to location with Offset Logic
            let targetLat = location.coords[0];
            let targetLng = location.coords[1];

            // Hyper-optimized offsets for better framing
            // Using precise calculations based on viewport
            if (window.innerWidth <= 768) {
                // Mobile: Panel takes bottom ~80vh. Visible area is top 20%.
                // Center of visible area is 10% from top.
                // Screen center is 50%. Offset needed ~40% of screen height.
                // At Zoom 15, this translates roughly to 0.01 degrees.
                targetLat -= 0.009;
            } else {
                // Desktop: Panel (380px) + Margin (32px) = 412px left offset.
                // We want the pin centered in the remaining space.
                // Shift map center to the left to bring pin right.
                targetLng -= 0.004;
            }

            map.flyTo([targetLat, targetLng], 15, {
                animate: true,
                duration: 1.8,
                easeLinearity: 0.2
            });
        });
    });
});

// --- Atmospheric Particle System (Snow/Mist) ---
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isRunning = false;
        this.mode = 'default';

        this.mouseX = -1000;
        this.mouseY = -1000;

        this.currentColor = { r: 255, g: 255, b: 255 }; // Default white
        this.targetColor = { r: 255, g: 255, b: 255 };

        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });

        // Track mouse movements for interactive particles
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, { passive: true });

        // Create initial particles
        this.setMode('default');
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setThemeColor(color) {
        this.targetColor = color;
    }

    setMode(mode) {
        if (this.mode === mode) return;
        this.mode = mode;
        this.particles = [];
        const particleCount = window.innerWidth > 768 ? 100 : 50;

        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        let p = {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.5 + 0.1,
            phase: Math.random() * Math.PI * 2 // For pulsating effects
        };

        if (this.mode === 'snow') {
            p.speedX = Math.random() * 2 - 1;
            p.speedY = Math.random() * 3 + 2; // Fast downward
            p.size = Math.random() * 3 + 1;
        } else if (this.mode === 'embers') {
            p.speedX = Math.random() * 1 - 0.5;
            p.speedY = -(Math.random() * 2 + 0.5); // Floating upward
            p.size = Math.random() * 2 + 1;
            p.targetColor = { r: 255, g: 150 + Math.random() * 50, b: 50 };
        } else if (this.mode === 'fireflies') {
            p.speedX = Math.random() * 1 - 0.5;
            p.speedY = Math.random() * 1 - 0.5; // Wandering
            p.size = Math.random() * 2 + 1.5;
            p.targetColor = { r: 150 + Math.random() * 50, g: 255, b: 150 };
        } else if (this.mode === 'rain') {
            p.speedX = Math.random() * 0.5 + 0.5; // Slight slant
            p.speedY = Math.random() * 5 + 5; // Fast downward
            p.size = Math.random() * 1.5 + 0.5; // Thin lines
            p.length = Math.random() * 10 + 10; // Length of rain drop
        } else {
            // Default mist
            p.speedX = Math.random() * 0.5 - 0.25;
            p.speedY = Math.random() * 0.5 + 0.1;
        }

        return p;
    }

    update() {
        if (!this.isRunning) return;

        // Smoothly transition base colors
        if (this.mode === 'default' || this.mode === 'snow') {
            this.currentColor.r += (this.targetColor.r - this.currentColor.r) * 0.05;
            this.currentColor.g += (this.targetColor.g - this.currentColor.g) * 0.05;
            this.currentColor.b += (this.targetColor.b - this.currentColor.b) * 0.05;
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            p.phase += 0.05;

            // Interactive wind/repulsion effect based on mouse cursor
            const dx = p.x - this.mouseX;
            const dy = p.y - this.mouseY;
            const distance = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
            const maxDistance = 150; // Interaction radius

            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                p.x += (dx / distance) * force * 2;
                p.y += (dy / distance) * force * 2;
            }

            p.x += p.speedX;
            p.y += p.speedY;

            // Mode specific updates
            let renderOpacity = p.opacity;
            let renderColor = this.currentColor;

            if (this.mode === 'snow') {
                // Add some sway
                p.x += Math.sin(p.phase) * 0.5;
            } else if (this.mode === 'embers') {
                renderColor = p.targetColor;
                renderOpacity = p.opacity * (0.5 + Math.sin(p.phase) * 0.5); // Flickering
                // Add some erratic horizontal movement
                p.x += (Math.random() - 0.5) * 1;
            } else if (this.mode === 'fireflies') {
                renderColor = p.targetColor;
                renderOpacity = p.opacity * (0.2 + Math.max(0, Math.sin(p.phase))); // Pulsing
                // Smooth wandering
                p.speedX += (Math.random() - 0.5) * 0.1;
                p.speedY += (Math.random() - 0.5) * 0.1;
                // Clamp speed
                p.speedX = Math.max(-1, Math.min(1, p.speedX));
                p.speedY = Math.max(-1, Math.min(1, p.speedY));
            }

            // Wrap around logic
            if (this.mode === 'embers') {
                if (p.y < 0) p.y = this.height;
            } else if (this.mode === 'fireflies') {
                if (p.y > this.height) p.y = 0;
                if (p.y < 0) p.y = this.height;
            } else {
                if (p.y > this.height) p.y = 0;
            }
            if (p.x > this.width) p.x = 0;
            if (p.x < 0) p.x = this.width;

            if (this.mode === 'rain') {
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.x - p.speedX * p.length / 5, p.y - p.speedY * p.length / 5);
                this.ctx.strokeStyle = `rgba(${Math.round(renderColor.r)}, ${Math.round(renderColor.g)}, ${Math.round(renderColor.b)}, ${renderOpacity})`;
                this.ctx.lineWidth = p.size;
                this.ctx.stroke();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

                // Render with calculated color and opacity
                this.ctx.fillStyle = `rgba(${Math.round(renderColor.r)}, ${Math.round(renderColor.g)}, ${Math.round(renderColor.b)}, ${renderOpacity})`;

                // Add glow for fireflies and embers
                if (this.mode === 'embers' || this.mode === 'fireflies') {
                     this.ctx.shadowBlur = p.size * 2;
                     this.ctx.shadowColor = `rgba(${Math.round(renderColor.r)}, ${Math.round(renderColor.g)}, ${Math.round(renderColor.b)}, 0.8)`;
                } else {
                     this.ctx.shadowBlur = 0;
                }

                this.ctx.fill();
            }
        }

        requestAnimationFrame(() => this.update());
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.update();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new ParticleSystem('atmosphere');
});
