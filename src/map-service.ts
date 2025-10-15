import { RestaurantWithDistance } from './types.js';

declare global {
  interface Window {
    L: any;
  }
}

/**
 * Map service for handling restaurant locations and interactive map
 */
export class MapService {
  private map: any = null;
  private markersGroup: any = null;
  private currentPopup: any = null;

  /**
   * Initialize the map in the specified container
   */
  initializeMap(containerId: string): void {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Map container '${containerId}' not found`);
        return;
      }

      // Check if Leaflet is loaded
      if (typeof window.L === 'undefined') {
        console.error('Leaflet library not loaded');
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">Kartta ei ole käytettävissä. Leaflet-kirjasto ei ole ladattu.</p>';
        return;
      }

      // Clear any existing map instance
      if (this.map) {
        try {
          this.map.remove();
        } catch (e) {
          console.warn('Error removing existing map:', e);
        }
        this.map = null;
      }

      console.log('Initializing map...');

      // Initialize map centered on Finland with better view
      this.map = window.L.map(containerId, {
        center: [60.1699, 24.9384],
        zoom: 8,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true
      });

      // Add MapBox or OpenStreetMap tiles with better styling
      const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        tileSize: 256
      });

      tileLayer.addTo(this.map);

      // Create a layer group for restaurant markers
      this.markersGroup = window.L.layerGroup().addTo(this.map);

      // Add custom controls
      this.addCustomControls();

      // Wait for map to be fully loaded
      this.map.whenReady(() => {
        console.log('✅ Map initialized and ready');
        // Trigger resize to ensure proper display
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 100);
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">❌ Kartan lataus epäonnistui. Yritä päivittää sivu.</p>';
      }
    }
  }

  /**
   * Add custom controls to the map
   */
  private addCustomControls(): void {
    if (!this.map) return;

    // Add location control
    const locationControl = window.L.control({ position: 'topright' });
    locationControl.onAdd = () => {
      const div = window.L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `
        <a href="#" class="leaflet-control-locate" title="Näytä sijaintini">
          <span>📍</span>
        </a>
      `;
      
      div.onclick = (e: Event) => {
        e.preventDefault();
        this.locateUser();
      };
      
      return div;
    };
    locationControl.addTo(this.map);
  }

  /**
   * Locate user and center map
   */
  private locateUser(): void {
    if (!this.map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          this.map.setView([lat, lng], 13);
          
          // Add user location marker
          const userIcon = window.L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-location-icon">👤</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          window.L.marker([lat, lng], { icon: userIcon })
            .addTo(this.map)
            .bindPopup('Sinun sijaintisi')
            .openPopup();
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Sijaintia ei voitu määrittää');
        }
      );
    } else {
      alert('Selain ei tue sijaintimääritystä');
    }
  }

  /**
   * Create custom restaurant marker icon
   */
  private createRestaurantIcon(restaurant: RestaurantWithDistance): any {
    const isClosest = restaurant.isClosest;
    const iconClass = isClosest ? 'restaurant-marker closest' : 'restaurant-marker';
    
    return window.L.divIcon({
      className: iconClass,
      html: `
        <div class="restaurant-icon">
          <span class="restaurant-emoji">🍽️</span>
          ${isClosest ? '<div class="closest-badge">⭐</div>' : ''}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  /**
   * Get appropriate image for restaurant based on type, name, and company
   */
  private getRestaurantImage(restaurant: RestaurantWithDistance): string {
    const name = restaurant.name.toLowerCase();
    const company = restaurant.company?.toLowerCase() || '';
    
    // Choose image based on restaurant name, type, or company
    if (name.includes('pizza') || name.includes('karamalmi') || name.includes('italiana')) {
      return './img/pizza.png';
    } else if (name.includes('salad') || name.includes('salaatti') || name.includes('green') || name.includes('vege') || name.includes('kasvis')) {
      return './img/salati11.png';
    } else if (name.includes('metropolia') || company.includes('metropolia')) {
      return './img/OIP.jpg';
    } else if (name.includes('aalto') || company.includes('aalto')) {
      return './img/OIP22.jpg';
    } else if (name.includes('university') || name.includes('yliopisto') || company.includes('university')) {
      return './img/your_image.jpeg';
    } else if (name.includes('cafe') || name.includes('kahvila') || name.includes('coffee') || name.includes('baari')) {
      return './img/your-illustration.png';
    } else if (name.includes('lunch') || name.includes('lounas') || name.includes('buffet') || name.includes('ruokala')) {
      return './img/9-6.jpg';
    } else if (company.includes('sodexo') || company.includes('compass') || company.includes('fazer')) {
      return './img/your_image.jpeg';
    } else {
      // Rotate through different default images for variety based on restaurant ID
      const restaurantId = restaurant._id || '';
      const imageIndex = parseInt(restaurantId.slice(-1)) || 0;
      const defaultImages = ['./img/9-6.jpg', './img/your_image.jpeg', './img/OIP.jpg', './img/your-illustration.png'];
      return defaultImages[imageIndex % defaultImages.length] || './img/9-6.jpg';
    }
  }

  /**
   * Create enhanced popup content
   */
  private createPopupContent(restaurant: RestaurantWithDistance): string {
    const distance = restaurant.distance ? `${restaurant.distance.toFixed(1)} km` : '';
    const isClosest = restaurant.isClosest;
    const restaurantImage = this.getRestaurantImage(restaurant);
    
    return `
      <div class="restaurant-popup">
        <div class="popup-header">
          <h3 class="popup-title">${restaurant.name}</h3>
          ${isClosest ? '<span class="closest-tag">Lähin</span>' : ''}
        </div>
        
        <div class="popup-content">
          <div class="popup-info">
            <p><strong>📍</strong> ${restaurant.address}</p>
            <p><strong>🏢</strong> ${restaurant.company}</p>
            ${distance ? `<p><strong>📏</strong> ${distance}</p>` : ''}
            <p><strong>📞</strong> ${restaurant.phone}</p>
          </div>
          
          <div class="popup-image">
            <img src="${restaurantImage}" 
                 alt="${restaurant.name}" 
                 class="restaurant-image"
                 onerror="this.onerror=null; this.src='./img/logo.png';" />
          </div>
        </div>
        
        <div class="popup-actions">
          <button class="popup-btn primary" onclick="viewTodaysMenu('${restaurant._id}')">
            View today's menu
          </button>
          <button class="popup-btn secondary" onclick="viewWeeksMenu('${restaurant._id}')">
            View this week's menu
          </button>
          <button class="popup-btn outline" onclick="addAsFavorite('${restaurant._id}')">
            Add as favourite
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Update map markers with restaurant data
   */
  updateMarkers(restaurants: RestaurantWithDistance[], onRestaurantClick: (restaurant: RestaurantWithDistance) => void): void {
    if (!this.map || !this.markersGroup) {
      console.warn('Map not initialized, skipping marker update');
      return;
    }

    try {
      // Clear existing markers
      this.markersGroup.clearLayers();

      if (restaurants.length === 0) {
        console.log('No restaurants to display on map');
        return;
      }

      // Add markers for each restaurant
      restaurants.forEach(restaurant => {
        try {
          const coords = restaurant.location.coordinates;
          const lat = coords[1]; // latitude
          const lng = coords[0]; // longitude

          // Validate coordinates
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            console.warn(`Invalid coordinates for restaurant ${restaurant.name}:`, coords);
            return;
          }

          // Create custom icon
          const customIcon = this.createRestaurantIcon(restaurant);
          const marker = window.L.marker([lat, lng], { icon: customIcon });

          // Create enhanced popup
          const popupContent = this.createPopupContent(restaurant);
          
          // Bind popup with custom options
          marker.bindPopup(popupContent, {
            maxWidth: 350,
            className: 'custom-popup'
          });

          // Add click event
          marker.on('click', () => {
            onRestaurantClick(restaurant);
          });

          // Add to markers group
          this.markersGroup.addLayer(marker);
        } catch (error) {
          console.error(`Error adding marker for restaurant ${restaurant.name}:`, error);
        }
      });

      // Fit map to show all markers
      if (restaurants.length > 0) {
        try {
          const group = new window.L.featureGroup(this.markersGroup.getLayers());
          if (group.getLayers().length > 0) {
            this.map.fitBounds(group.getBounds().pad(0.1));
          }
        } catch (error) {
          console.warn('Error fitting map bounds:', error);
        }
      }

      console.log(`Successfully updated ${restaurants.length} markers on map`);

    } catch (error) {
      console.error('Error updating markers:', error);
    }
  }

  /**
   * Center map on specific coordinates
   */
  centerOnLocation(latitude: number, longitude: number, zoom: number = 15): void {
    if (this.map) {
      this.map.setView([latitude, longitude], zoom);
    }
  }

  /**
   * Add user location marker
   */
  addUserLocationMarker(latitude: number, longitude: number): void {
    if (!this.map) return;

    try {
      const userIcon = window.L.divIcon({
        html: '<div style="background-color: #4CAF50; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        className: 'user-location-marker'
      });

      window.L.marker([latitude, longitude], { icon: userIcon })
        .addTo(this.map)
        .bindPopup('<div class="user-popup"><strong>Sinun sijaintisi</strong></div>');

    } catch (error) {
      console.error('Error adding user location marker:', error);
    }
  }

  /**
   * Get map instance (for advanced usage)
   */
  getMap(): any {
    return this.map;
  }
}