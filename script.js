document.addEventListener('DOMContentLoaded', () => {
    // Data
    const locations = [
        {
            name: "MG Marg",
            description: "The vibrant, pedestrian-only heart of Gangtok. Lined with shops, cafes, and Victorian lamps, it's a pristine, litter-free zone perfect for evening strolls.",
            coords: [27.3314, 88.6138],
            image: "https://upload.wikimedia.org/wikipedia/commons/9/97/M.G._Marg%2C_Gangtok_01.jpg",
            url: "https://en.wikipedia.org/wiki/Mahatma_Gandhi_Marg_(Gangtok)"
        },
        {
            name: "Rumtek Monastery",
            description: "A stunning Tibetan Buddhist monastery and a center of spiritual learning. It houses some of the world's most unique religious art objects and golden stupas.",
            coords: [27.2895, 88.5785],
            image: "https://upload.wikimedia.org/wikipedia/commons/7/75/Rumtek_Monastery_NEW.jpg",
            url: "https://en.wikipedia.org/wiki/Rumtek_Monastery"
        },
        {
            name: "Tsomgo Lake",
            description: "A breathtaking glacial lake nestled at 12,313 ft. The lake changes color with the seasons, freezes in winter, and is revered as a sacred site by locals.",
            coords: [27.3747, 88.7629],
            image: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Tsongmo_Lake_or_Changu_Lake_-_East_Sikkim.jpg",
            url: "https://en.wikipedia.org/wiki/Lake_Tsomgo"
        },
        {
            name: "Nathu La Pass",
            description: "A high-altitude mountain pass on the historic Silk Road. It connects Sikkim with Tibet and offers dramatic, snowy Himalayan vistas that leave you speechless.",
            coords: [27.3861, 88.8306],
            image: "https://upload.wikimedia.org/wikipedia/commons/6/65/Nathu_La%2C_a_mountain_pass_in_the_Himalayas_on_the_Indo-China_Border.jpg",
            url: "https://en.wikipedia.org/wiki/Nathu_La"
        },
        {
            name: "Ganesh Tok",
            description: "A small, colorful temple dedicated to Lord Ganesha. Perched on a hill, it offers one of the best panoramic views of Gangtok city and the Kanchenjunga range.",
            coords: [27.3491, 88.6221],
            image: "https://upload.wikimedia.org/wikipedia/commons/1/11/Ganesh_Tok.jpg",
            url: "https://en.wikipedia.org/wiki/Ganesh_Tok"
        },
        {
            name: "Ban Jhakri Falls",
            description: "A landscaped energy park featuring a 100-foot waterfall, shamanistic statues, and beautiful gardens highlighting the Ban Jhakri tradition.",
            coords: [27.3508, 88.6036],
            image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/A_scenic_view_of_Ban_Jhakri_Falls_Gangtok_Sikkim_India_2015.jpg",
            url: "https://en.wikipedia.org/wiki/Banjhakri_Falls_and_Energy_Park"
        },
        {
            name: "Tashi View Point",
            description: "Famous for its sunrise views, offering a spectacular panorama of Mount Kanchenjunga and the Siniolchu peaks on a clear day.",
            coords: [27.3685, 88.6128],
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a7/Tashi_view_point%2C_Gangtok.jpg",
            url: "https://en.wikipedia.org/wiki/Gangtok#Tourism"
        },
        {
            name: "Enchey Monastery",
            description: "A 200-year-old monastery belonging to the Nyingma order, built on a site believed to be blessed by Lama Drupthob Karpo.",
            coords: [27.3448, 88.6206],
            image: "https://upload.wikimedia.org/wikipedia/commons/d/db/Enchey_Monastery_-_Gangtok_-_Sikkim_-_India.jpg",
            url: "https://en.wikipedia.org/wiki/Enchey_Monastery"
        },
        {
            name: "Do Drul Chorten",
            description: "A massive stupa surrounded by 108 prayer wheels. It is one of the most important and significant stupas in Sikkim.",
            coords: [27.3163, 88.6046],
            image: "https://upload.wikimedia.org/wikipedia/commons/8/87/Do-Drul_Chorten_Stupa.jpg",
            url: "https://en.wikipedia.org/wiki/Dro-dul_Chorten"
        },
        {
            name: "Namgyal Institute of Tibetology",
            description: "A museum and research centre dedicated to the religion, history, language, art and culture of the people of the Tibetan cultural area.",
            coords: [27.3155, 88.6045],
            image: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Namgyal_Institute_of_Tibetology.jpg",
            url: "https://en.wikipedia.org/wiki/Namgyal_Institute_of_Tibetology"
        },
        {
            name: "Hanuman Tok",
            description: "A temple complex dedicated to Lord Hanuman, maintained by the Indian Army, offering bird's-eye views of Gangtok and the surrounding hills.",
            coords: [27.3562, 88.6318],
            image: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Hanuman_Tok.jpg",
            url: "https://en.wikipedia.org/wiki/Hanuman_Tok"
        }
    ];

    // UI Elements
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const exploreBtn = document.getElementById('explore-btn');
    const infoPanel = document.getElementById('info-panel');
    const infoName = document.getElementById('info-name');
    const infoDescription = document.getElementById('info-description');
    const infoImage = document.getElementById('info-image');
    const infoLink = document.getElementById('info-link');
    const closePanel = document.getElementById('close-panel');

    // Controls
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const resetViewBtn = document.getElementById('reset-view');
    const exploreRandomBtn = document.getElementById('explore');

    let selectedMarker = null; // Leaflet Marker object
    let selectedMarkerElement = null; // DOM Element
    const initialView = { lat: 27.3314, lng: 88.6138, zoom: 13 };
    const locationMarkers = [];

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
    exploreBtn.addEventListener('click', () => {
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => {
            map.flyTo([initialView.lat, initialView.lng], 14, {
                animate: true,
                duration: 2.5,
                easeLinearity: 0.25
            });
        }, 300);
    });

    // Close Panel Logic
    const closeInfoPanel = () => {
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
    };

    closePanel.addEventListener('click', closeInfoPanel);

    map.on('click', (e) => {
        // Close if clicking on the map (background)
        if (!e.originalEvent.target.closest('.custom-marker-container')) {
            closeInfoPanel();
        }
    });

    // Control Dock Logic
    zoomInBtn.addEventListener('click', () => map.setZoom(map.getZoom() + 1));
    zoomOutBtn.addEventListener('click', () => map.setZoom(map.getZoom() - 1));
    resetViewBtn.addEventListener('click', closeInfoPanel);

    exploreRandomBtn.addEventListener('click', () => {
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

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);

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

            // Image Loading Logic
            infoImage.classList.remove('loaded');
            infoImage.src = location.image;
            infoImage.onload = () => {
                infoImage.classList.add('loaded');
            };

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
