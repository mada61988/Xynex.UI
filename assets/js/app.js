import { AuthModel } from './models/AuthModel.js';
import { DashboardModel } from './models/DashboardModel.js';
import { AuthView } from './views/AuthView.js';
import { DashboardView } from './views/DashboardView.js';
import { DockView } from './views/DockView.js';
import { AuthController } from './controllers/AuthController.js';
import { DashboardController } from './controllers/DashboardController.js';
import { DockController } from './controllers/DockController.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Auto-normalize 127.0.0.1 to localhost for Clerk dev instance cookie compatibility
  if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
    window.location.hostname = 'localhost';
    return;
  }

  const path = window.location.pathname;
  const isDashboard = path.includes('dashboard.html') || path.endsWith('/dashboard');

  // 1. Core Authentication & Route Protection (Required on all pages)
  const authModel = new AuthModel();
  const authView = new AuthView();
  const authController = new AuthController(authModel, authView);
  try {
    await authController.init(path);
  } catch (err) {
    console.error("Auth init error:", err);
  }

  // If redirecting unauthenticated visitor away from dashboard, avoid running dashboard controllers
  if (isDashboard && !authModel.user) {
    return;
  }

  // 2. Landing Page Layout (Dock & Drawer)
  if (document.querySelector('.awwwards-dock') || document.getElementById('mobile-drawer-toggle')) {
    const dockView = new DockView();
    const dockController = new DockController(dockView);
    dockController.init();
  }

  // 3. Dashboard Interactivity (Metrics & Sidebar)
  if (document.getElementById('sidebar')) {
    const dashboardModel = new DashboardModel();
    const dashboardView = new DashboardView();
    const dashboardController = new DashboardController(dashboardModel, dashboardView, authModel);
    dashboardController.init();
  }
});
