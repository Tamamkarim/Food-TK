import { 
  Restaurant, 
  DailyMenu, 
  WeeklyMenu, 
  ApiResponse, 
  RestaurantWithDistance,
  UserLocation,
  LoginRequest,
  LoginResponse,
  UsernameAvailabilityResponse
} from './types.js';

// Force cache refresh - NO NETWORK CALLS VERSION 
console.log('🔥 API-SERVICE UPDATED - NO NETWORK CALLS - ' + new Date().toISOString());

/**
 * API service for handling restaurant and menu data
 */
export class RestaurantApiService {
  private readonly baseUrl = 'https://media1.edu.metropolia.fi/restaurant';
  private readonly fallbackUrls = [
    'https://media1.edu.metropolia.fi/restaurant',
    'http://media1.edu.metropolia.fi/restaurant',
    // يمكن إضافة URLs بديلة هنا
  ];
  private currentUrlIndex = 0;

  /**
   * Get current API URL with fallback support
   */
  private getCurrentApiUrl(): string {
    return this.fallbackUrls[this.currentUrlIndex] || this.baseUrl;
  }

  /**
   * Try next URL in fallback list
   */
  private tryNextUrl(): boolean {
    this.currentUrlIndex++;
    return this.currentUrlIndex < this.fallbackUrls.length;
  }

  /**
   * Reset URL index to primary
   */
  private resetUrlIndex(): void {
    this.currentUrlIndex = 0;
  }

  /**
   * Enhanced fetch with retry logic
   */
  private async fetchWithRetry(url: string, options?: RequestInit, maxRetries: number = 2): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt + 1}: Fetching ${url}`);
        
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
          this.resetUrlIndex(); // Reset to primary URL on success
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, lastError.message);
        
        // Try next URL if available
        if (attempt < maxRetries && this.tryNextUrl()) {
          const previousUrl = this.fallbackUrls[this.currentUrlIndex - 1];
          const newUrl = this.getCurrentApiUrl();
          if (previousUrl && newUrl) {
            url = url.replace(previousUrl, newUrl);
            console.log(`🔄 Trying fallback URL: ${newUrl}`);
          }
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Fetches all restaurants from the API
   */
  async getRestaurants(): Promise<Restaurant[]> {
    console.log('🔍 Environment check - always using mock data for development');
    
    // ALWAYS use mock data in development - no network calls
    console.log('🏠 Using mock data to avoid network issues');
    const mockData = this.getMockRestaurants();
    console.log('✅ Mock restaurants loaded:', mockData.length);
    return mockData;

    // Commented out API calls to prevent network errors
    /*
    console.log('🔍 Checking environment:', {
      hostname: window.location.hostname,
      href: window.location.href,
      port: window.location.port,
      protocol: window.location.protocol
    });
    
    // For development, use mock data directly to avoid network errors
    // Default to mock data unless explicitly in production
    const isProduction = window.location.hostname.includes('production') || 
                        window.location.hostname.includes('edu.metropolia.fi') ||
                        window.location.hostname.includes('herokuapp.com');
    
    const isDevelopment = !isProduction;
    
    if (isDevelopment) {
      console.log('🏠 Development/Local mode detected - using mock data');
      const mockData = this.getMockRestaurants();
      console.log('✅ Mock restaurants loaded:', mockData.length);
      return mockData;
    }

    try {
      console.log('🔄 Attempting to fetch restaurants from API...');
      
      const apiUrl = `${this.getCurrentApiUrl()}/api/v1/restaurants`;
      const response = await this.fetchWithRetry(apiUrl);
      
      const data: ApiResponse<Restaurant[]> = await response.json();
      console.log('✅ Successfully fetched restaurants from API:', data.data?.length || 0);
      return data.data || [];
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ API not available, using mock data:', errorMessage);
      
      // Show user-friendly notification
      if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') || errorMessage.includes('timeout')) {
        console.log('🌐 Network connectivity issue detected - using offline data');
      }
      
      // Return mock data if API is not available
      const mockRestaurants = this.getMockRestaurants();
      console.log('📦 Using mock data - restaurants count:', mockRestaurants.length);
      return mockRestaurants;
    }
    */
  }

  /**
   * Fetches daily menu for a specific restaurant
   */
  async getDailyMenu(restaurantId: string, date: string): Promise<DailyMenu | null> {
    // ALWAYS use mock data in development - no network calls
    console.log(`🏠 Always using mock daily menu for ${restaurantId} - no network calls`);
    return this.getMockDailyMenu(restaurantId, date);

    // Commented out API calls to prevent network errors
    /*
    // Default to mock data unless explicitly in production
    const isProduction = window.location.hostname.includes('production') || 
                        window.location.hostname.includes('edu.metropolia.fi') ||
                        window.location.hostname.includes('herokuapp.com');
    
    if (!isProduction) {
      console.log(`🏠 Development mode - using mock daily menu for ${restaurantId}`);
      return this.getMockDailyMenu(restaurantId, date);
    }

    try {
      console.log(`🔄 Fetching daily menu for restaurant ${restaurantId}, date: ${date}`);
      
      const apiUrl = `${this.getCurrentApiUrl()}/api/v1/restaurants/${restaurantId}/menu/${date}`;
      const response = await this.fetchWithRetry(apiUrl);
      
      const data: ApiResponse<DailyMenu> = await response.json();
      console.log('✅ Successfully fetched daily menu from API');
      return data.data || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Daily menu API not available, using mock data:', errorMessage);
      // Return mock data if API is not available
      return this.getMockDailyMenu(restaurantId, date);
    }
    */
  }

  /**
   * Fetches weekly menu for a specific restaurant
   */
  async getWeeklyMenu(restaurantId: string, week: number, year: number): Promise<WeeklyMenu | null> {
    // ALWAYS use mock data in development - no network calls
    console.log(`🏠 Always using mock weekly menu for ${restaurantId} - no network calls`);
    return this.getMockWeeklyMenu(restaurantId, week, year);

    // Commented out API calls to prevent network errors
    /*
    // Default to mock data unless explicitly in production
    const isProduction = window.location.hostname.includes('production') || 
                        window.location.hostname.includes('edu.metropolia.fi') ||
                        window.location.hostname.includes('herokuapp.com');
    
    if (!isProduction) {
      console.log(`🏠 Development mode - using mock weekly menu for ${restaurantId}`);
      return this.getMockWeeklyMenu(restaurantId, week, year);
    }

    try {
      console.log(`🔄 Fetching weekly menu for restaurant ${restaurantId}, week: ${week}/${year}`);
      const response = await fetch(`${this.baseUrl}/api/v1/restaurants/${restaurantId}/menu/week/${week}/${year}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<WeeklyMenu> = await response.json();
      console.log('✅ Successfully fetched weekly menu from API');
      return data.data || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Weekly menu API not available, using mock data:', errorMessage);
      // Return mock data if API is not available
      return this.getMockWeeklyMenu(restaurantId, week, year);
    }
    */
  }

  /**
   * User Authentication - Login
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // ALWAYS use mock authentication in development - no network calls
    console.log('🏠 Always using mock authentication - no network calls');
    return this.getMockLoginResponse(credentials);

    // Commented out API calls to prevent network errors
    /*
    // Default to mock data unless explicitly in production
    const isProduction = window.location.hostname.includes('production') || 
                        window.location.hostname.includes('edu.metropolia.fi') ||
                        window.location.hostname.includes('herokuapp.com');
    
    if (!isProduction) {
      console.log('🏠 Development mode - using mock authentication');
      return this.getMockLoginResponse(credentials);
    }

    try {
      console.log('🔐 Attempting user login...');
      const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LoginResponse = await response.json();
      console.log('✅ Login successful');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Login API not available:', errorMessage);
      
      // Mock login for development
      return this.getMockLoginResponse(credentials);
    }
    */
  }

  /**
   * Get daily menu with language support
   */
  async getDailyMenuWithLang(restaurantId: string, lang: string = 'fi'): Promise<DailyMenu | null> {
    try {
      console.log(`🔄 Fetching daily menu for restaurant ${restaurantId}, language: ${lang}`);
      const response = await fetch(`${this.baseUrl}/api/v1/restaurants/daily/${restaurantId}/${lang}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<DailyMenu> = await response.json();
      console.log('✅ Successfully fetched daily menu with language from API');
      return data.data || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Daily menu with language API not available, using fallback:', errorMessage);
      
      // Fallback to regular daily menu
      const today = new Date().toISOString().split('T')[0] || new Date().toDateString();
      return await this.getDailyMenu(restaurantId, today);
    }
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username: string): Promise<UsernameAvailabilityResponse> {
    try {
      console.log(`🔍 Checking username availability: ${username}`);
      const response = await fetch(`${this.baseUrl}/api/v1/users/available/${username}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: UsernameAvailabilityResponse = await response.json();
      console.log('✅ Username availability checked');
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Username availability API not available:', errorMessage);
      
      // Mock response for development
      return {
        available: Math.random() > 0.5, // Random for testing
        username: username
      };
    }
  }

  /**
   * Get restaurant by ID
   */
  async getRestaurantById(id: string): Promise<Restaurant | null> {
    try {
      console.log(`🔍 Fetching restaurant by ID: ${id}`);
      const response = await fetch(`${this.baseUrl}/api/v1/restaurants/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<Restaurant> = await response.json();
      console.log('✅ Successfully fetched restaurant by ID');
      return data.data || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Restaurant by ID API not available, using mock data:', errorMessage);
      
      // Search in mock data
      const mockRestaurants = this.getMockRestaurants();
      return mockRestaurants.find(r => r._id === id) || null;
    }
  }

  /**
   * Calculates distance between user location and restaurants
   */
  calculateDistanceToRestaurants(restaurants: Restaurant[], userLocation: UserLocation): RestaurantWithDistance[] {
    return restaurants.map(restaurant => {
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurant.location.coordinates[1], // latitude
        restaurant.location.coordinates[0]  // longitude
      );
      
      return {
        ...restaurant,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .map((restaurant, index) => ({
        ...restaurant,
        isClosest: index === 0
      }));
  }

  /**
   * Calculates distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Mock data for development when API is not available
   */
  private getMockRestaurants(): Restaurant[] {
    return [
      {
        _id: '1',
        name: 'Unicafe Keskuskampus',
        address: 'Yliopistonkatu 4',
        city: 'Helsinki',
        postalCode: '00100',
        phone: '+358 29 4424000',
        location: {
          type: 'Point',
          coordinates: [24.9517, 60.1674] // University of Helsinki
        },
        company: 'Unicafe'
      },
      {
        _id: '2',
        name: 'Sodexo Myyrmäki Campus',
        address: 'Myllypurontie 1',
        city: 'Vantaa',
        postalCode: '01600',
        phone: '+358 20 7507200',
        location: {
          type: 'Point',
          coordinates: [24.8458, 60.2641] // Metropolia Myyrmäki
        },
        company: 'Sodexo'
      },
      {
        _id: '3',
        name: 'Unicafe Otaniemi',
        address: 'Otakaari 11',
        city: 'Espoo',
        postalCode: '02150',
        phone: '+358 50 5167879',
        location: {
          type: 'Point',
          coordinates: [24.8255, 60.1867] // Aalto University
        },
        company: 'Unicafe'
      },
      {
        _id: '4',
        name: 'Fazer Food & Co Karamalmi',
        address: 'Bulevardi 31',
        city: 'Helsinki',
        postalCode: '00180',
        phone: '+358 20 4708234',
        location: {
          type: 'Point',
          coordinates: [24.9230, 60.1572]
        },
        company: 'Fazer'
      },
      {
        _id: '5',
        name: 'Compass Group Arabia',
        address: 'Hämeentie 135',
        city: 'Helsinki',
        postalCode: '00560',
        phone: '+358 10 5663400',
        location: {
          type: 'Point',
          coordinates: [24.9775, 60.2089] // Metropolia Arabia
        },
        company: 'Compass Group'
      },
      {
        _id: '6',
        name: 'Sodexo Leppävaara',
        address: 'Leppävaarankatu 3-9',
        city: 'Espoo',
        postalCode: '02600',
        phone: '+358 20 7507201',
        location: {
          type: 'Point',
          coordinates: [24.8134, 60.2190]
        },
        company: 'Sodexo'
      }
    ];
  }

  private getMockDailyMenu(restaurantId: string, date: string): DailyMenu {
    const restaurant = this.getMockRestaurants().find(r => r._id === restaurantId);
    const restaurantName = restaurant?.name || 'Ravintola';
    
    const menuVariations = [
      {
        name: 'Lihapullat muusilla ja puolukkasurvoksella',
        price: '2.70€',
        diets: ['G', 'L'],
        allergens: ['Gluteeni', 'Maito']
      },
      {
        name: 'Broileripyörykkät paprikakastikkeessa',
        price: '2.70€',
        diets: ['G', 'L'],
        allergens: ['Gluteeni']
      },
      {
        name: 'Kalapuikot ja perunasose',
        price: '2.80€',
        diets: ['G', 'L'],
        allergens: ['Kala', 'Gluteeni']
      }
    ];

    const vegOptions = [
      {
        name: 'Vegaaninen linssicurry basmatiriisillä',
        price: '2.50€',
        diets: ['Veg', 'VS', 'G', 'L'],
        allergens: []
      },
      {
        name: 'Kasvisbolognese spagettilla',
        price: '2.60€',
        diets: ['Veg', 'L'],
        allergens: ['Gluteeni']
      },
      {
        name: 'Tofuwok vihannesten kanssa',
        price: '2.55€',
        diets: ['Veg', 'VS', 'G'],
        allergens: ['Soija']
      }
    ];

    const soups = [
      {
        name: 'Hernekeitto savulihalla',
        price: '2.20€',
        diets: ['G', 'L'],
        allergens: []
      },
      {
        name: 'Tomaatti-basilikakeitto',
        price: '2.00€',
        diets: ['Veg', 'VS', 'G', 'L'],
        allergens: []
      },
      {
        name: 'Kanakeitto juureksilla',
        price: '2.30€',
        diets: ['G', 'L'],
        allergens: []
      }
    ];

    const selectedMain = menuVariations[Math.floor(Math.random() * menuVariations.length)]!;
    const selectedVeg = vegOptions[Math.floor(Math.random() * vegOptions.length)]!;
    const selectedSoup = soups[Math.floor(Math.random() * soups.length)]!;

    return {
      _id: `menu-${restaurantId}-${date}`,
      restaurantId,
      date,
      courses: [selectedMain, selectedVeg, selectedSoup]
    };
  }

  private getMockWeeklyMenu(restaurantId: string, week: number, year: number): WeeklyMenu {
    const days = ['Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai'];
    const dayMenus = [
      [
        { name: 'Maanantain lihapullat perunamuusilla', price: '2.70€', diets: ['G', 'L'], allergens: ['Gluteeni'] },
        { name: 'Vegaaninen tofuwok', price: '2.50€', diets: ['Veg', 'VS', 'G'], allergens: ['Soija'] },
        { name: 'Hernekeitto', price: '2.20€', diets: ['G', 'L'], allergens: [] }
      ],
      [
        { name: 'Tiistain broileripyörykkät', price: '2.75€', diets: ['G', 'L'], allergens: ['Gluteeni'] },
        { name: 'Kasvisbolognese', price: '2.60€', diets: ['Veg', 'L'], allergens: ['Gluteeni'] },
        { name: 'Tomaattikeitto', price: '2.00€', diets: ['Veg', 'VS', 'G', 'L'], allergens: [] }
      ],
      [
        { name: 'Keskiviikon kalapuikot', price: '2.80€', diets: ['G', 'L'], allergens: ['Kala', 'Gluteeni'] },
        { name: 'Linssicurry riisillä', price: '2.55€', diets: ['Veg', 'VS', 'G', 'L'], allergens: [] },
        { name: 'Kanakeitto', price: '2.30€', diets: ['G', 'L'], allergens: [] }
      ],
      [
        { name: 'Torstain paistettu kala', price: '2.85€', diets: ['G', 'L'], allergens: ['Kala'] },
        { name: 'Vegaaninen nuudeliwok', price: '2.65€', diets: ['Veg', 'VS'], allergens: ['Gluteeni'] },
        { name: 'Kasviskeitto', price: '2.10€', diets: ['Veg', 'G', 'L'], allergens: [] }
      ],
      [
        { name: 'Perjantain pizza', price: '2.90€', diets: ['L'], allergens: ['Gluteeni', 'Maito'] },
        { name: 'Vegaaninen salaattibowl', price: '2.40€', diets: ['Veg', 'VS', 'G', 'L'], allergens: [] },
        { name: 'Lämpimät voileivät', price: '2.50€', diets: ['L'], allergens: ['Gluteeni'] }
      ]
    ];

    return {
      _id: `week-${restaurantId}-${week}-${year}`,
      restaurantId,
      week,
      year,
      days: days.map((day, index) => {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1 + index);
        
        return {
          date: currentDate.toISOString().split('T')[0]!,
          courses: dayMenus[index] || []
        };
      })
    };
  }

  /**
   * Mock login response for development
   */
  private getMockLoginResponse(credentials: LoginRequest): LoginResponse {
    // Simple mock authentication
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      return {
        success: true,
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          registrationDate: new Date()
        },
        message: 'Login successful'
      };
    } else if (credentials.username === 'john.doe' && credentials.password === 'password123') {
      return {
        success: true,
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: '2',
          name: ' Doe',
          email: 'j.doe@example.com',
          registrationDate: new Date()
        },
        message: 'Login successful'
      };
    } else {
      return {
        success: false,
        message: 'Virheelliset tunnukset'
      };
    }
  }
}