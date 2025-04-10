/**
 * Interface for the sidebar toggle event detail
 */
interface SidebarToggleEvent {
  isActive: boolean;
}

/**
 * Interface for icon paths
 * Uses record syntax for compatibility with chrome.action.setIcon
 */
interface IconPaths extends Record<string, string> {
  16: string;
  32: string;
  48: string;
  128: string;
}

/**
 * Manages the extension's icon state and behavior
 */
export class ExtensionIconManager extends EventTarget {
  private _isActive: boolean = false;

  // Base path for icons
  private readonly iconBasePath = '/icons';
  
  // Icon paths
  private readonly defaultIconPaths: IconPaths = {
    16: `${this.iconBasePath}/default-16.png`,
    32: `${this.iconBasePath}/default-32.png`,
    48: `${this.iconBasePath}/default-48.png`,
    128: `${this.iconBasePath}/default-128.png`,
  };

  private readonly activeIconPaths: IconPaths = {
    16: `${this.iconBasePath}/active-16.png`,
    32: `${this.iconBasePath}/active-32.png`,
    48: `${this.iconBasePath}/active-48.png`,
    128: `${this.iconBasePath}/active-128.png`,
  };

  constructor() {
    super();
    this.initializeIcon();
    this.setupEventListeners();
  }

  /**
   * Returns the current active state of the extension
   */
  get isActive(): boolean {
    return this._isActive;
  }

  /**
   * Initialize the icon state
   */
  private initializeIcon(): void {
    try {
      // Set initial icon state
      chrome.action.setIcon({
        path: this.defaultIconPaths,
      });

      // Set initial title
      chrome.action.setTitle({
        title: 'WebCore Extension (Inactive)',
      });
    } catch (error) {
      console.error('Failed to initialize extension icon:', error);
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    try {
      // Listen for clicks on the extension icon
      chrome.action.onClicked.addListener(this.handleIconClick.bind(this));
    } catch (error) {
      console.error('Failed to set up extension icon listeners:', error);
    }
  }

  /**
   * Handle clicks on the extension icon
   */
  private handleIconClick(): void {
    this.toggle();
  }

  /**
   * Toggle the active state
   */
  public toggle(): void {
    this.setActive(!this._isActive);
  }

  /**
   * Set the active state explicitly
   */
  public setActive(active: boolean): void {
    // If the state isn't changing, do nothing
    if (this._isActive === active) {
      return;
    }
    
    // Update the state
    this._isActive = active;
    
    // Update the icon
    this.updateIcon();
    
    // Update the title
    this.updateTitle();
    
    // Dispatch event
    this.dispatchSidebarToggleEvent();
  }

  /**
   * Update the icon based on current state
   */
  private updateIcon(): void {
    try {
      chrome.action.setIcon({
        path: this._isActive ? this.activeIconPaths : this.defaultIconPaths,
      });
    } catch (error) {
      console.error('Failed to update extension icon:', error);
    }
  }

  /**
   * Update the title based on current state
   */
  private updateTitle(): void {
    try {
      chrome.action.setTitle({
        title: `WebCore Extension (${this._isActive ? 'Active' : 'Inactive'})`,
      });
    } catch (error) {
      console.error('Failed to update extension title:', error);
    }
  }

  /**
   * Dispatch an event when the sidebar state changes
   * 
   * @fires sidebarToggle - Custom event containing the sidebar state
   * Event detail: { isActive: boolean }
   */
  private dispatchSidebarToggleEvent(): void {
    const event = new CustomEvent<SidebarToggleEvent>('sidebarToggle', {
      detail: { isActive: this._isActive }
    });
    
    this.dispatchEvent(event);
  }
} 