document.addEventListener('DOMContentLoaded', () => {
    const locations = [
        {
            name: "MG Marg",
            description: "The vibrant, pedestrian-only heart of Gangtok, lined with shops and restaurants.",
            coords: [27.3314, 88.6138],
            image: "https://upload.wikimedia.org/wikipedia/commons/9/97/M.G._Marg%2C_Gangtok_01.jpg",
            url: "https://en.wikipedia.org/wiki/Mahatma_Gandhi_Marg_(Gangtok)"
        },
        {
            name: "Rumtek Monastery",
            description: "A stunning Tibetan Buddhist monastery, a center of spiritual life and learning.",
            coords: [27.2895, 88.5785],
            image: "https://upload.wikimedia.org/wikipedia/commons/7/75/Rumtek_Monastery_NEW.jpg",
            url: "https://en.wikipedia.org/wiki/Rumtek_Monastery"
        },
        {
            name: "Tsomgo Lake",
            description: "A breathtaking glacial lake nestled amidst snow-capped mountains.",
            coords: [27.3747, 88.7629],
            image: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Tsongmo_Lake_or_Changu_Lake_-_East_Sikkim.jpg",
            url: "https://en.wikipedia.org/wiki/Lake_Tsomgo"
        },
        {
            name: "Nathu La Pass",
            description: "A high-altitude mountain pass on the historic Silk Road, offering dramatic Himalayan vistas.",
            coords: [27.3861, 88.8306],
            image: "https://upload.wikimedia.org/wikipedia/commons/6/65/Nathu_La%2C_a_mountain_pass_in_the_Himalayas_on_the_Indo-China_Border.jpg",
            url: "https://en.wikipedia.org/wiki/Nathu_La"
        },
        {
            name: "Ganesh Tok",
            description: "A peaceful temple dedicated to Lord Ganesha, with panoramic views of the entire city.",
            coords: [27.3491, 88.6221],
            image: "https://upload.wikimedia.org/wikipedia/commons/1/11/Ganesh_Tok.jpg",
            url: "https://en.wikipedia.org/wiki/Ganesh_Tok"
        }
    ];

    const map = L.map('map', {
        zoomControl: false // We will have a clean interface
    }).setView([27.3314, 88.6138], 12);

    setTimeout(() => {
        map.flyTo([27.3314, 88.6138], 13, {
            animate: true,
            duration: 2
        });
    }, 500);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    const infoPanel = document.getElementById('info-panel');
    const infoName = document.getElementById('info-name');
    const infoDescription = document.getElementById('info-description');
    const infoImage = document.getElementById('info-image');
    const infoLink = document.getElementById('info-link');
    const closePanel = document.getElementById('close-panel');
    let selectedMarker = null;

    locations.forEach(location => {
        const customMarker = L.divIcon({
            className: 'custom-marker',
            html: '<div class="marker-pulse"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker(location.coords, { icon: customMarker }).addTo(map);

        marker.bindTooltip(location.name);

        marker.on('click', (e) => {
            if (selectedMarker) {
                selectedMarker.getElement().classList.remove('selected');
            }

            e.target.getElement().classList.add('selected');
            selectedMarker = e.target;

            infoImage.src = location.image;
            infoName.textContent = location.name;
            infoDescription.textContent = location.description;
            infoLink.href = location.url;

            infoPanel.classList.add('visible');
            map.flyTo(location.coords, 15);
        });
    });

    const closeInfoPanel = () => {
        infoPanel.classList.remove('visible');
        if (selectedMarker) {
            selectedMarker.getElement().classList.remove('selected');
            selectedMarker = null;
        }
    };

    closePanel.addEventListener('click', closeInfoPanel);

    map.on('click', (e) => {
        // A simple check to not close when clicking on a marker
        if (e.originalEvent.target.classList.contains('custom-marker') || e.originalEvent.target.classList.contains('marker-pulse')) {
            return;
        }

        if (infoPanel.classList.contains('visible')) {
            closeInfoPanel();
        }
    });
});
