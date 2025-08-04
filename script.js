const locations = [
    {
        name: "MG Marg",
        description: "The vibrant, pedestrian-only heart of Gangtok, lined with shops and restaurants.",
        coords: [27.3314, 88.6138]
    },
    {
        name: "Rumtek Monastery",
        description: "A stunning Tibetan Buddhist monastery, a center of spiritual life and learning.",
        coords: [27.2895, 88.5785]
    },
    {
        name: "Tsomgo Lake",
        description: "A breathtaking glacial lake nestled amidst snow-capped mountains.",
        coords: [27.3747, 88.7629]
    },
    {
        name: "Nathu La Pass",
        description: "A high-altitude mountain pass on the historic Silk Road, offering dramatic Himalayan vistas.",
        coords: [27.3861, 88.8306]
    },
    {
        name: "Ganesh Tok",
        description: "A peaceful temple dedicated to Lord Ganesha, with panoramic views of the entire city.",
        coords: [27.3491, 88.6221]
    }
];

const mapElement = document.getElementById('map');
mapElement.classList.add('visible');

const map = L.map('map', {
    zoomControl: false // We will have a clean interface
}).setView([27.3314, 88.6138], 13);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

const infoPanel = document.getElementById('info-panel');
const infoName = document.getElementById('info-name');
const infoDescription = document.getElementById('info-description');
const closePanel = document.getElementById('close-panel');

locations.forEach(location => {
    const customMarker = L.divIcon({
        className: 'custom-marker',
        html: '<div class="marker-pulse"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const marker = L.marker(location.coords, { icon: customMarker }).addTo(map);

    marker.on('click', () => {
        infoName.textContent = location.name;
        infoDescription.textContent = location.description;
        infoPanel.classList.add('visible');
        map.flyTo(location.coords, 15);
    });
});

closePanel.addEventListener('click', () => {
    infoPanel.classList.remove('visible');
});

map.on('click', () => {
    if (infoPanel.classList.contains('visible')) {
        infoPanel.classList.remove('visible');
    }
});
