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

    let selectedMarkerElement = null;
    const initialView = { lat: 27.3314, lng: 88.6138, zoom: 13 };

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

        // Cinematic entry fly-to
        setTimeout(() => {
            map.flyTo([initialView.lat, initialView.lng], 14, {
                animate: true,
                duration: 2.0,
                easeLinearity: 0.2
            });
        }, 200);
    });

    // Close Panel Logic
    const closeInfoPanel = () => {
        infoPanel.classList.remove('visible');
        if (selectedMarkerElement) {
            selectedMarkerElement.classList.remove('selected');
            selectedMarkerElement = null;
        }
        // Fade out image
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
    resetViewBtn.addEventListener('click', () => {
        map.flyTo([initialView.lat, initialView.lng], initialView.zoom, {
            animate: true,
            duration: 1.5
        });
        closeInfoPanel();
    });

    // Mobile Bottom Sheet "Swipe" Mock Logic
    // For a true swipe, we'd need touch start/move/end listeners calculating deltaY.
    // For this prototype, we'll keep it simple: clicking the handle closes it.
    const mobileHandle = document.querySelector('.panel-handle-mobile');
    mobileHandle.addEventListener('click', closeInfoPanel);


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

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);

            if (selectedMarkerElement) {
                selectedMarkerElement.classList.remove('selected');
            }

            const element = e.target.getElement().querySelector('.custom-marker-container');
            if (element) {
                element.classList.add('selected');
                selectedMarkerElement = element;
            }

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

            // Fly to location
            // Responsive Offset Logic
            let targetLat = location.coords[0];
            let targetLng = location.coords[1];

            // If mobile, we might want to center slightly north so the pin is visible above the sheet
            if (window.innerWidth <= 768) {
                // Approximate offset calculation (roughly 0.002 degrees for zoom 15)
                // This keeps the pin visible in the top half of the screen
                // targetLat -= 0.002; // Actually we want the map center to be South of the pin, so pin moves North.
                // Wait, if panel is at bottom, we want pin to be in top area. So map center should be south of pin.
                // So targetLat (center) should be < pinLat.
                // targetLat -= 0.002;
                // But map.flyTo takes the CENTER.
                // So we want to set the center such that the Pin is at (50%, 30%) of screen.
            } else {
                // Desktop: Panel is on left. Map center should be slightly Right.
                // targetLng -= 0.002;
            }

            map.flyTo([targetLat, targetLng], 15, {
                animate: true,
                duration: 1.2,
                easeLinearity: 0.25
            });
        });
    });
});
