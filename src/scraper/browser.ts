import { chromium, Browser, Page, BrowserContext } from 'playwright';

const WINLINE_URL = 'https://winline.ru';

export class WinlineBrowser {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;

  async init(): Promise<void> {
    console.log('🚀 Initializing browser...');

    const browserlessKey = process.env.BROWSERLESS_API_KEY;

    if (browserlessKey) {
      // Подключаемся к Browserless.io
      console.log('☁️ Connecting to Browserless.io...');
      const wsEndpoint = `wss://chrome.browserless.io/playwright?token=${browserlessKey}`;

      this.browser = await chromium.connect(wsEndpoint);
      console.log('✅ Connected to Browserless');
    } else {
      // Локальный браузер
      console.log('💻 Using local browser...');
      this.browser = await chromium.launch({
        headless: process.env.SCRAPE_HEADLESS !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ru-RU',
    });

    this.page = await this.context.newPage();

    // Блокируем картинки и шрифты для ускорения
    await this.page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2}', (route) => route.abort());

    console.log('✅ Browser initialized');
  }

  async login(): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    const login = process.env.WINLINE_LOGIN;
    const password = process.env.WINLINE_PASSWORD;

    if (!login || !password) {
      console.warn('⚠️ WINLINE_LOGIN/PASSWORD not set, continuing without auth');
      return false;
    }

    console.log('🔐 Attempting to login...');

    try {
      await this.page.goto(WINLINE_URL, { waitUntil: 'networkidle', timeout: 60000 });

      const loginButton = await this.page.$('button:has-text("Вход"), [data-test="login-button"]');
      if (loginButton) {
        await loginButton.click();
        await this.page.waitForTimeout(1000);

        const loginInput = await this.page.$('input[type="tel"], input[name="login"]');
        const passwordInput = await this.page.$('input[type="password"]');

        if (loginInput && passwordInput) {
          await loginInput.fill(login);
          await passwordInput.fill(password);

          const submitButton = await this.page.$('button[type="submit"], button:has-text("Войти")');
          if (submitButton) {
            await submitButton.click();
            await this.page.waitForTimeout(3000);

            const userMenu = await this.page.$('.user-balance, .account-balance');
            if (userMenu) {
              this.isLoggedIn = true;
              console.log('✅ Successfully logged in');
              return true;
            }
          }
        }
      }

      console.warn('⚠️ Could not complete login');
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  }

  async navigateToSports(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log('📍 Navigating to sports page...');
    await this.page.goto(`${WINLINE_URL}/bets`, { waitUntil: 'networkidle', timeout: 60000 });
    await this.page.waitForTimeout(2000);
  }

  getPage(): Page {
    if (!this.page) throw new Error('Browser not initialized');
    return this.page;
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.isLoggedIn = false;
      console.log('🔒 Browser closed');
    }
  }
}

export const browser = new WinlineBrowser();
