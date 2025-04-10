/**
 * Manages the extension's icon state and behavior
 */
export class ExtensionIconManager extends EventTarget {
  private _isActive: boolean = false;

  // Icon paths
  private readonly defaultIconPaths = {
    16: '/icons/default-16.png',
    32: '/icons/default-32.png',
    48: '/icons/default-48.png',
    128: '/icons/default-128.png',
  };

  private readonly activeIconPaths = {
    16: '/icons/active-16.png',
    32: '/icons/active-32.png',
    48: '/icons/active-48.png',
    128: '/icons/active-128.png',
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
    // Set initial icon state
    chrome.action.setIcon({
      path: this.defaultIconPaths,
    });

    // Set initial title
    chrome.action.setTitle({
      title: 'WebCore Extension (Inactive)',
    });
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for clicks on the extension icon
    chrome.action.onClicked.addListener(this.handleIconClick.bind(this));
  }

  /**
   * Handle clicks on the extension icon
   */
  private handleIconClick(_tab: chrome.tabs.Tab): void {
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
    chrome.action.setIcon({
      path: this._isActive ? this.activeIconPaths : this.defaultIconPaths,
    });
  }

  /**
   * Update the title based on current state
   */
  private updateTitle(): void {
    chrome.action.setTitle({
      title: `WebCore Extension (${this._isActive ? 'Active' : 'Inactive'})`,
    });
  }

  /**
   * Dispatch an event when the sidebar state changes
   */
  private dispatchSidebarToggleEvent(): void {
    const event = new CustomEvent('sidebarToggle', {
      detail: { isActive: this._isActive }
    });
    
    this.dispatchEvent(event);
  }
} 