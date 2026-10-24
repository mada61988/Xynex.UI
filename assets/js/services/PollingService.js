/**
 * assets/js/services/PollingService.js
 * 
 * Centralized, tab-aware background polling engine for Xynex UI.
 * Features:
 *  - Endpoint priority-based polling intervals
 *  - Tab/Section awareness: only polls endpoints for the user's current view
 *  - Data diffing: detects if new data arrived from backend before triggering re-renders
 *  - Silent execution: never triggers global or section loaders during background ticks
 *  - Page visibility handling: throttles/pauses when browser tab is hidden
 */

export const POLLING_INTERVALS = {
  // Priority 1: Real-time messaging (Highest)
  CHAT_MESSAGES: 3000,      // 3s - Active chat messages timeline
  CONVERSATIONS: 6000,      // 6s - Thread list / inbound inquiries

  // Priority 2: Real-time operational pulse (High)
  MESSAGES_COUNT: 8000,     // 8s - Messages handled metric & live ticker
  PLACED_ORDERS: 12000,     // 12s - Placed orders intake
  CONVERSION_SALES: 15000,  // 15s - DM-to-checkout rate & total sales

  // Priority 3: Workspaces & Channels uptime (Medium)
  CHANNELS_STATUS: 25000,   // 25s - Channels metric & operational %
  PRODUCTS_CATALOG: 35000,  // 35s - Workspace products catalog

  // Priority 4: Admin Directory & Infrastructure (Low)
  USERS_DIRECTORY: 45000,   // 45s - Users table & roles
  WORKSPACES_LIST: 60000    // 60s - Workspaces cards list
};

export class PollingService {
  constructor() {
    this.tasks = new Map(); // key -> task definition
    this.activeSection = 'overview';
    this.isPageVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isPageVisible = document.visibilityState === 'visible';
        if (this.isPageVisible) {
          this.resumeActiveTasks();
        } else {
          this.pauseAllTasks();
        }
      });
    }
  }

  /**
   * Registers a background polling task.
   * @param {string} key - Unique task key
   * @param {Object} options
   * @param {string|string[]} options.section - Section(s) where this task should run ('overview', 'users', etc. or '*' for global)
   * @param {number} options.interval - Interval in milliseconds (from POLLING_INTERVALS)
   * @param {Function} options.fetchFn - Async function returning fresh data
   * @param {Function} options.onUpdate - Callback (newData, hasChanged)
   * @param {Function} [options.compareFn] - Custom equality comparator (default: deep JSON comparison)
   */
  register(key, { section = 'overview', interval, fetchFn, onUpdate, compareFn = null }) {
    if (this.tasks.has(key)) {
      this.unregister(key);
    }

    const task = {
      key,
      section: Array.isArray(section) ? section : [section],
      interval: interval || 15000,
      fetchFn,
      onUpdate,
      compareFn: compareFn || this.defaultCompare.bind(this),
      lastData: null,
      timerId: null,
      isFetching: false
    };

    this.tasks.set(key, task);

    // If task belongs to active section, schedule it
    if (this.isTaskActive(task)) {
      this.scheduleTask(task);
    }
  }

  unregister(key) {
    const task = this.tasks.get(key);
    if (task) {
      if (task.timerId) clearTimeout(task.timerId);
      this.tasks.delete(key);
    }
  }

  /**
   * Updates the current active section and manages task lifecycle.
   */
  setActiveSection(sectionName) {
    const normalized = sectionName || 'overview';
    if (this.activeSection === normalized) return;

    this.activeSection = normalized;

    // Pause tasks that don't belong to the new section, resume those that do
    this.tasks.forEach(task => {
      if (this.isTaskActive(task)) {
        if (!task.timerId) {
          this.scheduleTask(task, 800); // Trigger a quick background sync shortly after entering
        }
      } else {
        if (task.timerId) {
          clearTimeout(task.timerId);
          task.timerId = null;
        }
      }
    });
  }

  isTaskActive(task) {
    if (!this.isPageVisible) return false;
    return task.section.includes('*') || task.section.includes(this.activeSection);
  }

  scheduleTask(task, delay = null) {
    if (task.timerId) clearTimeout(task.timerId);

    const wait = delay !== null ? delay : task.interval;

    task.timerId = setTimeout(async () => {
      task.timerId = null;
      if (!this.isTaskActive(task)) return;

      if (!task.isFetching) {
        task.isFetching = true;
        try {
          const freshData = await task.fetchFn();
          if (freshData !== undefined && freshData !== null) {
            const hasChanged = task.lastData !== null ? !task.compareFn(task.lastData, freshData) : false;
            task.lastData = this.cloneData(freshData);

            if (typeof task.onUpdate === 'function') {
              task.onUpdate(freshData, hasChanged);
            }
          }
        } catch (err) {
          console.warn(`[PollingService] Background poll error on '${task.key}':`, err.message || err);
        } finally {
          task.isFetching = false;
        }
      }

      // Re-schedule next run
      if (this.isTaskActive(task)) {
        this.scheduleTask(task);
      }
    }, wait);
  }

  pauseAllTasks() {
    this.tasks.forEach(task => {
      if (task.timerId) {
        clearTimeout(task.timerId);
        task.timerId = null;
      }
    });
  }

  resumeActiveTasks() {
    this.tasks.forEach(task => {
      if (this.isTaskActive(task) && !task.timerId) {
        this.scheduleTask(task, 1000);
      }
    });
  }

  stopAll() {
    this.pauseAllTasks();
    this.tasks.clear();
  }

  /**
   * Sets the initial known state for a task so the first background tick
   * properly diffs without falsely flagging existing data as changed.
   */
  seedTaskData(key, data) {
    const task = this.tasks.get(key);
    if (task) {
      task.lastData = this.cloneData(data);
    }
  }

  defaultCompare(a, b) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch (_) {
      return a === b;
    }
  }

  cloneData(data) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (_) {
      return data;
    }
  }
}

// Export a singleton instance for shared coordination across controllers
export const pollingService = new PollingService();
