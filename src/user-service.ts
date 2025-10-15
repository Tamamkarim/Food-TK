import { User, UserRegistration, UserLogin, LoginRequest, LoginResponse } from './types.js';
import { RestaurantApiService } from './api-service.js';

/**
 * User management service for handling authentication and user data
 */
export class UserService {
  private readonly storageKey = 'restaurant-app-user';
  private readonly usersStorageKey = 'restaurant-app-users';
  private currentUser: User | null = null;
  private apiService: RestaurantApiService;

  constructor() {
    this.apiService = new RestaurantApiService();
    this.loadCurrentUser();
  }

  /**
   * Registers a new user
   */
  async register(userData: UserRegistration, profileImage?: File): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user already exists
      const existingUsers = this.getAllUsers();
      const userExists = existingUsers.some(user => user.email === userData.email);
      
      if (userExists) {
        return { success: false, message: 'Käyttäjä tällä sähköpostilla on jo olemassa' };
      }

      // Validate password strength
      if (!this.isPasswordValid(userData.password)) {
        return { success: false, message: 'Salasanan tulee sisältää vähintään 8 merkkiä, kirjaimia ja numeroita' };
      }

      // Create new user
      const newUser: User = {
        id: this.generateUserId(),
        name: userData.name,
        email: userData.email,
        registrationDate: new Date()
      };

      // Add profile image if provided
      if (profileImage) {
        newUser.profileImage = await this.processProfileImage(profileImage);
      }

      // Save user credentials (in a real app, password would be hashed)
      const userCredentials = {
        email: userData.email,
        passwordHash: await this.hashPassword(userData.password) // Mock hash
      };

      // Store user data
      existingUsers.push(newUser);
      this.saveAllUsers(existingUsers);
      this.saveUserCredentials(userCredentials);

      // Auto-login after registration
      this.currentUser = newUser;
      this.saveCurrentUser();

      return { success: true, message: 'Rekisteröinti onnistui!' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Rekisteröinnissä tapahtui virhe' };
    }
  }

  /**
   * Logs in a user
   */
  async login(loginData: UserLogin): Promise<{ success: boolean; message: string }> {
    try {
      const users = this.getAllUsers();
      const user = users.find(u => u.email === loginData.email);

      if (!user) {
        return { success: false, message: 'Käyttäjää ei löytynyt' };
      }

      // Verify password (mock verification)
      const isPasswordCorrect = await this.verifyPassword(loginData.password, loginData.email);
      if (!isPasswordCorrect) {
        return { success: false, message: 'Väärä salasana' };
      }

      this.currentUser = user;
      this.saveCurrentUser();

      return { success: true, message: 'Kirjautuminen onnistui!' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Kirjautumisessa tapahtui virhe' };
    }
  }

  /**
   * Logs in a user using API
   */
  async loginWithAPI(username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      console.log('🔐 Attempting API login...');
      
      const credentials: LoginRequest = { username, password };
      const response: LoginResponse = await this.apiService.login(credentials);
      
      if (response.success && response.user) {
        // Store user data locally
        this.currentUser = response.user;
        this.saveCurrentUser();
        
        // Store token if available
        if (response.token) {
          localStorage.setItem('auth-token', response.token);
        }
        
        console.log('✅ API login successful');
        return { 
          success: true, 
          message: response.message || 'Kirjautuminen onnistui!',
          user: response.user
        };
      } else {
        console.warn('⚠️ API login failed');
        return { 
          success: false, 
          message: response.message || 'Kirjautuminen epäonnistui'
        };
      }
      
    } catch (error) {
      console.error('❌ API login error:', error);
      
      // Fallback to local login
      console.log('🔄 Falling back to local login...');
      return await this.login({ email: username, password });
    }
  }

  /**
   * Check username availability using API
   */
  async checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string }> {
    try {
      console.log(`🔍 Checking username availability: ${username}`);
      
      const response = await this.apiService.checkUsernameAvailability(username);
      
      return {
        available: response.available,
        message: response.available ? 
          'Käyttäjänimi on käytettävissä' : 
          'Käyttäjänimi on jo käytössä'
      };
      
    } catch (error) {
      console.error('❌ Username availability check error:', error);
      
      // Fallback to local check
      const users = this.getAllUsers();
      const exists = users.some(user => user.name === username || user.email === username);
      
      return {
        available: !exists,
        message: exists ? 
          'Käyttäjänimi ei ole käytettävissä' : 
          'Käyttäjänimi on käytettävissä'
      };
    }
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Gets the current logged-in user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Checks if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Updates user profile
   */
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; message: string }> {
    if (!this.currentUser) {
      return { success: false, message: 'Ei kirjautunutta käyttäjää' };
    }

    try {
      const users = this.getAllUsers();
      const userIndex = users.findIndex(u => u.id === this.currentUser!.id);

      if (userIndex === -1) {
        return { success: false, message: 'Käyttäjää ei löytynyt' };
      }

      // Update user data
      const updatedUser = { ...this.currentUser, ...updates };
      users[userIndex] = updatedUser;

      this.saveAllUsers(users);
      this.currentUser = updatedUser;
      this.saveCurrentUser();

      return { success: true, message: 'Profiili päivitetty!' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'Profiilin päivityksessä tapahtui virhe' };
    }
  }

  /**
   * Sets user's favorite restaurant
   */
  async setFavoriteRestaurant(restaurantId: string): Promise<{ success: boolean; message: string }> {
    return this.updateProfile({ favoriteRestaurant: restaurantId });
  }

  /**
   * Updates user's profile image
   */
  async updateProfileImage(imageFile: File): Promise<{ success: boolean; message: string }> {
    try {
      const imageDataUrl = await this.processProfileImage(imageFile);
      return this.updateProfile({ profileImage: imageDataUrl });
    } catch (error) {
      console.error('Profile image update error:', error);
      return { success: false, message: 'Profiilikuvan päivityksessä tapahtui virhe' };
    }
  }

  // Private helper methods

  private loadCurrentUser(): void {
    const userData = localStorage.getItem(this.storageKey);
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        // Convert date strings back to Date objects
        if (this.currentUser?.registrationDate) {
          this.currentUser.registrationDate = new Date(this.currentUser.registrationDate);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem(this.storageKey);
      }
    }
  }

  private saveCurrentUser(): void {
    if (this.currentUser) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
    }
  }

  private getAllUsers(): User[] {
    const usersData = localStorage.getItem(this.usersStorageKey);
    if (usersData) {
      try {
        return JSON.parse(usersData);
      } catch (error) {
        console.error('Error loading users data:', error);
      }
    }
    return [];
  }

  private saveAllUsers(users: User[]): void {
    localStorage.setItem(this.usersStorageKey, JSON.stringify(users));
  }

  private saveUserCredentials(credentials: { email: string; passwordHash: string }): void {
    const credentialsKey = `credentials-${credentials.email}`;
    localStorage.setItem(credentialsKey, JSON.stringify(credentials));
  }

  private async verifyPassword(password: string, email: string): Promise<boolean> {
    const credentialsKey = `credentials-${email}`;
    const credentialsData = localStorage.getItem(credentialsKey);
    
    if (!credentialsData) {
      return false;
    }

    try {
      const credentials = JSON.parse(credentialsData);
      const passwordHash = await this.hashPassword(password);
      return credentials.passwordHash === passwordHash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // Mock password hashing - in a real app, use proper hashing library
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private isPasswordValid(password: string): boolean {
    // At least 8 characters, contains letters and numbers
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async processProfileImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Tiedosto ei ole kuva'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Kuva on liian suuri (max 5MB)'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Kuvan lukemisessa tapahtui virhe'));
      };
      reader.readAsDataURL(file);
    });
  }
}