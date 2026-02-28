import type {
  CookingModeService,
  CookingModeSession
} from "@cookies-et-coquilettes/domain";

type WakeLockSentinel = {
  release: () => Promise<void>;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

class BrowserCookingModeService implements CookingModeService {
  private wakeLockSentinel: WakeLockSentinel | null = null;
  private fallbackActive = false;

  async startCookingMode(): Promise<CookingModeSession> {
    const wakeNavigator = navigator as NavigatorWithWakeLock;
    if (wakeNavigator.wakeLock?.request) {
      try {
        this.wakeLockSentinel = await wakeNavigator.wakeLock.request("screen");
        this.fallbackActive = false;
        return { active: true, strategy: "WAKE_LOCK" };
      } catch (_error) {
        this.fallbackActive = true;
        return { active: true, strategy: "FALLBACK" };
      }
    }

    this.fallbackActive = true;
    return { active: true, strategy: "FALLBACK" };
  }

  async stopCookingMode(): Promise<void> {
    if (this.wakeLockSentinel) {
      await this.wakeLockSentinel.release();
      this.wakeLockSentinel = null;
    }
    this.fallbackActive = false;
  }
}

export const browserCookingModeService = new BrowserCookingModeService();
