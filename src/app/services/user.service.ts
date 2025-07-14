class UserService {
  private userName: string | null = null;
  private phoneNumber: string | null = null;
  private subscribers: (() => void)[] = [];

  constructor() {
    this.loadUserData();
  }

  get isLogin(): boolean {
    return this.userName !== null && this.phoneNumber !== null;
  }

  get loggedInUser(): string | null {
    return this.userName;
  }

  get loggedInPhoneNumber(): string | null {
    return this.phoneNumber;
  }

  async setUser(name: string, phone: string): Promise<void> {
    this.userName = name;
    this.phoneNumber = phone;

    if (typeof window !== 'undefined') {
      localStorage.setItem('userName', name);
      localStorage.setItem('phoneNumber', phone);
    }
    this.notifySubscribers();
  }

  async loadUserData(): Promise<void> {
    if (typeof window !== 'undefined') {
      this.userName = localStorage.getItem('userName');
      this.phoneNumber = localStorage.getItem('phoneNumber');
    }
    this.notifySubscribers();
  }

  async clearUserData(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userName');
      localStorage.removeItem('phoneNumber');
    }
    this.userName = null;
    this.phoneNumber = null;
    this.notifySubscribers();
  }

  // Observer pattern implementation similar to GetX's update()
  subscribe(callback: () => void): void {
    this.subscribers.push(callback);
  }

  unsubscribe(callback: () => void): void {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }
}

// Singleton instance
export const userService = new UserService();