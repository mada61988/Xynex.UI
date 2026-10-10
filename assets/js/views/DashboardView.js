import { getAppUrl } from '../config.js';

export class DashboardView {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.backdrop = document.getElementById('sidebar-backdrop');
    this.openBtn = document.getElementById('open-sidebar-btn');
    this.closeBtn = document.getElementById('close-sidebar-btn');
    this.timeframeBtns = document.querySelectorAll('.timeframe-btn');
    this.sidebarLinks = document.querySelectorAll('.sidebar-link');
    this.overviewSection = document.getElementById('section-overview');
    this.usersSection = document.getElementById('section-users');
    this.workspacesSection = document.getElementById('section-workspaces');
    this.usersTableContainer = document.getElementById('users-table-container');
    this.usersCountBadge = document.getElementById('users-count-badge');
    this.workspacesCardsContainer = document.getElementById('workspaces-cards-container');
    this.workspacesCountBadge = document.getElementById('workspaces-count-badge');

    // Workspaces dropdown elements
    this.navbarWorkspacesContainer = document.getElementById('navbar-workspaces-container');
    this.workspacesWrapper = document.getElementById('workspaces-dropdown-wrapper') || document.getElementById('channels-dropdown-wrapper');
    this.workspacesBtn = document.getElementById('workspaces-dropdown-btn') || document.getElementById('channels-dropdown-btn');
    this.workspacesMenu = document.getElementById('workspaces-dropdown-menu') || document.getElementById('channels-dropdown-menu');
    this.workspacesList = document.getElementById('workspaces-dropdown-list') || document.getElementById('channels-dropdown-list');
    this.selectedWorkspaceIcon = document.getElementById('selected-workspace-icon') || document.getElementById('selected-channel-icon');
    this.selectedWorkspaceName = document.getElementById('selected-workspace-name') || document.getElementById('selected-channel-name');
    this.selectedWorkspaceId = 'all';
    this.onWorkspaceSelectCallback = null;

    // Page-level centered loading overlay
    this.pageLoadingOverlay = document.getElementById('page-loading-overlay');
    this.pageLoadingText = document.getElementById('page-loading-text');

    // Master-Detail Workspace Detail elements
    this.workspaceDetailSection = document.getElementById('section-workspace-detail');
    this.workspaceBreadcrumbs = document.getElementById('workspace-breadcrumbs');
    this.workspaceDetailContent = document.getElementById('workspace-detail-content');
    this.navbarBreadcrumbsContainer = document.getElementById('navbar-breadcrumbs-container');
    this.modalContainer = document.getElementById('modal-container');
    this.onBreadcrumbNavigate = null;

    // Callbacks for role editing
    this.onEditRoleClick = null;
    this.onSaveRoleClick = null;

    this._bindWorkspacesDropdownEvents();
    this._bindSidebarLogout();
  }

  _bindSidebarLogout() {
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.Clerk) {
          try {
            await window.Clerk.signOut();
          } catch (_) {}
        }
        window.location.href = getAppUrl('signin.html');
      });
    }
  }

  showPageLoading(message = "Syncing workspace data...") {
    if (this.pageLoadingText && message) {
      this.pageLoadingText.textContent = message;
    }
    if (this.pageLoadingOverlay) {
      this.pageLoadingOverlay.classList.remove('hidden');
    }
  }

  hidePageLoading() {
    if (this.pageLoadingOverlay) {
      this.pageLoadingOverlay.classList.add('hidden');
    }
  }

  bindCreateWorkspace({ onSubmit, onCancel }) {
    const form = document.getElementById('form-create-workspace');
    const nameInput = document.getElementById('create-workspace-name');
    const metaIdInput = document.getElementById('create-workspace-meta-id');
    const metaSecretInput = document.getElementById('create-workspace-meta-secret');
    const serviceTypeSelect = document.getElementById('create-workspace-service-type');
    const currencySelect = document.getElementById('create-workspace-currency');
    const submitBtn = document.getElementById('create-workspace-submit-btn');
    const toggleSecretBtn = document.getElementById('toggle-secret-visibility-btn');
    const cancelBtn = document.getElementById('back-to-workspaces-btn');

    if (!form || !submitBtn) return;

    // Real-time validation
    const checkFormValidity = () => {
      const name = nameInput.value.trim();
      const metaAppId = metaIdInput.value.trim();
      const metaAppSecret = metaSecretInput.value.trim();
      const serviceType = serviceTypeSelect.value;
      const currencyCode = currencySelect.value;
      const isValid = Boolean(name && metaAppId && metaAppSecret && serviceType && currencyCode);

      if (isValid && !submitBtn.dataset.loading) {
        submitBtn.disabled = false;
        submitBtn.className = "w-full sm:w-auto px-7 py-3 rounded-xl font-semibold bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm transition transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 cursor-pointer";
      } else {
        submitBtn.disabled = true;
        submitBtn.className = "w-full sm:w-auto px-7 py-3 rounded-xl font-semibold bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed border border-zinc-700 text-xs sm:text-sm transition flex items-center justify-center gap-2";
      }
    };

    [nameInput, metaIdInput, metaSecretInput].forEach(el => el.addEventListener('input', checkFormValidity));
    [serviceTypeSelect, currencySelect].forEach(el => el.addEventListener('change', checkFormValidity));

    // Secret visibility toggle
    if (toggleSecretBtn) {
      toggleSecretBtn.addEventListener('click', () => {
        const type = metaSecretInput.getAttribute('type') === 'password' ? 'text' : 'password';
        metaSecretInput.setAttribute('type', type);
        toggleSecretBtn.innerHTML = type === 'password' 
          ? '<i class="fa-regular fa-eye text-xs"></i>' 
          : '<i class="fa-regular fa-eye-slash text-xs"></i>';
      });
    }

    // Submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn.disabled) return;
      
      const payload = {
        name: nameInput.value.trim(),
        metaAppId: metaIdInput.value.trim(),
        metaAppSecret: metaSecretInput.value.trim(),
        serviceType: serviceTypeSelect.value,
        currencyCode: currencySelect.value
      };
      
      if (onSubmit) onSubmit(payload);
    });

    if (cancelBtn && onCancel) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onCancel();
      });
    }
  }

  setCreateWorkspaceLoading(isLoading) {
    const submitBtn = document.getElementById('create-workspace-submit-btn');
    if (!submitBtn) return;

    if (isLoading) {
      submitBtn.dataset.loading = "true";
      submitBtn.disabled = true;
      submitBtn.className = "w-full sm:w-auto px-7 py-3 rounded-xl font-semibold bg-zinc-800 text-white opacity-80 cursor-wait border border-zinc-700 text-xs sm:text-sm transition flex items-center justify-center gap-2";
      submitBtn.innerHTML = `
        <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Creating Workspace...</span>
      `;
    } else {
      delete submitBtn.dataset.loading;
      submitBtn.innerHTML = `
        <i class="fa-solid fa-plus text-xs"></i>
        <span>Create Workspace</span>
      `;
      // Dispatch input event to re-evaluate validity
      const nameInput = document.getElementById('create-workspace-name');
      if (nameInput) nameInput.dispatchEvent(new Event('input'));
    }
  }

  showCreateWorkspaceFeedback({ type, message }) {
    const fb = document.getElementById('create-workspace-feedback');
    if (!fb) return;

    fb.classList.remove('hidden');
    if (type === 'success') {
      fb.className = "mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3";
      fb.innerHTML = `
        <i class="fa-solid fa-circle-check text-emerald-400"></i>
        <span class="text-xs font-semibold text-emerald-300">${this._escape(message)}</span>
      `;
    } else {
      fb.className = "mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3";
      fb.innerHTML = `
        <i class="fa-solid fa-circle-exclamation text-rose-400"></i>
        <span class="text-xs font-semibold text-rose-300">${this._escape(message)}</span>
      `;
    }
  }

  resetCreateWorkspaceForm() {
    const form = document.getElementById('form-create-workspace');
    if (form) form.reset();
    
    const fb = document.getElementById('create-workspace-feedback');
    if (fb) fb.classList.add('hidden');

    const submitBtn = document.getElementById('create-workspace-submit-btn');
    if (submitBtn) {
      delete submitBtn.dataset.loading;
      submitBtn.disabled = true;
      submitBtn.className = "w-full sm:w-auto px-7 py-3 rounded-xl font-semibold bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed border border-zinc-700 text-xs sm:text-sm transition flex items-center justify-center gap-2";
      submitBtn.innerHTML = `
        <i class="fa-solid fa-plus text-xs"></i>
        <span>Create Workspace</span>
      `;
    }
  }

  _bindWorkspacesDropdownEvents() {
    if (this.workspacesBtn && this.workspacesMenu) {
      this.workspacesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.workspacesMenu.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (this.workspacesWrapper && !this.workspacesWrapper.contains(e.target)) {
          this.workspacesMenu.classList.add('hidden');
        }
      });
    }

    if (this.workspacesList) {
      this.workspacesList.addEventListener('click', (e) => {
        const item = e.target.closest('.workspace-item');
        if (item) {
          const workspaceId = item.dataset.workspaceId === 'all' ? 'all' : (Number(item.dataset.workspaceId) || item.dataset.workspaceId);
          const name = item.dataset.name;

          this.selectedWorkspaceId = workspaceId;
          if (this.selectedWorkspaceIcon) {
            this.selectedWorkspaceIcon.innerHTML = workspaceId === 'all'
              ? `<i class="fa-solid fa-layer-group text-zinc-300"></i>`
              : `<i class="fa-solid fa-briefcase text-zinc-300"></i>`;
          }
          if (this.selectedWorkspaceName) {
            this.selectedWorkspaceName.textContent = name;
          }
          if (this.workspacesMenu) {
            this.workspacesMenu.classList.add('hidden');
          }

          this.workspacesList.querySelectorAll('.workspace-item').forEach(btn => {
            if (btn === item) {
              btn.classList.add('bg-zinc-800/90', 'text-white', 'font-semibold');
              btn.classList.remove('text-zinc-300');
            } else {
              btn.classList.remove('bg-zinc-800/90', 'text-white', 'font-semibold');
              btn.classList.add('text-zinc-300');
            }
          });

          if (this.onWorkspaceSelectCallback) {
            this.onWorkspaceSelectCallback(workspaceId);
          }
        }
      });
    }
  }

  bindSidebarToggle(handler) {
    if (this.openBtn) this.openBtn.addEventListener('click', () => handler(true));
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => handler(false));
    if (this.backdrop) this.backdrop.addEventListener('click', () => handler(false));
  }

  toggleSidebar(isOpen) {
    if (!this.sidebar || !this.backdrop) return;
    if (isOpen) {
      this.sidebar.classList.remove('-translate-x-full');
      this.backdrop.classList.remove('hidden');
    } else {
      this.sidebar.classList.add('-translate-x-full');
      this.backdrop.classList.add('hidden');
    }
  }

  bindTimeframeSelection(handler) {
    this.timeframeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._resetTimeframeStyles();
        e.target.classList.add('text-white', 'font-semibold', 'bg-zinc-800', 'shadow-sm');
        e.target.classList.remove('text-zinc-400', 'hover:text-white');
        handler(e.target.textContent.trim());
      });
    });
  }

  _resetTimeframeStyles() {
    this.timeframeBtns.forEach(b => {
      b.classList.remove('text-white', 'font-semibold', 'bg-zinc-800', 'shadow-sm');
      b.classList.add('text-zinc-400', 'hover:text-white');
    });
  }

  bindNavigation(handler) {
    this.sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = href.replace('#', '');
          this.setActiveSidebarLink(target);
          if (window.innerWidth < 1024) {
            this.toggleSidebar(false);
          }
          handler(target);
        }
      });
    });
  }

  setActiveSidebarLink(targetSection) {
    this.sidebarLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isTarget = href === `#${targetSection}`;

      if (isTarget) {
        link.classList.add('active', 'text-white', 'font-semibold');
        link.classList.remove('text-zinc-400', 'font-medium');
      } else {
        link.classList.remove('active', 'text-white', 'font-semibold');
        link.classList.add('text-zinc-400', 'font-medium');
      }
    });
  }

  showSection(sectionName) {
    if (this.overviewSection) this.overviewSection.classList.add('hidden');
    if (this.usersSection) this.usersSection.classList.add('hidden');
    if (this.workspacesSection) this.workspacesSection.classList.add('hidden');
    if (this.workspaceDetailSection) this.workspaceDetailSection.classList.add('hidden');

    const isOverview = (sectionName === 'overview' || !sectionName || sectionName === '');

    if (sectionName === 'users') {
      if (this.usersSection) this.usersSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Users Directory', icon: '<i class="fa-solid fa-user text-xs text-zinc-400"></i>' }
      ]);
    } else if (sectionName === 'workspaces' || sectionName === 'chatbots') {
      if (this.workspacesSection) this.workspacesSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Workspaces', icon: '<i class="fa-solid fa-layer-group text-xs text-zinc-400"></i>' }
      ]);
    } else if (sectionName === 'workspace-detail') {
      if (this.workspaceDetailSection) this.workspaceDetailSection.classList.remove('hidden');
    } else {
      if (this.overviewSection) this.overviewSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([]);
    }

    // Workspaces dropdown menu is visible on the overview tab only
    const navDropdown = this.navbarWorkspacesContainer || document.getElementById('navbar-workspaces-container');
    if (navDropdown) {
      if (isOverview) {
        navDropdown.classList.remove('hidden');
        navDropdown.classList.add('flex');
      } else {
        navDropdown.classList.add('hidden');
        navDropdown.classList.remove('flex');
      }
    }

    // Header breadcrumbs container is visible on all tabs EXCEPT Overview
    const breadcrumbNav = this.navbarBreadcrumbsContainer || document.getElementById('navbar-breadcrumbs-container');
    if (breadcrumbNav) {
      if (isOverview) {
        breadcrumbNav.classList.add('hidden');
        breadcrumbNav.classList.remove('flex');
      } else {
        breadcrumbNav.classList.remove('hidden');
        breadcrumbNav.classList.add('flex');
      }
    }

    this.setActiveSidebarLink(sectionName === 'workspace-detail' ? 'workspaces' : sectionName);
  }

  renderHeaderBreadcrumbs(items = []) {
    const container = this.navbarBreadcrumbsContainer || document.getElementById('navbar-breadcrumbs-container');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = '';
      return;
    }

    const html = items.map((item, idx) => {
      const isFirst = idx === 0;

      let itemHtml = '';
      if (item.action || item.target) {
        itemHtml = `
          <button 
            type="button" 
            class="header-breadcrumb-btn hover:text-white transition flex items-center gap-1.5 cursor-pointer text-zinc-400"
            data-target="${this._escape(item.target || item.action)}"
            ${item.workspaceId ? `data-workspace-id="${this._escape(item.workspaceId)}"` : ''}
          >
            ${item.icon ? item.icon : (isFirst ? '<i class="fa-solid fa-layer-group text-xs text-zinc-400"></i>' : '')}
            <span>${this._escape(item.label)}</span>
          </button>
        `;
      } else {
        itemHtml = `
          <span class="text-white font-semibold flex items-center gap-1.5">
            ${item.icon ? item.icon : ''}
            <span>${this._escape(item.label)}</span>
          </span>
        `;
      }

      return `
        ${idx > 0 ? '<i class="fa-solid fa-chevron-right text-[10px] text-zinc-600"></i>' : ''}
        ${itemHtml}
      `;
    }).join('');

    container.innerHTML = html;

    // Attach click events on header breadcrumb buttons
    container.querySelectorAll('.header-breadcrumb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const wsId = btn.dataset.workspaceId;
        if (this.onBreadcrumbNavigate) {
          this.onBreadcrumbNavigate(target, wsId);
        }
      });
    });
  }

  renderMetrics(metrics) {
    console.log("DashboardView: Telemetry ready.");
  }

  setChannelsLoading() {
    const card = document.getElementById('card-metric-channels') || document.getElementById('card-metric-profiles');
    const icon = document.getElementById('icon-metric-channels') || document.getElementById('icon-metric-profiles');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const elCount = document.getElementById('metric-channels-count') || document.getElementById('metric-profiles-count');
    if (elCount) {
      elCount.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      elCount.innerHTML = `
        <span class="inline-flex items-center gap-2">
          <svg class="animate-spin h-6 w-6 text-zinc-400 inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      `;
    }

    const elPercentage = document.getElementById('metric-channels-percentage') || document.getElementById('metric-profiles-percentage');
    if (elPercentage) {
      elPercentage.className = "text-zinc-500 font-medium flex items-center gap-1";
      elPercentage.textContent = "Connecting to API...";
    }
  }

  setProfilesLoading() {
    this.setChannelsLoading();
  }

  renderChannelsMetric({ totalChannels, activeChannels, percentageOperational, total, active, percentage }) {
    const card = document.getElementById('card-metric-channels') || document.getElementById('card-metric-profiles');
    const icon = document.getElementById('icon-metric-channels') || document.getElementById('icon-metric-profiles');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const elCount = document.getElementById('metric-channels-count') || document.getElementById('metric-profiles-count');
    const elPercentage = document.getElementById('metric-channels-percentage') || document.getElementById('metric-profiles-percentage');
    const elSubtext = document.getElementById('metric-channels-subtext') || document.getElementById('metric-profiles-subtext');

    const tot = totalChannels !== undefined ? totalChannels : (total ?? 0);
    const act = activeChannels !== undefined ? activeChannels : (active ?? 0);
    const pct = percentageOperational !== undefined ? percentageOperational : (percentage ?? (tot > 0 ? Math.round((act / tot) * 100) : 0));

    if (elCount) {
      elCount.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      elCount.textContent = `${tot} / ${act}`;
    }

    if (elPercentage) {
      elPercentage.innerHTML = `
        <i class="fa-solid fa-circle-check text-[10px]"></i> ${pct}% Operational
      `;
      if (pct > 0) {
        elPercentage.className = "text-emerald-400 font-semibold flex items-center gap-1";
      } else {
        elPercentage.className = "text-zinc-400 font-semibold flex items-center gap-1";
      }
    }

    if (elSubtext) {
      elSubtext.textContent = `· ${act} Active of ${tot}`;
    }
  }

  renderProfilesMetric(args) {
    this.renderChannelsMetric(args);
  }

  renderChannelsError(errorMessage) {
    const card = document.getElementById('card-metric-channels') || document.getElementById('card-metric-profiles');
    const icon = document.getElementById('icon-metric-channels') || document.getElementById('icon-metric-profiles');
    if (card) card.classList.add('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 transition";
    }

    const elCount = document.getElementById('metric-channels-count') || document.getElementById('metric-profiles-count');
    const elPercentage = document.getElementById('metric-channels-percentage') || document.getElementById('metric-profiles-percentage');
    const elSubtext = document.getElementById('metric-channels-subtext') || document.getElementById('metric-profiles-subtext');

    if (elCount) {
      elCount.className = "text-2xl font-bold text-rose-400 tracking-tight mb-2 flex items-center gap-2";
      elCount.innerHTML = `
        <i class="fa-solid fa-circle-exclamation text-lg"></i>
        <span>Unavailable</span>
      `;
    }

    if (elPercentage) {
      elPercentage.className = "text-rose-400 font-medium flex items-center gap-1.5 truncate max-w-[220px]";
      elPercentage.title = errorMessage || 'Server did not respond';
      elPercentage.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>
        <span class="truncate text-xs">${this._escape(errorMessage || 'Server did not respond')}</span>
      `;
    }

    if (elSubtext) {
      elSubtext.textContent = '';
    }
  }

  renderProfilesError(errorMessage) {
    this.renderChannelsError(errorMessage);
  }

  renderWorkspacesDropdown(profiles, errorMessage = null, onSelect = null) {
    if (onSelect) {
      this.onWorkspaceSelectCallback = onSelect;
    }

    if (!this.workspacesList || !this.selectedWorkspaceName) return;

    if (errorMessage || !profiles || profiles.length === 0) {
      if (this.selectedWorkspaceIcon) {
        this.selectedWorkspaceIcon.innerHTML = `<i class="fa-solid fa-layer-group text-zinc-500"></i>`;
      }
      this.selectedWorkspaceName.textContent = errorMessage ? 'Workspace Error' : 'No Workspaces';
      this.workspacesList.innerHTML = `
        <div class="px-3 py-2 text-xs text-zinc-500 text-center">
          ${this._escape(errorMessage || 'No workspaces available')}
        </div>
      `;
      return;
    }

    if (!this.selectedWorkspaceId) {
      this.selectedWorkspaceId = 'all';
    }

    const isAllSelected = this.selectedWorkspaceId === 'all';
    let selectedProfile = null;

    if (isAllSelected) {
      if (this.selectedWorkspaceIcon) {
        this.selectedWorkspaceIcon.innerHTML = `<i class="fa-solid fa-layer-group text-zinc-300"></i>`;
      }
      this.selectedWorkspaceName.textContent = 'All Workspaces';
    } else {
      selectedProfile = profiles.find(p => p.id === this.selectedWorkspaceId);
      if (selectedProfile) {
        if (this.selectedWorkspaceIcon) {
          this.selectedWorkspaceIcon.innerHTML = `<i class="fa-solid fa-briefcase text-zinc-300"></i>`;
        }
        this.selectedWorkspaceName.textContent = selectedProfile.name || `Profile #${selectedProfile.id}`;
      } else {
        this.selectedWorkspaceId = 'all';
        if (this.selectedWorkspaceIcon) {
          this.selectedWorkspaceIcon.innerHTML = `<i class="fa-solid fa-layer-group text-zinc-300"></i>`;
        }
        this.selectedWorkspaceName.textContent = 'All Workspaces';
      }
    }

    // 1. "All Workspaces" option at the top of the list
    const allOptionHtml = `
      <button 
        type="button" 
        class="workspace-item w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-zinc-800/70 transition text-left cursor-pointer ${isAllSelected ? 'bg-zinc-800/90 text-white font-semibold' : 'text-zinc-300'}"
        data-workspace-id="all"
        data-name="All Workspaces"
      >
        <div class="flex items-center gap-2.5 min-w-0 pr-2">
          <span class="text-sm shrink-0"><i class="fa-solid fa-layer-group text-zinc-300"></i></span>
          <div class="truncate">
            <div class="truncate text-white font-medium">All Workspaces</div>
            <div class="text-[10px] text-zinc-500">Overall profiles view</div>
          </div>
        </div>
        <div class="shrink-0">
          <span class="text-[10px] font-semibold text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
            ${profiles.length} Total
          </span>
        </div>
      </button>
      <div class="border-t border-zinc-800/80 my-1"></div>
    `;

    // 2. Individual profile workspace options
    const profilesHtml = profiles.map(p => {
      const name = p.name || `Profile #${p.id}`;
      const isSelected = p.id === this.selectedWorkspaceId;
      const isActiveStatus = String(p.status || '').toLowerCase() === 'active';
      const statusBadge = isActiveStatus
        ? `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold"><span class="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>Active</span>`
        : `<span class="inline-flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60"><span class="w-1 h-1 rounded-full bg-zinc-500"></span>Offline</span>`;

      const channelCount = Array.isArray(p.channels) ? p.channels.length : 0;

      return `
        <button 
          type="button" 
          class="workspace-item w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-zinc-800/70 transition text-left cursor-pointer ${isSelected ? 'bg-zinc-800/90 text-white font-semibold' : 'text-zinc-300'}"
          data-workspace-id="${p.id}"
          data-name="${this._escape(name)}"
        >
          <div class="flex items-center gap-2.5 min-w-0 pr-2">
            <span class="text-sm shrink-0"><i class="fa-solid fa-briefcase text-zinc-400"></i></span>
            <div class="truncate">
              <div class="truncate text-white font-medium">${this._escape(name)}</div>
              <div class="text-[10px] text-zinc-500">${channelCount} ${channelCount === 1 ? 'Channel' : 'Channels'}</div>
            </div>
          </div>
          <div class="shrink-0">
            ${statusBadge}
          </div>
        </button>
      `;
    }).join('');

    this.workspacesList.innerHTML = allOptionHtml + profilesHtml;
  }

  renderChannelsDropdown(profiles, errorMessage = null) {
    this.renderWorkspacesDropdown(profiles, errorMessage);
  }

  _getChannelIcon(channel) {
    const ch = String(channel || '').toLowerCase().trim();
    switch (ch) {
      case 'all':
        return `<i class="fa-solid fa-layer-group text-zinc-300"></i>`;
      case 'instagram':
        return `<i class="fa-brands fa-instagram text-pink-500"></i>`;
      case 'facebook':
        return `<i class="fa-brands fa-facebook text-blue-500"></i>`;
      case 'whatsapp':
        return `<i class="fa-brands fa-whatsapp text-emerald-400"></i>`;
      case 'telegram':
        return `<i class="fa-brands fa-telegram text-sky-400"></i>`;
      case 'webchat':
        return `<i class="fa-solid fa-comments text-amber-400"></i>`;
      default:
        return `<i class="fa-solid fa-circle-nodes text-zinc-400"></i>`;
    }
  }

  renderMessagesCount(count) {
    const card = document.getElementById('card-metric-messages');
    const icon = document.getElementById('icon-metric-messages');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const el = document.getElementById('metric-messages-handled');
    const elTrend = document.getElementById('metric-messages-trend');
    if (el) {
      el.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      el.textContent = typeof count === 'number' ? count.toLocaleString() : count;
    }
    if (elTrend) {
      elTrend.className = "text-emerald-400 font-semibold flex items-center gap-1";
      elTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-up text-[10px]"></i> Live Synced`;
    }
  }

  updateMessagesLastSynced(seconds) {
    const elSynced = document.getElementById('metric-messages-last-synced');
    if (elSynced) {
      const sec = Math.max(0, Number(seconds) || 0);
      const unit = sec === 1 ? 'second' : 'seconds';
      elSynced.textContent = `· last synced ${sec} ${unit}`;
    }
  }

  setMessagesCountLoading() {
    const card = document.getElementById('card-metric-messages');
    const icon = document.getElementById('icon-metric-messages');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const el = document.getElementById('metric-messages-handled');
    if (el) {
      el.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      el.innerHTML = `
        <span class="inline-flex items-center gap-2">
          <svg class="animate-spin h-6 w-6 text-zinc-400 inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      `;
    }
    const elTrend = document.getElementById('metric-messages-trend');
    if (elTrend) {
      elTrend.className = "text-zinc-500 font-medium flex items-center gap-0.5";
      elTrend.textContent = "Querying count...";
    }
    const elSynced = document.getElementById('metric-messages-last-synced');
    if (elSynced) {
      elSynced.textContent = '';
    }
  }

  renderMessagesCountError(errorMessage) {
    const card = document.getElementById('card-metric-messages');
    const icon = document.getElementById('icon-metric-messages');
    if (card) card.classList.add('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 transition";
    }

    const elCount = document.getElementById('metric-messages-handled');
    const elTrend = document.getElementById('metric-messages-trend');
    const elSynced = document.getElementById('metric-messages-last-synced');

    if (elCount) {
      elCount.className = "text-2xl font-bold text-rose-400 tracking-tight mb-2 flex items-center gap-2";
      elCount.innerHTML = `
        <i class="fa-solid fa-circle-exclamation text-lg"></i>
        <span>Unavailable</span>
      `;
    }

    if (elTrend) {
      elTrend.className = "text-rose-400 font-medium flex items-center gap-1.5 truncate max-w-[220px]";
      elTrend.title = errorMessage || 'Server did not respond';
      elTrend.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>
        <span class="truncate text-xs">${this._escape(errorMessage || 'Server did not respond')}</span>
      `;
    }

    if (elSynced) {
      elSynced.textContent = '';
    }
  }

  renderDmToCheckout(percentage) {
    const card = document.getElementById('card-metric-conversion');
    const icon = document.getElementById('icon-metric-conversion');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const elRate = document.getElementById('metric-conversion-rate');
    const elTrend = document.getElementById('metric-conversion-trend');
    const elSubtext = document.getElementById('metric-conversion-subtext');

    if (elRate) {
      elRate.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      elRate.textContent = `${percentage}%`;
    }

    if (elTrend) {
      elTrend.className = "text-emerald-400 font-semibold flex items-center gap-1";
      elTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-up text-[10px]"></i> Live Synced`;
    }

    if (elSubtext) {
      elSubtext.textContent = '· Checkout conversion';
    }
  }

  setDmToCheckoutLoading() {
    const card = document.getElementById('card-metric-conversion');
    const icon = document.getElementById('icon-metric-conversion');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const elRate = document.getElementById('metric-conversion-rate');
    const elTrend = document.getElementById('metric-conversion-trend');

    if (elRate) {
      elRate.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      elRate.innerHTML = `
        <span class="inline-flex items-center gap-2">
          <svg class="animate-spin h-6 w-6 text-zinc-400 inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      `;
    }

    if (elTrend) {
      elTrend.className = "text-zinc-500 font-medium flex items-center gap-1";
      elTrend.textContent = "Querying rate...";
    }
  }

  renderDmToCheckoutError(errorMessage) {
    const card = document.getElementById('card-metric-conversion');
    const icon = document.getElementById('icon-metric-conversion');
    if (card) card.classList.add('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 transition";
    }

    const elRate = document.getElementById('metric-conversion-rate');
    const elTrend = document.getElementById('metric-conversion-trend');
    const elSubtext = document.getElementById('metric-conversion-subtext');

    if (elRate) {
      elRate.className = "text-2xl font-bold text-rose-400 tracking-tight mb-2 flex items-center gap-2";
      elRate.innerHTML = `
        <i class="fa-solid fa-circle-exclamation text-lg"></i>
        <span>Unavailable</span>
      `;
    }

    if (elTrend) {
      elTrend.className = "text-rose-400 font-medium flex items-center gap-1.5 truncate max-w-[220px]";
      elTrend.title = errorMessage || 'Server did not respond';
      elTrend.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>
        <span class="truncate text-xs">${this._escape(errorMessage || 'Server did not respond')}</span>
      `;
    }

    if (elSubtext) {
      elSubtext.textContent = '';
    }
  }

  renderTotalSales({ formattedSales, currency }) {
    const card = document.getElementById('card-metric-sales');
    const icon = document.getElementById('icon-metric-sales');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const elSales = document.getElementById('metric-total-sales');
    const elTrend = document.getElementById('metric-sales-trend');
    const elSubtext = document.getElementById('metric-sales-subtext');

    if (elSales) {
      elSales.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      elSales.textContent = formattedSales || '$0';
    }

    if (elTrend) {
      elTrend.className = "text-emerald-400 font-semibold flex items-center gap-1";
      elTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-up text-[10px]"></i> Live Synced`;
    }

    if (elSubtext) {
      elSubtext.textContent = `· ${currency || 'USD'} total`;
    }
  }

  setTotalSalesLoading() {
    const card = document.getElementById('card-metric-sales');
    const icon = document.getElementById('icon-metric-sales');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const elSales = document.getElementById('metric-total-sales');
    const elTrend = document.getElementById('metric-sales-trend');

    if (elSales) {
      elSales.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      elSales.innerHTML = `
        <span class="inline-flex items-center gap-2">
          <svg class="animate-spin h-6 w-6 text-zinc-400 inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      `;
    }

    if (elTrend) {
      elTrend.className = "text-zinc-500 font-medium flex items-center gap-1";
      elTrend.textContent = "Querying sales...";
    }
  }

  renderTotalSalesError(errorMessage) {
    const card = document.getElementById('card-metric-sales');
    const icon = document.getElementById('icon-metric-sales');
    if (card) card.classList.add('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 transition";
    }

    const elSales = document.getElementById('metric-total-sales');
    const elTrend = document.getElementById('metric-sales-trend');
    const elSubtext = document.getElementById('metric-sales-subtext');

    if (elSales) {
      elSales.className = "text-2xl font-bold text-rose-400 tracking-tight mb-2 flex items-center gap-2";
      elSales.innerHTML = `
        <i class="fa-solid fa-circle-exclamation text-lg"></i>
        <span>Unavailable</span>
      `;
    }

    if (elTrend) {
      elTrend.className = "text-rose-400 font-medium flex items-center gap-1.5 truncate max-w-[220px]";
      elTrend.title = errorMessage || 'Server did not respond';
      elTrend.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>
        <span class="truncate text-xs">${this._escape(errorMessage || 'Server did not respond')}</span>
      `;
    }

    if (elSubtext) {
      elSubtext.textContent = '';
    }
  }

  setOrdersLoading() {
    const statusBadge = document.getElementById('orders-status-badge');
    const feed = document.getElementById('orders-feed-container');

    if (statusBadge) {
      statusBadge.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span id="orders-count-text">Syncing...</span>
      `;
    }

    if (feed) {
      feed.innerHTML = `
        <div class="py-12 flex flex-col items-center justify-center text-center text-zinc-500 gap-3">
          <svg class="animate-spin h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-xs">Loading placed orders...</span>
        </div>
      `;
    }
  }

  renderPlacedOrders(orders) {
    const statusBadge = document.getElementById('orders-status-badge');
    const feed = document.getElementById('orders-feed-container');
    const revenueEl = document.getElementById('orders-total-revenue');

    if (!Array.isArray(orders) || orders.length === 0) {
      if (statusBadge) {
        statusBadge.innerHTML = `
          <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
          <span>0 Orders</span>
        `;
      }
      if (revenueEl) revenueEl.textContent = 'Total: $0.00';
      if (feed) {
        feed.innerHTML = `
          <div class="py-12 flex flex-col items-center justify-center text-center text-zinc-500 gap-2">
            <i class="fa-solid fa-box-open text-3xl mb-1 text-zinc-600"></i>
            <span class="text-sm font-semibold text-zinc-300">No placed orders found</span>
            <span class="text-xs text-zinc-500">Orders placed by customers will appear here in real-time.</span>
          </div>
        `;
      }
      return;
    }

    const totalRev = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
    if (revenueEl) {
      revenueEl.textContent = `Total: $${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (statusBadge) {
      statusBadge.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>${orders.length} Confirmed</span>
      `;
    }

    if (feed) {
      feed.innerHTML = orders.map(order => {
        const dateStr = this._formatTimeAgo(order.createdAt);
        const senderDisplay = order.senderId 
          ? `@${this._escape(order.senderId.replace(/^U_\d+_/, ''))}` 
          : 'Customer';

        const itemsSummary = (order.items || []).map(item => `
          <div class="flex items-center gap-2 text-xs flex-wrap">
            <span class="text-white font-medium">${this._escape(item.productName)}</span>
            <span class="text-zinc-500 font-mono text-[11px]">(×${item.quantity})</span>
            ${item.sku ? `<span class="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">${this._escape(item.sku)}</span>` : ''}
          </div>
        `).join('');

        const statusClass = String(order.status || '').toUpperCase() === 'CONFIRMED'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

        return `
          <div class="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-zinc-800/30 p-3 rounded-2xl transition-all duration-200">
            <div class="flex items-start gap-3.5 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 shadow-sm mt-0.5">
                <i class="fa-solid fa-receipt text-sm"></i>
              </div>
              <div class="min-w-0 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-white">Order #${order.id}</span>
                  <span class="text-xs text-zinc-400 font-mono">${senderDisplay}</span>
                  <span class="text-[10px] text-zinc-500">· ${dateStr}</span>
                </div>
                <div class="space-y-0.5">
                  ${itemsSummary}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
              <span class="text-xs px-2.5 py-1 rounded-lg border font-semibold uppercase tracking-wider ${statusClass}">
                ${this._escape(order.status || 'Confirmed')}
              </span>
              <span class="text-sm font-mono font-bold text-white">$${Number(order.totalPrice || 0).toFixed(2)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderPlacedOrdersError(errorMessage) {
    const statusBadge = document.getElementById('orders-status-badge');
    const feed = document.getElementById('orders-feed-container');
    const revenueEl = document.getElementById('orders-total-revenue');

    if (statusBadge) {
      statusBadge.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        <span class="text-rose-400">Error</span>
      `;
    }

    if (revenueEl) revenueEl.textContent = '';

    if (feed) {
      feed.innerHTML = `
        <div class="py-10 flex flex-col items-center justify-center text-center text-rose-400 gap-2">
          <i class="fa-solid fa-triangle-exclamation text-2xl mb-1"></i>
          <span class="text-xs font-semibold">${this._escape(errorMessage || 'Failed to load placed orders')}</span>
          <span class="text-[11px] text-zinc-500">Could not retrieve orders from server.</span>
        </div>
      `;
    }
  }

  _formatTimeAgo(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
  }

  renderUsersLoading() {
    if (this.usersCountBadge) {
      this.usersCountBadge.textContent = 'Syncing...';
    }
    if (this.usersTableContainer) {
      this.usersTableContainer.innerHTML = `
        <div class="bento-card rounded-3xl p-12 flex flex-col items-center justify-center gap-4 text-center">
          <svg class="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div class="text-sm font-semibold text-zinc-300">Fetching workspace users...</div>
          <div class="text-xs text-zinc-500">Querying fetchUsers API service</div>
        </div>
      `;
    }
  }

  renderUsersError({ status, message }, onRetry = null) {
    if (this.usersCountBadge) {
      this.usersCountBadge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span class="text-rose-400 font-semibold">${status ? `HTTP ${status}` : 'Access Error'}</span>
      `;
    }

    if (!this.usersTableContainer) return;

    const statusCode = Number(status) || 0;
    const isAuthError = statusCode === 401 || statusCode === 403 || 
      String(message).toLowerCase().includes('unauthorized') || 
      String(message).toLowerCase().includes('forbidden');

    let badgeText = `HTTP ${statusCode || 500}`;
    let errorTitle = 'Unable to Load User Directory';
    let errorDesc = 'The backend server encountered an issue while processing the user directory request.';

    if (statusCode === 403) {
      badgeText = '403 Forbidden';
      errorTitle = 'Access Restricted';
      errorDesc = 'Your authenticated account does not have sufficient administrative privileges to view or manage workspace user records.';
    } else if (statusCode === 401) {
      badgeText = '401 Unauthorized';
      errorTitle = 'Authentication Required';
      errorDesc = 'The backend API rejected the request because a valid authentication token was not provided or has expired.';
    }

    this.usersTableContainer.innerHTML = `
      <div class="bento-card rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col items-center text-center shadow-2xl border border-rose-500/20">
        <!-- Ambient Radial Background Glow -->
        <div class="absolute -top-24 -right-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Glowing Icon Badge -->
        <div class="relative w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 shadow-xl shadow-rose-950/40">
          <i class="${isAuthError ? 'fa-solid fa-shield-halved' : 'fa-solid fa-triangle-exclamation'} text-2xl"></i>
          <span class="absolute -top-1 -right-1 flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </div>

        <!-- Status Tag -->
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono mb-3">
          <i class="fa-solid fa-lock text-[10px]"></i>
          <span>${badgeText}</span>
        </span>

        <!-- Title & Subtitle -->
        <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2">
          ${errorTitle}
        </h2>
        <p class="text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed mb-6">
          ${errorDesc}
        </p>

        <!-- High-End Terminal-Style Server Message Box -->
        <div class="w-full max-w-lg bg-[#0d0d10] border border-zinc-800 rounded-2xl p-4 sm:p-5 text-left shadow-inner mb-8">
          <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span class="text-zinc-400 font-semibold">Server Response Payload</span>
            </div>
            <span class="text-zinc-600 font-mono">/users/</span>
          </div>
          <div class="font-mono text-xs text-rose-300/90 leading-relaxed break-words bg-[#111114] p-3.5 rounded-xl border border-zinc-800/80">
            <span class="text-zinc-600 select-none">&gt; </span>${this._escape(message)}
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button 
            type="button" 
            id="retry-fetch-users-btn"
            class="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition transform hover:scale-[1.02] shadow-lg cursor-pointer"
          >
            <i class="fa-solid fa-rotate-right text-xs"></i>
            <span>Try Again</span>
          </button>
          
          <button 
            type="button"
            id="error-back-overview-btn"
            class="inline-flex items-center gap-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <i class="fa-solid fa-chart-pie text-xs"></i>
            <span>Back to Overview</span>
          </button>
        </div>
      </div>
    `;

    // Bind retry button
    const retryBtn = document.getElementById('retry-fetch-users-btn');
    if (retryBtn && onRetry) {
      retryBtn.addEventListener('click', () => onRetry());
    }

    // Bind back to overview button
    const backBtn = document.getElementById('error-back-overview-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const overviewLink = document.querySelector('a[href="#overview"]');
        if (overviewLink) {
          overviewLink.click();
        } else {
          this.showSection('overview');
        }
      });
    }
  }

  bindRoleActions({ onEdit, onSave }) {
    this.onEditRoleClick = onEdit;
    this.onSaveRoleClick = onSave;
  }

  renderUsersTable(users) {
    if (!this.usersTableContainer) return;

    if (this.usersCountBadge) {
      this.usersCountBadge.textContent = `${users.length} Users Total`;
    }

    if (!users || users.length === 0) {
      this.usersTableContainer.innerHTML = `
        <div class="bento-card rounded-3xl p-12 text-center text-zinc-400">
          <i class="fa-solid fa-users text-3xl mb-3 text-zinc-600"></i>
          <p class="text-sm font-semibold">No users found.</p>
        </div>
      `;
      return;
    }

    const rowsHtml = users.map(user => {
      // Image rendering: Image tag if present, gradient avatar with initial if null
      let avatarHtml;
      if (user.imageUrl) {
        avatarHtml = `
          <img 
            src="${this._escape(user.imageUrl)}" 
            alt="${this._escape(user.username)}" 
            class="w-10 h-10 rounded-full object-cover border border-zinc-700/80 shrink-0 shadow-sm"
            loading="lazy"
            onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300\\'>${this._escape(user.username ? user.username.charAt(0).toUpperCase() : 'U')}</div>';"
          />
        `;
      } else {
        const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        avatarHtml = `
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 shrink-0 shadow-sm">
            <div class="w-full h-full bg-[#111114] rounded-full flex items-center justify-center font-bold text-xs text-white">
              ${this._escape(initial)}
            </div>
          </div>
        `;
      }

      // Clerk ID pill
      const clerkBadge = user.clerkId ? `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          ${this._escape(user.clerkId)}
        </span>
      ` : `
        <span class="text-xs text-zinc-500 font-mono italic">Local User</span>
      `;

      return `
        <tr class="hover:bg-zinc-800/30 transition group" id="user-row-${user.id}">
          <!-- User / Avatar (No text, rendered as image) -->
          <td class="py-4 pl-4 sm:pl-6 pr-4">
            <div class="flex items-center gap-3.5">
              ${avatarHtml}
              <div>
                <div class="text-sm font-bold text-white leading-tight">${this._escape(user.username)}</div>
                <div class="text-xs text-zinc-400 sm:hidden mt-0.5">${this._escape(user.email)}</div>
              </div>
            </div>
          </td>

          <!-- Email -->
          <td class="py-4 px-4 text-xs font-mono text-zinc-300 hidden sm:table-cell">
            ${this._escape(user.email)}
          </td>

          <!-- Role with Edit Button -->
          <td class="py-4 px-4">
            <div id="role-cell-${user.id}" class="inline-flex items-center gap-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                ${this._escape(user.role || 'user')}
              </span>
              <button 
                type="button" 
                class="edit-role-btn text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition" 
                data-user-id="${user.id}" 
                data-current-role="${this._escape(user.role || 'user')}" 
                title="Edit Role"
              >
                <i class="fa-solid fa-pen-to-square text-xs pointer-events-none"></i>
              </button>
            </div>
          </td>

          <!-- Clerk Identity -->
          <td class="py-4 px-4">
            ${clerkBadge}
          </td>

          <!-- ID -->
          <td class="py-4 pl-4 pr-4 text-right">
            <span class="text-xs font-mono font-bold text-zinc-400">#${this._escape(user.id)}</span>
          </td>

          <!-- Actions: Save Button (Only available when editing) -->
          <td class="py-4 pl-4 pr-4 sm:pr-6 text-right">
            <div id="action-cell-${user.id}" class="inline-flex items-center justify-end min-h-[28px]">
              <span class="text-xs text-zinc-600">—</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.usersTableContainer.innerHTML = `
      <div class="bento-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-2">
            <div>
              <h2 class="text-lg font-bold text-white tracking-tight">Active User Records</h2>
              <p class="text-xs text-zinc-400 mt-0.5">Live records synchronized across database and identity providers.</p>
            </div>
            <div class="text-xs text-zinc-500">
              <i class="fa-solid fa-shield-halved text-emerald-400 mr-1.5"></i> Password Hash Protected
            </div>
          </div>

          <div class="overflow-x-auto no-scrollbar mt-2">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th class="py-4 pl-4 sm:pl-6 pr-4">User</th>
                  <th class="py-4 px-4 hidden sm:table-cell">Email</th>
                  <th class="py-4 px-4">Role</th>
                  <th class="py-4 px-4">Clerk Identity</th>
                  <th class="py-4 pl-4 pr-4 text-right">ID</th>
                  <th class="py-4 pl-4 pr-4 sm:pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60">
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
          <span>Showing ${users.length} verified accounts</span>
          <span class="inline-flex items-center gap-1.5 text-zinc-400">
            <i class="fa-solid fa-lock text-zinc-500 text-[11px]"></i> Credentials securely isolated
          </span>
        </div>
      </div>
    `;

    // Attach delegated table interactions
    this._attachTableEvents();
  }

  _attachTableEvents() {
    if (!this.usersTableContainer) return;

    // Remove any previous listener by replacing clone or single handler
    this.usersTableContainer.onclick = (e) => {
      // 1. Edit Role Clicked
      const editBtn = e.target.closest('.edit-role-btn');
      if (editBtn) {
        const userId = editBtn.dataset.userId;
        const currentRole = editBtn.dataset.currentRole;
        if (this.onEditRoleClick) {
          this.onEditRoleClick(userId, currentRole);
        }
        return;
      }

      // 2. Cancel Role Clicked
      const cancelBtn = e.target.closest('.cancel-role-btn');
      if (cancelBtn) {
        const userId = cancelBtn.dataset.userId;
        const originalRole = cancelBtn.dataset.originalRole;
        this.cancelRoleEdit(userId, originalRole);
        return;
      }

      // 3. Save Role Clicked
      const saveBtn = e.target.closest('.save-role-btn');
      if (saveBtn && !saveBtn.disabled) {
        const userId = saveBtn.dataset.userId;
        const roleCell = document.getElementById(`role-cell-${userId}`);
        const select = roleCell ? roleCell.querySelector('.role-dropdown') : null;
        if (select && this.onSaveRoleClick) {
          this.setSaveButtonLoading(userId);
          this.onSaveRoleClick(userId, select.value);
        }
        return;
      }
    };

    // Listen for select dropdown changes to conditionally toggle the Save button
    this.usersTableContainer.onchange = (e) => {
      const select = e.target.closest('.role-dropdown');
      if (select) {
        const userId = select.dataset.userId;
        const originalRole = select.dataset.originalRole;
        const hasChanged = select.value !== originalRole;
        this.updateSaveButtonState(userId, hasChanged);
      }
    };
  }

  setRoleCellLoading(userId) {
    const roleCell = document.getElementById(`role-cell-${userId}`);
    if (roleCell) {
      roleCell.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400">
          <svg class="animate-spin h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading roles...</span>
        </span>
      `;
    }
  }

  enableRoleEdit(userId, currentRole, roles) {
    const roleCell = document.getElementById(`role-cell-${userId}`);
    const actionCell = document.getElementById(`action-cell-${userId}`);

    if (roleCell) {
      const optionsHtml = roles.map(r => `
        <option value="${this._escape(r)}" ${r === currentRole ? 'selected' : ''}>
          ${this._formatRoleLabel(r)}
        </option>
      `).join('');

      roleCell.innerHTML = `
        <div class="inline-flex items-center gap-1.5">
          <select 
            class="role-dropdown bg-[#0d0d10] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-zinc-500 capitalize shadow-inner cursor-pointer"
            data-user-id="${userId}"
            data-original-role="${currentRole}"
          >
            ${optionsHtml}
          </select>
          <button 
            type="button" 
            class="cancel-role-btn text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition" 
            data-user-id="${userId}" 
            data-original-role="${currentRole}" 
            title="Cancel"
          >
            <i class="fa-solid fa-xmark text-xs pointer-events-none"></i>
          </button>
        </div>
      `;
    }

    if (actionCell) {
      // Save button: Available ONLY because edit mode was pressed, but DISABLED until a change happens
      actionCell.innerHTML = `
        <button 
          type="button" 
          class="save-role-btn px-3 py-1 rounded-lg text-xs font-semibold transition bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed border border-zinc-700" 
          data-user-id="${userId}" 
          disabled
        >
          Save
        </button>
      `;
    }
  }

  updateSaveButtonState(userId, hasChanged) {
    const actionCell = document.getElementById(`action-cell-${userId}`);
    if (!actionCell) return;
    const saveBtn = actionCell.querySelector('.save-role-btn');
    if (!saveBtn) return;

    if (hasChanged) {
      saveBtn.disabled = false;
      saveBtn.className = "save-role-btn px-3 py-1 rounded-lg text-xs font-semibold transition bg-white text-black hover:bg-zinc-200 cursor-pointer shadow-sm border border-white transform hover:scale-[1.02]";
    } else {
      saveBtn.disabled = true;
      saveBtn.className = "save-role-btn px-3 py-1 rounded-lg text-xs font-semibold transition bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed border border-zinc-700";
    }
  }

  setSaveButtonLoading(userId) {
    const actionCell = document.getElementById(`action-cell-${userId}`);
    if (!actionCell) return;
    const saveBtn = actionCell.querySelector('.save-role-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `
        <svg class="animate-spin h-3.5 w-3.5 inline text-black mr-1" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Saving...</span>
      `;
    }
  }

  cancelRoleEdit(userId, originalRole) {
    const roleCell = document.getElementById(`role-cell-${userId}`);
    const actionCell = document.getElementById(`action-cell-${userId}`);

    if (roleCell) {
      roleCell.innerHTML = `
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
          ${this._escape(originalRole)}
        </span>
        <button 
          type="button" 
          class="edit-role-btn text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition" 
          data-user-id="${userId}" 
          data-current-role="${this._escape(originalRole)}" 
          title="Edit Role"
        >
          <i class="fa-solid fa-pen-to-square text-xs pointer-events-none"></i>
        </button>
      `;
    }

    if (actionCell) {
      actionCell.innerHTML = `<span class="text-xs text-zinc-600">—</span>`;
    }
  }

  renderUserRoleSaved(userId, newRole) {
    const roleCell = document.getElementById(`role-cell-${userId}`);
    const actionCell = document.getElementById(`action-cell-${userId}`);

    if (roleCell) {
      roleCell.innerHTML = `
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 capitalize">
          ${this._escape(newRole)}
        </span>
        <button 
          type="button" 
          class="edit-role-btn text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition" 
          data-user-id="${userId}" 
          data-current-role="${this._escape(newRole)}" 
          title="Edit Role"
        >
          <i class="fa-solid fa-pen-to-square text-xs pointer-events-none"></i>
        </button>
      `;
    }

    if (actionCell) {
      // Save button is no longer available once saved
      actionCell.innerHTML = `
        <span class="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <i class="fa-solid fa-check text-[10px]"></i> Saved
        </span>
      `;
      setTimeout(() => {
        if (actionCell) actionCell.innerHTML = `<span class="text-xs text-zinc-600">—</span>`;
      }, 2000);
    }
  }

  renderWorkspacesCardsLoading() {
    if (this.workspacesCountBadge) {
      this.workspacesCountBadge.textContent = 'Syncing...';
    }
    if (this.workspacesCardsContainer) {
      this.workspacesCardsContainer.innerHTML = `
        <div class="bento-card rounded-3xl p-12 flex flex-col items-center justify-center gap-4 text-center">
          <svg class="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div class="text-sm font-semibold text-zinc-300">Fetching workspace directory...</div>
          <div class="text-xs text-zinc-500">Querying /workspaces/ endpoint</div>
        </div>
      `;
    }
  }

  _getInitials(name) {
    if (!name) return 'WS';
    const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  renderWorkspacesCards(workspaces, onSelectWorkspace = null, onOpenDetail = null) {
    if (!this.workspacesCardsContainer) return;

    if (this.workspacesCountBadge) {
      this.workspacesCountBadge.textContent = `${(workspaces || []).length} Workspaces Total`;
    }

    if (!Array.isArray(workspaces) || workspaces.length === 0) {
      this.workspacesCardsContainer.innerHTML = `
        <div class="bento-card rounded-3xl p-12 flex flex-col items-center justify-center text-center text-zinc-400">
          <i class="fa-solid fa-briefcase text-3xl mb-3 text-zinc-600"></i>
          <p class="text-sm font-semibold">No workspaces found.</p>
          <p class="text-xs text-zinc-500 mt-1">Create or connect a workspace to see it listed here.</p>
        </div>
      `;
      return;
    }

    const cardsHtml = workspaces.map(ws => {
      const isActive = String(ws.status || '').toLowerCase() === 'active';
      const channels = Array.isArray(ws.channels) ? ws.channels : [];
      const serviceTypeFormatted = (ws.serviceType || 'product_based')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const channelPills = channels.length > 0 
        ? channels.map(c => {
            const chName = c.platform || c.channel || 'channel';
            return `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#111114] border border-zinc-800 text-[11px] text-zinc-300 font-medium">
                ${this._getChannelIcon(chName)}
                <span class="capitalize">${this._escape(chName)}</span>
                ${c.isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : '<span class="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>'}
              </span>
            `;
          }).join('')
        : `<span class="text-xs text-zinc-500 italic">No channels linked</span>`;

      return `
        <div class="bento-card rounded-3xl p-6 flex flex-col justify-between h-[220px]">
          <div>
            <div class="flex justify-between items-start mb-4">
              <div class="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700 text-white font-bold text-lg">
                ${this._getInitials(ws.name)}
              </div>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border border-zinc-700 text-zinc-400'} text-[10px] font-bold uppercase tracking-wider">
                ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active' : 'Offline'}
              </span>
            </div>
            <h2 class="text-xl font-bold text-white tracking-tight truncate" title="${this._escape(ws.name || `Workspace #${ws.id}`)}">
              ${this._escape(ws.name || `Workspace #${ws.id}`)}
            </h2>
            <p class="text-xs text-zinc-400 mt-1 capitalize">${this._escape(ws.serviceType || 'product_based')}</p>
          </div>
          <div class="flex items-center justify-between border-t border-zinc-800 pt-4 mt-4">
            <div class="flex items-center gap-2 text-xs text-zinc-400 font-medium">
              <i class="fa-solid fa-circle-nodes"></i> ${(ws.channels || []).length} Channels
            </div>
            <button 
              type="button" 
              class="manage-workspace-btn text-xs font-semibold bg-white text-black px-4 py-2 rounded-lg transition hover:bg-zinc-200 cursor-pointer shadow-sm"
              data-workspace-id="${ws.id}"
            >
              Manage <i class="fa-solid fa-arrow-right ml-1 text-[10px]"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.workspacesCardsContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${cardsHtml}
      </div>
    `;

    const handleManage = typeof onOpenDetail === 'function' 
      ? onOpenDetail 
      : (typeof onSelectWorkspace === 'function' ? onSelectWorkspace : null);

    // Bind Manage button interactions on workspace cards
    this.workspacesCardsContainer.querySelectorAll('.manage-workspace-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wsId = btn.dataset.workspaceId;
        if (handleManage) {
          handleManage(wsId);
        }
      });
    });
  }

  renderWorkspaceDetailView(workspace, channels, metrics = {}, { onBackToWorkspaces, onConfigureChannel, onOpenEditWorkspace }) {
    if (!this.workspaceDetailContent) return;

    const isActive = String(workspace.status || '').toLowerCase() === 'active';
    const channelsList = Array.isArray(channels) ? channels : [];

    // 1. Dynamic Breadcrumbs In Top Header: Workspaces / [Workspace Name]
    this.renderHeaderBreadcrumbs([
      { label: 'Workspaces', target: 'workspaces', action: 'workspaces', icon: '<i class="fa-solid fa-layer-group text-xs text-zinc-400"></i>' },
      { label: workspace.name || `Workspace #${workspace.id}` }
    ]);

    // 2. Channels Cards HTML
    const channelsHtml = channelsList.length > 0
      ? channelsList.map(c => {
          const chPlatform = c.platform || c.channel || 'webchat';
          const isChActive = Boolean(c.isActive);
          return `
            <div class="bento-card rounded-3xl p-6 flex flex-col justify-between min-h-[190px]">
              <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-[#0d0d10] border border-zinc-800 flex items-center justify-center text-xl shadow-inner shrink-0">
                    ${this._getChannelIcon(chPlatform)}
                  </div>
                  <div>
                    <h3 class="font-bold text-white text-base capitalize">${this._escape(chPlatform)}</h3>
                    <div class="text-[11px] font-mono text-zinc-500 mt-0.5">Meta Page ID: ${this._escape(c.metaPageId || c.id)}</div>
                  </div>
                </div>
                <span class="text-[10px] font-bold ${isChActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'} px-2 py-1 rounded-md uppercase">
                  ${isChActive ? 'Active' : 'Offline'}
                </span>
              </div>
              <button 
                type="button" 
                class="configure-channel-btn w-full text-center bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
                data-channel-id="${c.id}"
              >
                Configure Channel <i class="fa-solid fa-gear ml-1"></i>
              </button>
            </div>
          `;
        }).join('')
      : `
        <div class="col-span-full bento-card rounded-2xl p-10 flex flex-col items-center justify-center text-center text-zinc-400">
          <i class="fa-solid fa-circle-nodes text-3xl mb-2 text-zinc-600"></i>
          <p class="text-sm font-semibold">No channels configured</p>
          <p class="text-xs text-zinc-500 mt-0.5">There are no messaging platforms currently connected to this workspace.</p>
        </div>
      `;

    // 3. Workspace Detail Master Content with Hero Data Banner & Channels
    this.workspaceDetailContent.innerHTML = `
      <div class="space-y-8 animate-in fade-in duration-200">
        <!-- Hero Workspace Data Banner with Metrics -->
        <div class="bento-card rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col gap-6 border border-zinc-800 shadow-2xl">
          <div class="absolute -top-16 -right-16 w-48 h-48 ${isActive ? 'bg-emerald-500/10' : 'bg-zinc-700/5'} rounded-full blur-3xl pointer-events-none"></div>

          <!-- Top Row: Avatar, Info, Status, Edit Button -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-start gap-4 sm:gap-5 min-w-0">
              <div class="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 text-white font-bold text-xl shadow-inner shrink-0">
                ${this._getInitials(workspace.name)}
              </div>

              <div class="min-w-0 space-y-1.5">
                <div class="flex items-center gap-3 flex-wrap">
                  <h1 id="workspace-hero-name" class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white truncate" title="${this._escape(workspace.name || `Workspace #${workspace.id}`)}">
                    ${this._escape(workspace.name || `Workspace #${workspace.id}`)}
                  </h1>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isActive ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border border-zinc-700 text-zinc-400'} text-[10px] font-bold uppercase tracking-wider">
                    ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active' : 'Offline'}
                  </span>
                </div>

                <!-- Metadata Details Row: Created, Service Type, Currency, Meta App ID, Meta App Secret, ID -->
                <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                  <div class="flex items-center gap-1.5 text-zinc-300">
                    <i class="fa-solid fa-calendar-days text-[11px] text-zinc-500"></i>
                    <span id="workspace-hero-created">Created ${this._formatDate(workspace.createdAt)}</span>
                  </div>
                  <span>·</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-zinc-500 font-sans">Type:</span>
                    <span id="workspace-hero-service-type" class="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 text-[11px] font-semibold capitalize font-sans">
                      ${this._formatServiceType(workspace.serviceType)}
                    </span>
                  </div>
                  <span>·</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-zinc-500 font-sans">Currency:</span>
                    <span id="workspace-hero-currency" class="px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-400 border border-zinc-700 text-[11px] font-bold uppercase">
                      ${this._escape(workspace.currencyCode || 'USD')}
                    </span>
                  </div>
                 

                  <!-- <span>·</span> --!>
                  <!-- <span class="text-zinc-500">ID #${workspace.id}</span> --!>
                </div>
                 <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                                   <div class="flex items-center gap-1.5">
                    <span class="text-zinc-500 font-sans">Meta App ID:</span>
                    <span class="text-zinc-300">${this._escape(workspace.metaAppId || 'N/A')}</span>
                  </div>
                  <span>·</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-zinc-500 font-sans">Meta App Secret:</span>
                    <span class="text-zinc-300">${workspace.metaAppSecret ? '••••••••' + this._escape(workspace.metaAppSecret).slice(-4) : 'N/A'}</span>
                  </div>
                 </div>
              </div>
            </div>

            <!-- Edit Workspace Action Button -->
            <div class="flex items-center gap-3 shrink-0 self-start md:self-auto z-10">
              <button 
                type="button" 
                id="open-edit-workspace-btn"
                class="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition transform hover:scale-[1.02] shadow-sm cursor-pointer"
              >
                <i class="fa-solid fa-pen-to-square text-xs"></i>
                <span>Edit Workspace</span>
              </button>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-zinc-800/80"></div>

          <!-- Bottom Row: 4 Metric Cards for This Workspace -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 z-10 relative">
            
            <!-- 1. Total Sales -->
            <div class="p-4 rounded-2xl bg-[#0d0d10]/80 border border-zinc-800/80 flex flex-col justify-between">
              <div class="flex items-center justify-between text-zinc-400 mb-2">
                <span class="text-[11px] font-semibold uppercase tracking-wider">Total Sales</span>
                <i class="fa-solid fa-sack-dollar text-xs text-emerald-400"></i>
              </div>
              <div class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">${metrics.totalSales || '—'}</div>
              <div class="text-[10px] text-zinc-500 mt-1">${metrics.currency || workspace.currencyCode || 'USD'} revenue</div>
            </div>

            <!-- 2. Total Messages Count -->
            <div class="p-4 rounded-2xl bg-[#0d0d10]/80 border border-zinc-800/80 flex flex-col justify-between">
              <div class="flex items-center justify-between text-zinc-400 mb-2">
                <span class="text-[11px] font-semibold uppercase tracking-wider">Total Messages</span>
                <i class="fa-solid fa-comments text-xs text-zinc-300"></i>
              </div>
              <div class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">${metrics.messagesCount !== undefined ? metrics.messagesCount : '—'}</div>
              <div class="text-[10px] text-zinc-500 mt-1">Processed messages</div>
            </div>

            <!-- 3. DM to Checkouts -->
            <div class="p-4 rounded-2xl bg-[#0d0d10]/80 border border-zinc-800/80 flex flex-col justify-between">
              <div class="flex items-center justify-between text-zinc-400 mb-2">
                <span class="text-[11px] font-semibold uppercase tracking-wider">DM-to-Checkout</span>
                <i class="fa-solid fa-bag-shopping text-xs text-zinc-300"></i>
              </div>
              <div class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">${metrics.dmToCheckout || '—'}</div>
              <div class="text-[10px] text-zinc-500 mt-1">Conversion rate</div>
            </div>

            <!-- 4. Total Orders Placed -->
            <div class="p-4 rounded-2xl bg-[#0d0d10]/80 border border-zinc-800/80 flex flex-col justify-between">
              <div class="flex items-center justify-between text-zinc-400 mb-2">
                <span class="text-[11px] font-semibold uppercase tracking-wider">Orders Placed</span>
                <i class="fa-solid fa-cart-check text-xs text-blue-400"></i>
              </div>
              <div class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">${metrics.placedOrdersCount !== undefined ? metrics.placedOrdersCount : '—'}</div>
              <div class="text-[10px] text-zinc-500 mt-1">Fulfilled orders</div>
            </div>

          </div>
        </div>

        <!-- Connected Channels Section -->
        <div class="space-y-4">
          <div class="flex items-center justify-between pb-1">
            <div>
              <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Connected Channels</span>
              </h2>
              <p class="text-xs text-zinc-400 mt-0.5">Integrations routing conversations and checkout events for this storefront.</p>
            </div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111114] border border-zinc-800 text-xs text-zinc-300 font-mono">
              <i class="fa-solid fa-circle-nodes text-xs text-zinc-400"></i>
              <span id="workspace-channels-count-text">${channelsList.length} ${channelsList.length === 1 ? 'Channel' : 'Channels'}</span>
            </span>
          </div>

          <!-- Channels Grid (2 Columns per inspiration) -->
          <div id="workspace-channels-grid" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${channelsHtml}
          </div>
        </div>
      </div>
    `;

    // 4. Attach Event Listeners
    const editBtn = document.getElementById('open-edit-workspace-btn');
    if (editBtn && onOpenEditWorkspace) {
      editBtn.addEventListener('click', () => onOpenEditWorkspace());
    }

    this.workspaceDetailContent.querySelectorAll('.configure-channel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const channelId = Number(btn.dataset.channelId);
        if (onConfigureChannel) {
          onConfigureChannel(channelId);
        }
      });
    });
  }

  _formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  }

  _formatServiceType(type) {
    if (!type) return 'Product Based';
    return String(type)
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  renderEditWorkspaceView(workspace, channels, { onBackToWorkspaces, onBackToWorkspaceDetail, onSaveWorkspace, onDeleteChannel }) {
    if (!this.workspaceDetailContent) return;

    const channelsList = Array.isArray(channels) ? channels : [];

    // 1. Dynamic Breadcrumbs In Top Header: Workspaces / [Workspace Name] / Edit Workspace
    this.renderHeaderBreadcrumbs([
      { label: 'Workspaces', target: 'workspaces', action: 'workspaces', icon: '<i class="fa-solid fa-layer-group text-xs text-zinc-400"></i>' },
      { label: workspace.name || `Workspace #${workspace.id}`, target: 'workspace-detail', action: 'workspace-detail', workspaceId: workspace.id },
      { label: 'Edit Workspace', icon: '<i class="fa-solid fa-pen-to-square text-xs text-zinc-400"></i>' }
    ]);

    // 2. Edit Workspace Form View following UiUxInspiration/workspaces.html
    this.workspaceDetailContent.innerHTML = `
      <div class="space-y-8 animate-in fade-in duration-200">
        <div class="max-w-3xl">
          <div class="bento-card rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
            
            <!-- Header -->
            <div class="p-6 sm:p-8 border-b border-zinc-800 bg-[#0d0d10] flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700 text-white font-bold text-lg shadow-inner shrink-0">
                  ${this._getInitials(workspace.name)}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Edit Workspace</span>
                    <span class="text-xs px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 font-mono">
                      ID #${workspace.id}
                    </span>
                  </h2>
                  <p class="text-xs text-zinc-400 mt-0.5">Update storefront metadata, service type model, and manage integrations.</p>
                </div>
              </div>
            </div>

            <!-- Form Body -->
            <form id="edit-workspace-page-form" class="p-6 sm:p-8 space-y-6">
              
              <!-- Workspace Name -->
              <div>
                <label for="edit-page-ws-name" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Workspace Name
                </label>
                <input 
                  type="text" 
                  id="edit-page-ws-name" 
                  value="${this._escape(workspace.name || '')}" 
                  required 
                  placeholder="e.g. Xynex.Cloth"
                  class="w-full bg-[#0d0d10] border border-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-2.5 text-sm text-white font-medium transition"
                />
              </div>

              <!-- Service Type Dropdown Menu (2 options) -->
              <div>
                <label for="edit-page-ws-service-type" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Service Type
                </label>
                <div class="relative">
                  <select 
                    id="edit-page-ws-service-type" 
                    class="w-full appearance-none bg-[#0d0d10] border border-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-2.5 text-sm text-white font-medium transition pr-10 cursor-pointer"
                  >
                    <option value="product_based" ${workspace.serviceType === 'product_based' ? 'selected' : ''}>1- product_based (Product Based E-Commerce)</option>
                    <option value="service_based" ${workspace.serviceType === 'service_based' ? 'selected' : ''}>2- service_based (Service & Consultation Based)</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                    <i class="fa-solid fa-chevron-down text-xs"></i>
                  </div>
                </div>
                <p class="text-[11px] text-zinc-500 mt-1.5">Select whether this storefront processes product SKU checkouts or booking services.</p>
              </div>

              <!-- Currency Code -->
              <div>
                <label for="edit-page-ws-currency" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Currency Code
                </label>
                <input 
                  type="text" 
                  id="edit-page-ws-currency" 
                  value="${this._escape(workspace.currencyCode || 'USD')}" 
                  maxlength="5" 
                  required 
                  placeholder="USD"
                  class="w-full bg-[#0d0d10] border border-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase transition"
                />
                <p class="text-[11px] text-zinc-500 mt-1.5">The ISO currency code for orders and checkouts (e.g. USD, EUR, GBP).</p>
              </div>

              <!-- Meta App ID -->
              <div>
                <label for="edit-page-ws-meta-appid" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Meta App ID
                </label>
                <input 
                  type="text" 
                  id="edit-page-ws-meta-appid" 
                  value="${this._escape(workspace.metaAppId || '')}" 
                  placeholder="e.g. 1029384756"
                  class="w-full bg-[#0d0d10] border border-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono transition"
                />
                <p class="text-[11px] text-zinc-500 mt-1.5">Enter the Meta App ID associated with this workspace's integrations.</p>
              </div>

              <!-- Meta App Secret -->
              <div>
                <label for="edit-page-ws-meta-appsecret" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Meta App Secret
                </label>
                <input 
                  type="text" 
                  id="edit-page-ws-meta-appsecret" 
                  value="${this._escape(workspace.metaAppSecret || '')}" 
                  placeholder="e.g. 5f4dcc3b5aa765d61d8327deb882cf99"
                  class="w-full bg-[#0d0d10] border border-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono transition"
                />
                <p class="text-[11px] text-zinc-500 mt-1.5">Enter the Meta App Secret. This is required for secure Webhook integration.</p>
              </div>

              <!-- Connected Channels Section (Delete Channel) -->
              <div class="pt-4 border-t border-zinc-800">
                <div class="flex items-center justify-between mb-3">
                  <label class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Connected Channels (<span id="edit-page-channels-count">${channelsList.length}</span>)
                  </label>
                  <span class="text-[11px] text-zinc-500">Manage integrations linked to this workspace</span>
                </div>

                <div id="edit-page-channels-list" class="space-y-2.5">
                  ${channelsList.length > 0 ? channelsList.map(c => `
                    <div class="flex items-center justify-between p-3 rounded-2xl bg-[#0d0d10] border border-zinc-800 text-xs" id="channel-row-${c.id}">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                          ${this._getChannelIcon(c.platform || c.channel)}
                        </div>
                        <div>
                          <div class="font-semibold text-white capitalize">${this._escape(c.platform || c.channel || 'channel')} Channel</div>
                          <div class="text-zinc-500 font-mono text-[11px]">ID: #${c.id} ${c.metaPageId ? `· Meta: ${this._escape(c.metaPageId)}` : ''}</div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        class="delete-channel-page-btn inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 text-xs font-medium transition cursor-pointer"
                        data-channel-id="${c.id}"
                        data-platform="${this._escape(c.platform || c.channel || 'channel')}"
                      >
                        <i class="fa-solid fa-trash-can text-xs"></i>
                        <span>Delete</span>
                      </button>
                    </div>
                  `).join('') : '<p class="text-xs text-zinc-500 italic p-3 rounded-xl bg-[#0d0d10] border border-zinc-800">No channels linked to this workspace.</p>'}
                </div>
              </div>

              <!-- Error Notification Box -->
              <div id="edit-workspace-page-error" class="hidden p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"></div>

              <!-- Form Actions -->
              <div class="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button 
                  type="button" 
                  id="cancel-edit-page-btn" 
                  class="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-2"
                >
                  <i class="fa-solid fa-arrow-left text-xs"></i>
                  <span>Back to Workspace</span>
                </button>
                <button 
                  type="submit" 
                  id="save-edit-page-btn" 
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-zinc-700 bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed"
                  disabled
                >
                  <span id="save-page-spinner" class="hidden w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    `;

    // Attach Event Listeners
    const cancelBtn = document.getElementById('cancel-edit-page-btn');
    if (cancelBtn && onBackToWorkspaceDetail) {
      cancelBtn.addEventListener('click', () => onBackToWorkspaceDetail());
    }

    const form = document.getElementById('edit-workspace-page-form');
    const saveBtn = document.getElementById('save-edit-page-btn');
    const spinner = document.getElementById('save-page-spinner');
    const errorBox = document.getElementById('edit-workspace-page-error');

    // Live form validation to toggle Save button
    if (form && saveBtn) {
      const nameInput = document.getElementById('edit-page-ws-name');
      const serviceSelect = document.getElementById('edit-page-ws-service-type');
      const currencyInput = document.getElementById('edit-page-ws-currency');
      const metaAppIdInput = document.getElementById('edit-page-ws-meta-appid');
      const metaAppSecretInput = document.getElementById('edit-page-ws-meta-appsecret');

      const originalValues = {
        name: workspace.name || '',
        serviceType: workspace.serviceType || 'product_based',
        currencyCode: workspace.currencyCode || 'USD',
        metaAppId: workspace.metaAppId || '',
        metaAppSecret: workspace.metaAppSecret || ''
      };

      const checkChanges = () => {
        const currentName = nameInput?.value?.trim() || '';
        const currentService = serviceSelect?.value || 'product_based';
        const currentCurrency = currencyInput?.value?.trim().toUpperCase() || 'USD';
        const currentMeta = metaAppIdInput?.value?.trim() || '';
        const currentMetaSecret = metaAppSecretInput?.value?.trim() || '';

        const hasChanged = 
          currentName !== originalValues.name ||
          currentService !== originalValues.serviceType ||
          currentCurrency !== originalValues.currencyCode ||
          currentMeta !== originalValues.metaAppId ||
          currentMetaSecret !== originalValues.metaAppSecret;

        if (hasChanged) {
          saveBtn.disabled = false;
          saveBtn.className = "inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition transform hover:scale-[1.02] shadow-sm cursor-pointer border border-white";
        } else {
          saveBtn.disabled = true;
          saveBtn.className = "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-zinc-700 bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed";
        }
      };

      form.addEventListener('input', checkChanges);
      form.addEventListener('change', checkChanges);
    }

    // Delete channel buttons
    this.workspaceDetailContent.querySelectorAll('.delete-channel-page-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const channelId = Number(btn.dataset.channelId);
        const platform = btn.dataset.platform;
        if (!confirm(`Are you sure you want to delete the ${platform} channel (#${channelId})?`)) {
          return;
        }

        btn.disabled = true;
        btn.innerHTML = `<span class="w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></span>`;

        try {
          if (onDeleteChannel) {
            await onDeleteChannel(channelId);
          }
          const row = document.getElementById(`channel-row-${channelId}`);
          if (row) row.remove();
          const countEl = document.getElementById('edit-page-channels-count');
          if (countEl) {
            const currentCount = parseInt(countEl.textContent, 10) || 1;
            countEl.textContent = Math.max(0, currentCount - 1);
          }
        } catch (err) {
          console.error("Failed to delete channel:", err);
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-trash-can text-xs"></i> <span>Delete</span>`;
          if (errorBox) {
            errorBox.textContent = err.serverMessage || err.message || "Failed to delete channel";
            errorBox.classList.remove('hidden');
          }
        }
      });
    });

    // Form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('edit-page-ws-name');
        const serviceSelect = document.getElementById('edit-page-ws-service-type');
        const currencyInput = document.getElementById('edit-page-ws-currency');
        const metaAppIdInput = document.getElementById('edit-page-ws-meta-appid');
        const metaAppSecretInput = document.getElementById('edit-page-ws-meta-appsecret');

        const updatedData = {
          name: nameInput?.value?.trim() || workspace.name,
          serviceType: serviceSelect?.value || 'product_based',
          currencyCode: currencyInput?.value?.trim().toUpperCase() || 'USD',
          metaAppId: metaAppIdInput?.value?.trim() || null,
          metaAppSecret: metaAppSecretInput?.value?.trim() || null
        };

        if (saveBtn) saveBtn.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        if (errorBox) errorBox.classList.add('hidden');

        try {
          if (onSaveWorkspace) {
            await onSaveWorkspace(updatedData);
          }
        } catch (err) {
          console.error("Failed to save workspace:", err);
          if (errorBox) {
            errorBox.textContent = err.serverMessage || err.message || "Failed to update workspace";
            errorBox.classList.remove('hidden');
          }
        } finally {
          if (saveBtn) saveBtn.disabled = false;
          if (spinner) spinner.classList.add('hidden');
        }
      });
    }
  }

  renderChannelConfigView(workspace, channel, { onBackToWorkspaces, onBackToWorkspaceDetail, onToggleStatus, onSaveChannel }) {
    if (!this.workspaceDetailContent) return;

    const chPlatform = channel.platform || channel.channel || 'webchat';
    let isChActive = Boolean(channel.isActive);

    // 1. Dynamic Breadcrumbs In Top Header: Workspaces / [Workspace Name] / [Channel Name] Settings
    this.renderHeaderBreadcrumbs([
      { label: 'Workspaces', target: 'workspaces', action: 'workspaces', icon: '<i class="fa-solid fa-layer-group text-xs text-zinc-400"></i>' },
      { label: workspace.name || `Workspace #${workspace.id}`, target: 'workspace-detail', action: 'workspace-detail', workspaceId: workspace.id },
      { label: `${this._escape(chPlatform)} Settings`, icon: `<i class="fa-brands fa-${this._escape(chPlatform)}"></i>` }
    ]);

    // 2. Channel Configuration Panel
    this.workspaceDetailContent.innerHTML = `
      <div class="space-y-8 animate-in fade-in duration-200">
        <div class="max-w-3xl">
          <div class="bento-card rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
            
            <!-- Config Header & Master Toggle (Triggers PATCH /channels/:id/status) -->
            <div class="p-6 sm:p-8 border-b border-zinc-800 bg-[#0d0d10] flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div id="edit-channel-icon-wrapper" class="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700 text-white font-bold text-lg shadow-inner shrink-0">
                  ${this._getChannelIcon(chPlatform)}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span id="edit-channel-title" class="capitalize">${this._escape(chPlatform)}</span>
                    <span>Configuration</span>
                    <span class="text-xs px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 font-mono">
                      ID #${channel.id}
                    </span>
                  </h2>
                  <p class="text-xs text-zinc-400 mt-0.5">Manage API credentials and webhook routing for this integration.</p>
                </div>
              </div>

              <!-- THE MASTER TOGGLE (Triggers PATCH /channels/:id/status) -->
              <div class="flex flex-col items-end gap-2 shrink-0">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="channel-master-toggle" 
                    data-channel-id="${channel.id}" 
                    data-active="${isChActive ? 'true' : 'false'}" 
                    class="sr-only peer" 
                    ${isChActive ? 'checked' : ''}
                  >
                  <div class="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <span id="channel-master-status-label" class="text-[10px] font-semibold ${isChActive ? 'text-emerald-400' : 'text-zinc-500'} tracking-wide uppercase">
                  ${isChActive ? 'Agent Active' : 'Agent Offline'}
                </span>
              </div>
            </div>

            <!-- Form Body -->
            <form id="edit-channel-page-form" class="p-6 sm:p-8 space-y-6">
              
              <!-- Platform Dropdown -->
              <div>
                <label for="edit-channel-platform" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Platform
                </label>
                <div class="relative">
                  <select 
                    id="edit-channel-platform" 
                    class="w-full appearance-none bg-[#0d0d10] border border-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-2.5 text-sm text-white font-medium transition pr-10 cursor-pointer capitalize"
                  >
                    <option value="facebook" ${chPlatform === 'facebook' ? 'selected' : ''}>Facebook</option>
                    <option value="instagram" ${chPlatform === 'instagram' ? 'selected' : ''}>Instagram</option>
                    <option value="whatsapp" ${chPlatform === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                    <option value="telegram" ${chPlatform === 'telegram' ? 'selected' : ''}>Telegram</option>
                    <option value="webchat" ${chPlatform === 'webchat' ? 'selected' : ''}>Webchat</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
                    <i class="fa-solid fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </div>

              <!-- Meta Page ID -->
              <div>
                <label for="edit-channel-meta-page-id" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Meta Page ID
                </label>
                <input 
                  type="text" 
                  id="edit-channel-meta-page-id" 
                  value="${this._escape(channel.metaPageId || '')}" 
                  placeholder="e.g. 10123456789"
                  class="w-full bg-[#0d0d10] border border-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono transition"
                />
                <p class="text-[10px] text-zinc-500 mt-1.5">The numeric ID of your connected Facebook/Instagram page.</p>
              </div>

              <!-- Page Access Token -->
              <div>
                <label for="edit-channel-page-access-token" class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Page Access Token
                </label>
                <input 
                  type="text" 
                  id="edit-channel-page-access-token" 
                  value="${this._escape(channel.pageAccessToken || '')}" 
                  placeholder="EAAGm0PX4ZC..."
                  class="w-full bg-[#0d0d10] border border-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono transition"
                />
                <p class="text-[10px] text-zinc-500 mt-1.5">The long-lived access token required to send and receive messages.</p>
              </div>
              
              <!-- Error Notification Box -->
              <div id="edit-channel-page-error" class="hidden p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"></div>

              <!-- Form Actions -->
              <div class="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button 
                  type="button" 
                  id="back-to-channels-list-btn" 
                  class="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-2"
                >
                  <i class="fa-solid fa-arrow-left text-xs"></i>
                  <span>Back to Workspace</span>
                </button>
                <button 
                  type="submit" 
                  id="save-channel-page-btn" 
                  class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-zinc-700 bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed"
                  disabled
                >
                  <span id="save-channel-spinner" class="hidden w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    `;

    // Attach Event Listeners
    const backBtn = document.getElementById('back-to-channels-list-btn');
    if (backBtn && onBackToWorkspaceDetail) {
      backBtn.addEventListener('click', () => onBackToWorkspaceDetail());
    }

    const toggle = document.getElementById('channel-master-toggle');
    const label = document.getElementById('channel-master-status-label');
    if (toggle && onToggleStatus) {
      toggle.addEventListener('change', async (e) => {
        const isChecked = e.target.checked;
        const previousState = !isChecked;
        const channelId = toggle.dataset.channelId;

        // Optimistic UI update
        if (isChecked) {
          label.textContent = 'Agent Active';
          label.className = 'text-[10px] font-semibold text-emerald-400 tracking-wide uppercase';
        } else {
          label.textContent = 'Agent Offline';
          label.className = 'text-[10px] font-semibold text-zinc-500 tracking-wide uppercase';
        }
        toggle.disabled = true;

        try {
          await onToggleStatus(channelId, isChecked);
          isChActive = isChecked;
          toggle.dataset.active = isChecked ? 'true' : 'false';
        } catch (err) {
          console.error("Failed to toggle status:", err);
          // Revert UI on failure
          toggle.checked = previousState;
          if (previousState) {
            label.textContent = 'Agent Active';
            label.className = 'text-[10px] font-semibold text-emerald-400 tracking-wide uppercase';
          } else {
            label.textContent = 'Agent Offline';
            label.className = 'text-[10px] font-semibold text-zinc-500 tracking-wide uppercase';
          }
          alert(err.serverMessage || err.message || "Failed to update channel status.");
        } finally {
          toggle.disabled = false;
        }
      });
    }

    const form = document.getElementById('edit-channel-page-form');
    const saveBtn = document.getElementById('save-channel-page-btn');
    const spinner = document.getElementById('save-channel-spinner');
    const errorBox = document.getElementById('edit-channel-page-error');
    const platformSelect = document.getElementById('edit-channel-platform');
    const titleSpan = document.getElementById('edit-channel-title');
    const iconWrapper = document.getElementById('edit-channel-icon-wrapper');

    // Dynamic Icon & Title update on Platform selection change
    if (platformSelect) {
      platformSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (titleSpan) titleSpan.textContent = val;
        if (iconWrapper) iconWrapper.innerHTML = this._getChannelIcon(val);
      });
    }

    // Live form validation to toggle Save button
    if (form && saveBtn) {
      const metaPageInput = document.getElementById('edit-channel-meta-page-id');
      const tokenInput = document.getElementById('edit-channel-page-access-token');

      const originalValues = {
        platform: chPlatform,
        metaPageId: channel.metaPageId || '',
        pageAccessToken: channel.pageAccessToken || ''
      };

      const checkChanges = () => {
        const currentPlatform = platformSelect?.value || 'webchat';
        const currentMeta = metaPageInput?.value?.trim() || '';
        const currentToken = tokenInput?.value?.trim() || '';

        const hasChanged = 
          currentPlatform !== originalValues.platform ||
          currentMeta !== originalValues.metaPageId ||
          currentToken !== originalValues.pageAccessToken;

        if (hasChanged) {
          saveBtn.disabled = false;
          saveBtn.className = "inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition transform hover:scale-[1.02] shadow-sm cursor-pointer border border-white";
        } else {
          saveBtn.disabled = true;
          saveBtn.className = "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-zinc-700 bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed";
        }
      };

      form.addEventListener('input', checkChanges);
      form.addEventListener('change', checkChanges);
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const metaPageInput = document.getElementById('edit-channel-meta-page-id');
        const tokenInput = document.getElementById('edit-channel-page-access-token');

        const updatedData = {
          platform: platformSelect?.value || 'webchat',
          metaPageId: metaPageInput?.value?.trim() || null,
          pageAccessToken: tokenInput?.value?.trim() || null
        };

        if (saveBtn) saveBtn.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        if (errorBox) errorBox.classList.add('hidden');

        try {
          if (onSaveChannel) {
            await onSaveChannel(channel.id, updatedData);
          }
        } catch (err) {
          console.error("Failed to save channel:", err);
          if (errorBox) {
            errorBox.textContent = err.serverMessage || err.message || "Failed to update channel configuration";
            errorBox.classList.remove('hidden');
          }
        } finally {
          if (saveBtn) saveBtn.disabled = false;
          if (spinner) spinner.classList.add('hidden');
        }
      });
    }
  }

  renderWorkspacesCardsError(errorMessage, onRetry = null) {
    if (this.workspacesCountBadge) {
      this.workspacesCountBadge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span class="text-rose-400 font-semibold">Error</span>
      `;
    }

    if (!this.workspacesCardsContainer) return;

    this.workspacesCardsContainer.innerHTML = `
      <div class="bento-card rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col items-center text-center shadow-2xl border border-rose-500/20">
        <div class="absolute -top-24 -right-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="relative w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 shadow-xl shadow-rose-950/40">
          <i class="fa-solid fa-briefcase text-2xl"></i>
          <span class="absolute -top-1 -right-1 flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </div>

        <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2">
          Unable to Load Workspaces
        </h2>
        <p class="text-xs sm:text-sm text-zinc-400 max-w-lg leading-relaxed mb-6">
          The backend server rejected the request to retrieve the workspaces directory.
        </p>

        <div class="w-full max-w-lg bg-[#0d0d10] border border-zinc-800 rounded-2xl p-4 sm:p-5 text-left shadow-inner mb-8">
          <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span class="text-zinc-400 font-semibold">Server Response Payload</span>
            </div>
            <span class="text-zinc-600 font-mono">/workspaces/</span>
          </div>
          <div class="font-mono text-xs text-rose-300/90 leading-relaxed break-words bg-[#111114] p-3.5 rounded-xl border border-zinc-800/80">
            <span class="text-zinc-600 select-none">&gt; </span>${this._escape(errorMessage || 'Server did not respond')}
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <button 
            type="button" 
            id="retry-workspaces-btn"
            class="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition transform hover:scale-[1.02] shadow-lg cursor-pointer"
          >
            <i class="fa-solid fa-rotate-right text-xs"></i>
            <span>Try Again</span>
          </button>
        </div>
      </div>
    `;

    const retryBtn = document.getElementById('retry-workspaces-btn');
    if (retryBtn && onRetry) {
      retryBtn.addEventListener('click', () => onRetry());
    }
  }

  _formatRoleLabel(role) {
    if (!role) return '';
    return role
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  _escape(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
