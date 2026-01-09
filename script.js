document.addEventListener('DOMContentLoaded', () => {
    // Data
    const locations = [
        {
            name: "MG Marg",
            description: "The vibrant, pedestrian-only heart of Gangtok, lined with shops and restaurants. A clean, litter-free zone with benches and Victorian lamps.",
            coords: [27.3314, 88.6138],
            image: "https://upload.wikimedia.org/wikipedia/commons/9/97/M.G._Marg%2C_Gangtok_01.jpg",
            url: "https://en.wikipedia.org/wiki/Mahatma_Gandhi_Marg_(Gangtok)"
        },
        {
            name: "Rumtek Monastery",
            description: "A stunning Tibetan Buddhist monastery, a center of spiritual life and learning. It houses some of the world's most unique religious art objects.",
            coords: [27.2895, 88.5785],
            image: "https://upload.wikimedia.org/wikipedia/commons/7/75/Rumtek_Monastery_NEW.jpg",
            url: "https://en.wikipedia.org/wiki/Rumtek_Monastery"
        },
        {
            name: "Tsomgo Lake",
            description: "A breathtaking glacial lake nestled amidst snow-capped mountains at 12,313 ft. The lake changes color with the seasons and is held sacred.",
            coords: [27.3747, 88.7629],
            image: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Tsongmo_Lake_or_Changu_Lake_-_East_Sikkim.jpg",
            url: "https://en.wikipedia.org/wiki/Lake_Tsomgo"
        },
        {
            name: "Nathu La Pass",
            description: "A high-altitude mountain pass on the historic Silk Road, offering dramatic Himalayan vistas. It connects Sikkim with China's Tibet Autonomous Region.",
            coords: [27.3861, 88.8306],
            image: "https://upload.wikimedia.org/wikipedia/commons/6/65/Nathu_La%2C_a_mountain_pass_in_the_Himalayas_on_the_Indo-China_Border.jpg",
            url: "https://en.wikipedia.org/wiki/Nathu_La"
        },
        {
            name: "Ganesh Tok",
            description: "A peaceful temple dedicated to Lord Ganesha, perched on a hill with panoramic views of the entire city and the Kanchenjunga range.",
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

    let selectedMarkerElement = null;

    // Initialize Map
    const map = L.map('map', {
        zoomControl: false,
        attributionControl: true
    }).setView([27.3314, 88.6138], 13);

    // Custom Dark Theme Map Tiles
    // Using a high-quality dark matter style that fits our theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Initial State
    // Disable map interaction until welcome is dismissed? Optional, but keeping it interactive is nice.

    // Welcome Screen Interaction
    exploreBtn.addEventListener('click', () => {
        welcomeOverlay.classList.add('hidden');

        // Initial fly-to animation
        setTimeout(() => {
            map.flyTo([27.3314, 88.6138], 14, {
                animate: true,
                duration: 2.5,
                easeLinearity: 0.25
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
    };

    closePanel.addEventListener('click', closeInfoPanel);

    map.on('click', (e) => {
        // Close if clicking on the map (background)
        if (!e.originalEvent.target.closest('.custom-marker-container')) {
            closeInfoPanel();
        }
    });

    // Create Markers
    locations.forEach(location => {
        const customIcon = L.divIcon({
            className: 'custom-div-icon', // Wrapper class, leaflet requires one
            html: `
                <div class="custom-marker-container">
                    <div class="pin-head"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40] // Tip of the pin
        });

        const marker = L.marker(location.coords, { icon: customIcon }).addTo(map);

        // Marker Click
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e); // Prevent map click

            // Deselect previous
            if (selectedMarkerElement) {
                selectedMarkerElement.classList.remove('selected');
            }

            // Select new
            // We need to find the specific DOM element for this marker's icon
            const element = e.target.getElement().querySelector('.custom-marker-container');
            if (element) {
                element.classList.add('selected');
                selectedMarkerElement = element;
            }

            // Update Info
            infoImage.src = location.image;
            infoName.textContent = location.name;
            infoDescription.textContent = location.description;
            infoLink.href = location.url;

            // Show Panel
            infoPanel.classList.add('visible');

            // Fly to location with offset (to not hide it behind panel on mobile/desktop)
            // We can calculate offset if we want "ultrathink" precision, but centering is okay for now.
            // On mobile, the panel covers the bottom, so maybe fly slightly North.

            let targetLat = location.coords[0];
            let targetLng = location.coords[1];

            // Simple offset adjustment based on screen width could go here
            // but map.flyTo is usually good enough.
            // Let's just fly to center.

            map.flyTo([targetLat, targetLng], 15, {
                animate: true,
                duration: 1.5,
                easeLinearity: 0.25
            });
        });

        // Hover effects are handled by CSS on .custom-marker-container
    });
});
