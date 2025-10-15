// Restaurant and menu data types for the Finnish student restaurant API

export interface Restaurant {
  _id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  company: string;
}

export interface MenuDay {
  date: string;
  courses: Course[];
}

export interface Course {
  name: string;
  price: string;
  diets?: string[];
  allergens?: string[];
}

export interface DailyMenu {
  _id: string;
  restaurantId: string;
  date: string;
  courses: Course[];
}

export interface WeeklyMenu {
  _id: string;
  restaurantId: string;
  week: number;
  year: number;
  days: MenuDay[];
}

// User management types
export interface User {
  id: string;
  name: string;
  email: string;
  favoriteRestaurant?: string;
  profileImage?: string;
  registrationDate: Date;
}

export interface UserRegistration {
  name: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Filter types
export interface RestaurantFilter {
  city?: string;
  company?: string;
  searchTerm?: string;
}

// Location types
export interface UserLocation {
  latitude: number;
  longitude: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface RestaurantWithDistance extends Restaurant {
  distance?: number;
  isClosest?: boolean;
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface UsernameAvailabilityResponse {
  available: boolean;
  username: string;
}

// Enums
export enum ViewMode {
  Daily = 'daily',
  Weekly = 'weekly'
}

export enum FilterType {
  City = 'city',
  Company = 'company'
}