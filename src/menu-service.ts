import { RestaurantApiService } from './api-service.js';
import { ViewMode, DailyMenu, WeeklyMenu } from './types.js';

/**
 * Menu service for handling menu display and management
 */
export class MenuService {
  private apiService: RestaurantApiService;

  constructor() {
    this.apiService = new RestaurantApiService();
  }

  /**
   * Display menu for a restaurant
   */
  async displayMenu(restaurantId: string, viewMode: ViewMode): Promise<void> {
    const menuModal = document.getElementById('menu-modal') as HTMLDialogElement;
    const menuContent = document.getElementById('menu-content');
    const menuTitle = document.getElementById('menu-modal-title');
    
    if (!menuModal || !menuContent) return;

    try {
      // Show modal and loading state
      menuModal.showModal();
      menuContent.innerHTML = `
        <div class="loading">
          <div class="loading-spinner" aria-hidden="true"></div>
          <span>Ladataan ruokalistaa...</span>
        </div>
      `;

      // Update modal title
      if (menuTitle) {
        menuTitle.textContent = viewMode === ViewMode.Daily ? 
          'Päivän ruokalista' : 'Viikon ruokalista';
      }

      if (viewMode === ViewMode.Daily) {
        await this.displayDailyMenu(restaurantId, menuContent);
      } else {
        await this.displayWeeklyMenu(restaurantId, menuContent);
      }

    } catch (error) {
      console.error('Error displaying menu:', error);
      if (menuContent) {
        menuContent.innerHTML = `
          <div class="no-menu">
            <p>❌ Ruokalistan lataus epäonnistui</p>
            <p>Yritä myöhemmin uudelleen.</p>
          </div>
        `;
      }
    }
  }

  /**
   * Display daily menu
   */
  private async displayDailyMenu(restaurantId: string, container: HTMLElement): Promise<void> {
    const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD format
    const menu = await this.apiService.getDailyMenu(restaurantId, today);

    if (!menu || !menu.courses || menu.courses.length === 0) {
      container.innerHTML = `
        <div class="no-menu">
          <p>Tänään ei ole ruokalistaa saatavilla</p>
        </div>
      `;
      return;
    }

    const menuHtml = `
      <section class="menu-section">
        <header class="menu-header">
          <h3 class="menu-title">Päivän ruokalista</h3>
          <p class="menu-date">${this.formatDate(new Date())}</p>
        </header>
        
        <div class="menu-items">
          ${menu.courses.map(course => `
            <article class="menu-item">
              <div class="menu-item-content">
                <h4 class="menu-item-name">${course.name}</h4>
                ${course.diets && course.diets.length > 0 ? `
                  <div class="menu-item-dietary">
                    ${course.diets.map(diet => `
                      <span class="dietary-badge ${this.getDietaryClass(diet)}">${diet}</span>
                    `).join('')}
                  </div>
                ` : ''}
                ${course.allergens && course.allergens.length > 0 ? `
                  <p class="menu-item-details">
                    <strong>Allergeenit:</strong> ${course.allergens.join(', ')}
                  </p>
                ` : ''}
              </div>
              <div class="menu-item-price">${course.price}</div>
            </article>
          `).join('')}
        </div>
      </section>
    `;

    container.innerHTML = menuHtml;
  }

  /**
   * Get CSS class for dietary requirement
   */
  private getDietaryClass(diet: string): string {
    const lowerDiet = diet.toLowerCase();
    if (lowerDiet.includes('vegan') || lowerDiet.includes('vegaani')) {
      return 'dietary-vegan';
    }
    if (lowerDiet.includes('vegetarian') || lowerDiet.includes('kasvis')) {
      return 'dietary-vegetarian';
    }
    if (lowerDiet.includes('gluten') || lowerDiet.includes('gluteeni')) {
      return 'dietary-gluten-free';
    }
    return 'dietary-badge';
  }

  /**
   * Display weekly menu
   */
  private async displayWeeklyMenu(restaurantId: string, container: HTMLElement): Promise<void> {
    const currentDate = new Date();
    const week = this.getWeekNumber(currentDate);
    const year = currentDate.getFullYear();
    
    const menu = await this.apiService.getWeeklyMenu(restaurantId, week, year);

    if (!menu || !menu.days || menu.days.length === 0) {
      container.innerHTML = `
        <div class="no-menu">
          <p>Viikon ruokalistaa ei ole saatavilla</p>
        </div>
      `;
      return;
    }

    const menuHtml = `
      <section class="menu-section">
        <header class="menu-header">
          <h3 class="menu-title">Viikon ruokalista</h3>
          <p class="menu-date">Viikko ${week}, ${year}</p>
        </header>
        
        <div class="weekly-menu">
          ${menu.days.map((day, index) => {
            const dayDate = new Date(day.date || new Date());
            
            return `
              <article class="day-menu">
                <header class="day-header">
                  <h4 class="day-name">${this.getDayName(index)}</h4>
                  <span class="day-date">${this.formatDate(dayDate)}</span>
                </header>
                
                ${day.courses && day.courses.length > 0 ? `
                  <div class="menu-items">
                    ${day.courses.map(course => `
                      <article class="menu-item">
                        <div class="menu-item-content">
                          <h5 class="menu-item-name">${course.name}</h5>
                          ${course.diets && course.diets.length > 0 ? `
                            <div class="menu-item-dietary">
                              ${course.diets.map(diet => `
                                <span class="dietary-badge ${this.getDietaryClass(diet)}">${diet}</span>
                              `).join('')}
                            </div>
                          ` : ''}
                          ${course.allergens && course.allergens.length > 0 ? `
                            <p class="menu-item-details">
                              <strong>Allergeenit:</strong> ${course.allergens.join(', ')}
                            </p>
                          ` : ''}
                        </div>
                        <div class="menu-item-price">${course.price}</div>
                      </article>
                    `).join('')}
                  </div>
                ` : `
                  <div class="no-menu">
                    <p>Ei ruokalistaa tälle päivälle</p>
                  </div>
                `}
              </article>
            `;
          }).join('')}
        </div>
      </section>
    `;

    container.innerHTML = menuHtml;
  }

  /**
   * Get week number for a date
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get Finnish day name by index
   */
  private getDayName(index: number): string {
    const days = ['Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai', 'Lauantai', 'Sunnuntai'];
    return days[index] || `Päivä ${index + 1}`;
  }

  /**
   * Format date to Finnish format
   */
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString('fi-FI', options);
  }

  /**
   * Get menu for a specific date range (utility method)
   */
  async getMenuForDateRange(restaurantId: string, startDate: string, endDate: string): Promise<DailyMenu[]> {
    // This could be expanded to fetch multiple days at once
    // For now, we'll just return a single day menu
    const menu = await this.apiService.getDailyMenu(restaurantId, startDate);
    return menu ? [menu] : [];
  }

  /**
   * Search courses by name or ingredients
   */
  searchCourses(menu: DailyMenu | WeeklyMenu, searchTerm: string): any[] {
    const courses: any[] = [];
    
    if ('courses' in menu) {
      // Daily menu
      courses.push(...menu.courses);
    } else {
      // Weekly menu
      menu.days.forEach(day => {
        courses.push(...day.courses);
      });
    }

    return courses.filter(course => 
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Filter courses by dietary restrictions
   */
  filterCoursesByDiet(menu: DailyMenu | WeeklyMenu, dietFilter: string): any[] {
    const courses: any[] = [];
    
    if ('courses' in menu) {
      // Daily menu
      courses.push(...menu.courses);
    } else {
      // Weekly menu
      menu.days.forEach(day => {
        courses.push(...day.courses);
      });
    }

    return courses.filter(course => 
      course.diets && course.diets.includes(dietFilter)
    );
  }
}