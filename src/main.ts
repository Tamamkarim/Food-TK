import { RestaurantApiService } from './api-service.js';
import { UserService } from './user-service.js';
import { MapService } from './map-service.js';
import { MenuService } from './menu-service.js';
import { 
  Restaurant, 
  RestaurantWithDistance, 
  RestaurantFilter, 
  ViewMode, 
  UserLocation 
} from './types.js';

// Force browser cache refresh - Debug timestamp
console.log('🚀 UPDATED MAIN.JS LOADED - CACHE REFRESH SUCCESS - ' + new Date().toISOString());

/**
 * Main application class that orchestrates all services and UI interactions
 */
export class RestaurantApp {
  private apiService: RestaurantApiService;
  private userService: UserService;
  private mapService: MapService;
  private menuService: MenuService;
  
  private restaurants: RestaurantWithDistance[] = [];
  private filteredRestaurants: RestaurantWithDistance[] = [];
  private currentViewMode: ViewMode = ViewMode.Daily;
  private userLocation: UserLocation | null = null;
  private selectedRestaurant: Restaurant | null = null;

  constructor() {
    this.apiService = new RestaurantApiService();
    this.userService = new UserService();
    this.mapService = new MapService();
    this.menuService = new MenuService();
    
    this.initializeApp();
  }

  /**
   * Initialize the application
   */
  private async initializeApp(): Promise<void> {
    try {
      this.initializeTheme();
      this.setupNetworkMonitoring();
      await this.loadRestaurants();
      this.setupEventListeners();
      this.initializeMap();
      this.updateUI();
      this.updateAuthUI();
    } catch (error) {
      console.error('App initialization error:', error);
      this.showNotification('Sovelluksen lataus epäonnistui', 'error');
    }
  }

  /**
   * Setup network connectivity monitoring
   */
  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      this.showNotification('Verkkoyhteys palautettu', 'success');
      // Optionally reload data when coming back online
      this.loadRestaurants();
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network connection lost');
      this.showNotification('Verkkoyhteys katkennut - käytetään tallennettuja tietoja', 'warning');
    });
  }

  /**
   * Initialize theme system
   */
  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('preferred-theme') || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme === 'auto' ? (prefersDark ? 'dark' : 'light') : savedTheme;
    
    // Ensure type safety
    const theme = (initialTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    this.setTheme(theme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem('preferred-theme') === 'auto') {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Set application theme
   */
  private setTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    
    // Update theme toggle button aria-label
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', 
        theme === 'dark' ? 'Vaihda vaaleaan teemaan' : 'Vaihda tummaan teemaan'
      );
    }
  }

  /**
   * Toggle theme between light and dark
   */
  private toggleTheme(): void {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    this.setTheme(newTheme);
    localStorage.setItem('preferred-theme', newTheme);
    
    this.showNotification(
      `Vaihdettu ${newTheme === 'dark' ? 'tummaan' : 'vaaleaan'} teemaan`, 
      'success'
    );
  }

  /**
   * Load restaurants from API
   */
  private async loadRestaurants(): Promise<void> {
    try {
      this.showLoading('loading-restaurants', true);
      console.log('🏪 Loading restaurants...');
      
      // Check network connectivity
      if (!navigator.onLine) {
        console.warn('🌐 No internet connection detected');
        this.showNotification('Ei internetyhteyttä - käytetään tallennettuja tietoja', 'warning');
      }
      
      const restaurants = await this.apiService.getRestaurants();
      console.log('📋 Restaurants loaded:', restaurants.length);
      
      if (restaurants.length === 0) {
        console.warn('⚠️ No restaurants found');
        this.showNotification('Ei ravintoloita saatavilla', 'warning');
        return;
      }
      
      // Notify if using mock data (when API is unavailable)
      const isUsingMockData = this.checkIfUsingMockData(restaurants);
      if (isUsingMockData) {
        this.showNotification('API ei saatavilla - käytetään näytetietoja', 'info');
      }
      
      // If user location is available, calculate distances
      if (this.userLocation) {
        console.log('📍 Calculating distances from user location');
        this.restaurants = this.apiService.calculateDistanceToRestaurants(restaurants, this.userLocation);
      } else {
        this.restaurants = restaurants.map(r => ({ ...r }));
      }
      
      this.filteredRestaurants = [...this.restaurants];
      console.log('✅ Restaurants ready for display:', this.filteredRestaurants.length);
      this.populateFilterOptions();
      this.renderRestaurants();
      
      // Update map markers with a slight delay to ensure map is ready
      setTimeout(() => {
        this.updateMapMarkers();
      }, 300);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading restaurants:', errorMessage);
      this.showNotification('Ravintoloiden lataus epäonnistui. Käytetään varadataa.', 'warning');
      
      // Try to use fallback data
      try {
        const fallbackRestaurants = await this.apiService.getRestaurants();
        if (fallbackRestaurants.length > 0) {
          this.restaurants = fallbackRestaurants.map(r => ({ ...r }));
          this.filteredRestaurants = [...this.restaurants];
          this.populateFilterOptions();
          this.renderRestaurants();
          this.updateMapMarkers();
          console.log('🔄 Fallback data loaded successfully');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback data also failed:', fallbackError);
        this.showNotification('Ei voida ladata ravintoladata', 'error');
      }
    } finally {
      this.showLoading('loading-restaurants', false);
    }
  }

  /**
   * Check if restaurants data is from mock/fallback source
   */
  private checkIfUsingMockData(restaurants: any[]): boolean {
    // Simple heuristic: check if we have the known mock restaurant IDs
    const mockIds = ['1', '2', '3'];
    return restaurants.length > 0 && restaurants.some(r => mockIds.includes(r._id));
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Authentication
    this.setupAuthEventListeners();
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle?.addEventListener('click', () => this.toggleTheme());
    
    // View mode toggle
    const dailyBtn = document.getElementById('daily-view-btn');
    const weeklyBtn = document.getElementById('weekly-view-btn');
    
    dailyBtn?.addEventListener('click', () => this.setViewMode(ViewMode.Daily));
    weeklyBtn?.addEventListener('click', () => this.setViewMode(ViewMode.Weekly));

    // Search functionality
    const searchInput = document.getElementById('search-restaurants') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.filterRestaurants({ searchTerm: target.value });
    });

    // Location button
    const locationBtn = document.getElementById('location-btn');
    locationBtn?.addEventListener('click', () => this.getUserLocation());

    // Menu modal controls
    const menuModal = document.getElementById('menu-modal') as HTMLDialogElement;
    const closeMenuBtn = document.getElementById('close-menu-modal');
    closeMenuBtn?.addEventListener('click', () => menuModal?.close());

    // Click outside modal to close
    menuModal?.addEventListener('click', (e) => {
      if (e.target === menuModal) {
        menuModal.close();
      }
    });

    // Navigation
    this.setupNavigation();
  }

  /**
   * Setup authentication event listeners
   */
  private setupAuthEventListeners(): void {
    // Login
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal') as HTMLDialogElement;
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const closeLoginBtn = document.getElementById('close-login-modal');
    const cancelLoginBtn = document.getElementById('cancel-login');

    loginBtn?.addEventListener('click', () => loginModal?.showModal());
    closeLoginBtn?.addEventListener('click', () => loginModal?.close());
    cancelLoginBtn?.addEventListener('click', () => loginModal?.close());
    
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin(loginForm);
      loginModal?.close();
    });

    // Registration
    const registerBtn = document.getElementById('register-btn');
    const registerModal = document.getElementById('register-modal') as HTMLDialogElement;
    const registerForm = document.getElementById('register-form') as HTMLFormElement;
    const closeRegisterBtn = document.getElementById('close-register-modal');
    const cancelRegisterBtn = document.getElementById('cancel-register');

    registerBtn?.addEventListener('click', () => registerModal?.showModal());
    closeRegisterBtn?.addEventListener('click', () => registerModal?.close());
    cancelRegisterBtn?.addEventListener('click', () => registerModal?.close());
    
    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleRegistration(registerForm);
      registerModal?.close();
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => this.handleLogout());

    // Profile management
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const changeImageBtn = document.getElementById('change-image-btn');
    
    editProfileBtn?.addEventListener('click', () => this.editProfile());
    changeImageBtn?.addEventListener('click', () => this.changeProfileImage());
  }

  /**
   * Setup navigation between sections
   */
  private setupNavigation(): void {
    const navLinks = document.querySelectorAll('#navbar nav a');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          this.navigateToSection(href.substring(1)); // Remove # from href
        }
      });
    });
  }

  /**
   * Navigate to a specific section
   */
  private navigateToSection(sectionId: string): void {
    // Hide all sections
    const sections = ['home', 'restaurants', 'map', 'profile'];
    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        section.style.display = id === sectionId ? 'block' : 'none';
      }
    });

    // Special handling for profile section
    if (sectionId === 'profile') {
      if (!this.userService.isLoggedIn()) {
        this.showNotification('Kirjaudu sisään nähdäksesi profiilin', 'warning');
        this.navigateToSection('home');
        return;
      }
      this.updateProfileDisplay();
    }
  }

  /**
   * Handle user login
   */
  private async handleLogin(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const loginData = {
      email: formData.get('loginEmail') as string,
      password: formData.get('loginPassword') as string
    };

    const result = await this.userService.login(loginData);
    this.showNotification(result.message, result.success ? 'success' : 'error');
    
    if (result.success) {
      const loginDialog = document.getElementById('login-dialog') as HTMLDialogElement;
      loginDialog?.close();
      form.reset();
      this.updateAuthUI();
    }
  }

  /**
   * Handle user registration
   */
  private async handleRegistration(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const registrationData = {
      name: formData.get('registerName') as string,
      email: formData.get('registerEmail') as string,
      password: formData.get('registerPassword') as string
    };
    
    const profileImageFile = formData.get('profileImage') as File;

    const result = await this.userService.register(
      registrationData, 
      profileImageFile.size > 0 ? profileImageFile : undefined
    );
    
    this.showNotification(result.message, result.success ? 'success' : 'error');
    
    if (result.success) {
      const registerDialog = document.getElementById('register-dialog') as HTMLDialogElement;
      registerDialog?.close();
      form.reset();
      this.updateAuthUI();
    }
  }

  /**
   * Handle user logout
   */
  private handleLogout(): void {
    this.userService.logout();
    this.updateAuthUI();
    this.navigateToSection('home');
    this.showNotification('Olet kirjautunut ulos', 'success');
  }

  /**
   * Update authentication UI based on login status
   */
  private updateAuthUI(): void {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    const isLoggedIn = this.userService.isLoggedIn();
    
    if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
    if (registerBtn) registerBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
  }

  /**
   * Get user's current location
   */
  private getUserLocation(): void {
    if (!navigator.geolocation) {
      this.showNotification('Paikannnus ei ole tuettu tässä selaimessa', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        this.loadRestaurants(); // Reload with distance calculations
        this.showNotification('Sijainti haettu!', 'success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.showNotification('Sijainnin haku epäonnistui', 'error');
      }
    );
  }

  /**
   * Set view mode (daily/weekly)
   */
  private setViewMode(mode: ViewMode): void {
    this.currentViewMode = mode;
    
    // Update button states
    const dailyBtn = document.getElementById('daily-view-btn');
    const weeklyBtn = document.getElementById('weekly-view-btn');
    
    dailyBtn?.classList.toggle('active', mode === ViewMode.Daily);
    weeklyBtn?.classList.toggle('active', mode === ViewMode.Weekly);
    
    // If menu is open, refresh it with new view mode
    if (this.selectedRestaurant) {
      this.menuService.displayMenu(this.selectedRestaurant._id, this.currentViewMode);
    }
  }

  /**
   * Filter restaurants based on criteria
   */
  private filterRestaurants(filter: RestaurantFilter): void {
    this.filteredRestaurants = this.restaurants.filter(restaurant => {
      if (filter.searchTerm && !restaurant.name.toLowerCase().includes(filter.searchTerm.toLowerCase())) {
        return false;
      }
      if (filter.city && restaurant.city !== filter.city) {
        return false;
      }
      if (filter.company && restaurant.company !== filter.company) {
        return false;
      }
      return true;
    });
    
    this.renderRestaurants();
    this.updateMapMarkers();
  }

  /**
   * Apply filters from UI controls
   */
  private applyFilters(): void {
    const cityFilter = document.getElementById('city-filter') as HTMLSelectElement;
    const companyFilter = document.getElementById('company-filter') as HTMLSelectElement;
    const searchInput = document.getElementById('restaurant-search') as HTMLInputElement;
    
    const filter: RestaurantFilter = {};
    
    if (cityFilter?.value) filter.city = cityFilter.value;
    if (companyFilter?.value) filter.company = companyFilter.value;
    if (searchInput?.value) filter.searchTerm = searchInput.value;
    
    this.filterRestaurants(filter);
  }

  /**
   * Clear all filters
   */
  private clearFilters(): void {
    const cityFilter = document.getElementById('city-filter') as HTMLSelectElement;
    const companyFilter = document.getElementById('company-filter') as HTMLSelectElement;
    const searchInput = document.getElementById('restaurant-search') as HTMLInputElement;
    
    if (cityFilter) cityFilter.value = '';
    if (companyFilter) companyFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    this.filteredRestaurants = [...this.restaurants];
    this.renderRestaurants();
    this.updateMapMarkers();
  }

  /**
   * Populate filter dropdown options
   */
  private populateFilterOptions(): void {
    const cities = [...new Set(this.restaurants.map(r => r.city))].sort();
    const companies = [...new Set(this.restaurants.map(r => r.company))].sort();
    
    const cityFilter = document.getElementById('city-filter') as HTMLSelectElement;
    const companyFilter = document.getElementById('company-filter') as HTMLSelectElement;
    
    // Populate city filter
    if (cityFilter) {
      cityFilter.innerHTML = '<option value="">Kaikki kaupungit</option>';
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
      });
    }
    
    // Populate company filter
    if (companyFilter) {
      companyFilter.innerHTML = '<option value="">Kaikki palveluntarjoajat</option>';
      companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companyFilter.appendChild(option);
      });
    }
  }

  /**
   * Render restaurants list
   */
  private renderRestaurants(): void {
    const container = document.getElementById('restaurants-grid');
    if (!container) return;

    if (this.filteredRestaurants.length === 0) {
      container.innerHTML = `
        <div class="no-menu">
          <p>Ei ravintoloita löytynyt hakuehdoilla.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredRestaurants.map(restaurant => `
      <article class="restaurant-card ${restaurant.isClosest ? 'closest' : ''}" data-restaurant-id="${restaurant._id}">
        <header class="restaurant-header">
          <h3 class="restaurant-name">${restaurant.name}</h3>
          <div class="flex gap-2">
            ${restaurant.isClosest ? '<span class="badge badge-success">Lähin</span>' : ''}
            ${restaurant.distance ? `<span class="restaurant-distance badge badge-primary">${restaurant.distance} km</span>` : ''}
          </div>
        </header>
        
        <div class="restaurant-info">
          <p class="restaurant-address">
            <span aria-hidden="true">📍</span> 
            <strong>Osoite:</strong> ${restaurant.address}, ${restaurant.city}
          </p>
          <p class="restaurant-company">
            <span aria-hidden="true">🏢</span> 
            <strong>Yritys:</strong> ${restaurant.company}
          </p>
          ${restaurant.phone ? `
            <p>
              <span aria-hidden="true">📞</span> 
              <strong>Puhelin:</strong> ${restaurant.phone}
            </p>
          ` : ''}
        </div>
        
        <div class="card-actions">
          <button 
            class="btn btn-primary view-menu-btn" 
            data-restaurant-id="${restaurant._id}"
            aria-label="Näytä ravintolan ${restaurant.name} ruokalista"
          >
            <span aria-hidden="true">📋</span> 
            Näytä ${this.currentViewMode === ViewMode.Daily ? 'päivän' : 'viikon'} ruokalista
          </button>
          ${this.userService.isLoggedIn() ? `
            <button 
              class="btn btn-outline favorite-btn" 
              data-restaurant-id="${restaurant._id}"
              aria-label="Valitse ravintola ${restaurant.name} suosikiksi"
            >
              <span aria-hidden="true">⭐</span> Valitse suosikiksi
            </button>
          ` : ''}
        </div>
      </article>
    `).join('');

    // Add event listeners for restaurant cards
    this.attachRestaurantEventListeners();
  }

  /**
   * Attach event listeners to restaurant cards
   */
  private attachRestaurantEventListeners(): void {
    const viewMenuBtns = document.querySelectorAll('.view-menu-btn');
    const favoriteBtns = document.querySelectorAll('.favorite-btn');

    viewMenuBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const restaurantId = (e.target as HTMLElement).dataset.restaurantId;
        if (restaurantId) {
          this.viewRestaurantMenu(restaurantId);
        }
      });
    });

    favoriteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const restaurantId = (e.target as HTMLElement).dataset.restaurantId;
        if (restaurantId) {
          this.setFavoriteRestaurant(restaurantId);
        }
      });
    });
  }

  /**
   * View restaurant menu
   */
  private async viewRestaurantMenu(restaurantId: string): Promise<void> {
    const restaurant = this.restaurants.find(r => r._id === restaurantId);
    if (!restaurant) return;

    this.selectedRestaurant = restaurant;
    
    // Update UI
    const nameElement = document.getElementById('selected-restaurant-name');
    if (nameElement) {
      nameElement.textContent = restaurant.name;
    }

    // Show menu section
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.style.display = 'block';
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Load and display menu
    await this.menuService.displayMenu(restaurantId, this.currentViewMode);
  }

  /**
   * Close menu display
   */
  private closeMenu(): void {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.style.display = 'none';
    }
    this.selectedRestaurant = null;
  }

  /**
   * Set favorite restaurant
   */
  private async setFavoriteRestaurant(restaurantId: string): Promise<void> {
    const result = await this.userService.setFavoriteRestaurant(restaurantId);
    this.showNotification(result.message, result.success ? 'success' : 'error');
    
    if (result.success) {
      this.updateProfileDisplay();
    }
  }

  /**
   * Initialize map
   */
  private initializeMap(): void {
    console.log('Initializing map...');
    this.mapService.initializeMap('restaurant-map');
    
    // Delay markers update to ensure map is fully loaded
    setTimeout(() => {
      this.updateMapMarkers();
    }, 500);
  }

  /**
   * Update map markers
   */
  private updateMapMarkers(): void {
    if (this.filteredRestaurants.length === 0) {
      console.log('No restaurants to display on map');
      return;
    }
    
    console.log(`Updating map with ${this.filteredRestaurants.length} restaurants`);
    this.mapService.updateMarkers(this.filteredRestaurants, (restaurant: RestaurantWithDistance) => {
      this.viewRestaurantMenu(restaurant._id);
    });
  }

  /**
   * Update profile display
   */
  private updateProfileDisplay(): void {
    const user = this.userService.getCurrentUser();
    if (!user) return;

    const nameElement = document.getElementById('profile-name');
    const emailElement = document.getElementById('profile-email');
    const favoriteElement = document.getElementById('profile-favorite-restaurant');
    const imageElement = document.getElementById('profile-image-display') as HTMLImageElement;
    const placeholderElement = document.getElementById('profile-image-placeholder');

    if (nameElement) nameElement.textContent = user.name;
    if (emailElement) emailElement.textContent = user.email;
    
    if (favoriteElement && user.favoriteRestaurant) {
      const favoriteRestaurant = this.restaurants.find(r => r._id === user.favoriteRestaurant);
      favoriteElement.textContent = `Suosikkiravintola: ${favoriteRestaurant?.name || 'Tuntematon'}`;
    } else if (favoriteElement) {
      favoriteElement.textContent = 'Ei suosikkiravintolaa valittu';
    }

    if (user.profileImage && imageElement && placeholderElement) {
      imageElement.src = user.profileImage;
      imageElement.style.display = 'block';
      placeholderElement.style.display = 'none';
    } else if (imageElement && placeholderElement) {
      imageElement.style.display = 'none';
      placeholderElement.style.display = 'block';
    }
  }

  /**
   * Edit profile functionality
   */
  private editProfile(): void {
    // This could open a modal or navigate to an edit form
    // For now, we'll just show a simple prompt
    const user = this.userService.getCurrentUser();
    if (!user) return;

    const newName = prompt('Uusi nimi:', user.name);
    if (newName && newName.trim() && newName !== user.name) {
      this.userService.updateProfile({ name: newName.trim() })
        .then(result => {
          this.showNotification(result.message, result.success ? 'success' : 'error');
          if (result.success) {
            this.updateProfileDisplay();
          }
        });
    }
  }

  /**
   * Change profile image
   */
  private changeProfileImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const result = await this.userService.updateProfileImage(file);
        this.showNotification(result.message, result.success ? 'success' : 'error');
        if (result.success) {
          this.updateProfileDisplay();
        }
      }
    });
    
    input.click();
  }

  /**
   * Show/hide loading indicators
   */
  private showLoading(elementId: string, show: boolean): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Update general UI elements
   */
  private updateUI(): void {
    // Update any general UI elements that depend on app state
  }

  /**
   * Show notification to user
   */
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '4px',
      color: 'white',
      fontWeight: 'bold',
      zIndex: '10000',
      maxWidth: '300px',
      backgroundColor: type === 'success' ? '#4CAF50' : 
                      type === 'error' ? '#f44336' : 
                      type === 'warning' ? '#ff9800' : '#2196F3'
    });
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Global functions for popup buttons
declare global {
  interface Window {
    viewTodaysMenu: (restaurantId: string) => void;
    viewWeeksMenu: (restaurantId: string) => void;
    addAsFavorite: (restaurantId: string) => void;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new RestaurantApp();
  
  // Make popup functions available globally
  window.viewTodaysMenu = async (restaurantId: string) => {
    console.log('Viewing today\'s menu for restaurant:', restaurantId);
    // Find restaurant and show daily menu
    const restaurant = (app as any).restaurants.find((r: any) => r._id === restaurantId);
    if (restaurant) {
      (app as any).selectedRestaurant = restaurant;
      (app as any).currentViewMode = ViewMode.Daily;
      await (app as any).menuService.displayMenu(restaurantId, ViewMode.Daily);
      (app as any).showNotification('Näytetään päivän menu', 'info');
    }
  };
  
  window.viewWeeksMenu = async (restaurantId: string) => {
    console.log('Viewing week\'s menu for restaurant:', restaurantId);
    // Find restaurant and show weekly menu
    const restaurant = (app as any).restaurants.find((r: any) => r._id === restaurantId);
    if (restaurant) {
      (app as any).selectedRestaurant = restaurant;
      (app as any).currentViewMode = ViewMode.Weekly;
      await (app as any).menuService.displayMenu(restaurantId, ViewMode.Weekly);
      (app as any).showNotification('Näytetään viikon menu', 'info');
    }
  };
  
  window.addAsFavorite = (restaurantId: string) => {
    console.log('Adding restaurant as favorite:', restaurantId);
    // Add to favorites
    const restaurant = (app as any).restaurants.find((r: any) => r._id === restaurantId);
    if (restaurant) {
      (app as any).userService.updateProfile({ favoriteRestaurant: restaurantId })
        .then(() => {
          (app as any).showNotification('Ravintola lisätty suosikkeihin!', 'success');
        })
        .catch(() => {
          (app as any).showNotification('Virhe suosikin lisäämisessä', 'error');
        });
    }
  };
});