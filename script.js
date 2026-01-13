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
        setTimeout(() => {
            map.flyTo([initialView.lat, initialView.lng], 14, {
                animate: true,
                duration: 2.5,
                easeLinearity: 0.1
            });
        }, 300);
    });

    // Close Panel Logic
    const closeInfoPanel = () => {
        infoPanel.classList.remove('visible');
        if (selectedMarkerElement) {
            selectedMarkerElement.classList.remove('selected');
            selectedMarkerElement = null;
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
    resetViewBtn.addEventListener('click', () => {
        map.flyTo([initialView.lat, initialView.lng], initialView.zoom, {
            animate: true,
            duration: 1.5,
            easeLinearity: 0.2
        });
        closeInfoPanel();
    });

    // --- Mobile Bottom Sheet Swipe Logic ---
    const mobileHandle = document.querySelector('.panel-handle-mobile');
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    // Use passive listeners for better scroll performance
    mobileHandle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        currentY = startY; // Initialize currentY to prevent stale values on tap
        isDragging = true;
        infoPanel.style.transition = 'none'; // Disable transition for direct tracking
    }, { passive: true });

    mobileHandle.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Only allow dragging down
        if (deltaY > 0) {
            infoPanel.style.transform = `translateY(${deltaY}px)`;
        }
    }, { passive: true });

    mobileHandle.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        infoPanel.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Re-enable physics

        const deltaY = currentY - startY;
        // If dragged down more than 100px, close it
        if (deltaY > 100) {
            closeInfoPanel();
            // Reset transform after animation (handled by class removal mostly, but good to be clean)
            setTimeout(() => {
                infoPanel.style.transform = '';
            }, 500);
        } else {
            // Snap back
            infoPanel.style.transform = ''; // Removes inline style, reverting to CSS class state (0px)
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
            iconAnchor: [20, 40] // Centered horizontally, bottom vertically
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
            // Ensure no inline transform style interferes
            infoPanel.style.transform = '';

            // Fly to location with Offset Logic
            let targetLat = location.coords[0];
            let targetLng = location.coords[1];

            if (window.innerWidth <= 768) {
                // Mobile: Panel at bottom. Center map such that pin is in the top 25% of screen.
                // We need to shift the center SOUTH so the pin appears NORTH.
                // At zoom 15, ~0.005 degrees is a reasonable vertical shift.
                targetLat -= 0.005;
            } else {
                // Desktop: Panel at left. Center map such that pin is in right 60% of screen.
                // Shift center LEFT so pin appears RIGHT.
                targetLng -= 0.005;
            }

            map.flyTo([targetLat, targetLng], 15, {
                animate: true,
                duration: 1.5,
                easeLinearity: 0.2
            });
        });
    });
});
