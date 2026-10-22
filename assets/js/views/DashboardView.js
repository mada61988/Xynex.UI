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

    // Create Workspace elements & callbacks
    this.createWorkspaceSection = document.getElementById('section-create-workspace');
    this.btnAddWorkspace = document.getElementById('btn-add-workspace');
    this.onAddWorkspaceCallback = null;

    // Create Channel elements & callbacks
    this.createChannelSection = document.getElementById('section-create-channel');
    this.formCreateChannel = document.getElementById('form-create-channel');
    this.onOpenCreateChannelCallback = null;

    // Conversations Section
    this.conversationsSection = document.getElementById('section-conversations');

    // Products Section
    this.productsSection = document.getElementById('section-products');
    this.productsGridContainer = document.getElementById('products-grid-container');
    this.productsWorkspaceSelect = document.getElementById('products-workspace-select');
    this.productsViewMode = 'table';
    this.cachedProducts = [];
    this.cachedProductsHandlers = null;

    // Integrations, Analytics & Settings sections
    this.integrationsSection = document.getElementById('section-integrations');
    this.analyticsSection = document.getElementById('section-analytics');
    this.settingsSection = document.getElementById('section-settings');

    // Callbacks for role editing
    this.onEditRoleClick = null;
    this.onSaveRoleClick = null;

    this._bindWorkspacesDropdownEvents();
    this._bindSidebarLogout();
    this._bindProductsViewToggle();
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

  bindAddWorkspace(handler) {
    this.onAddWorkspaceCallback = handler;

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btn-add-workspace, [data-action="add-workspace"]');
      if (btn) {
        e.preventDefault();
        if (this.workspacesMenu) {
          this.workspacesMenu.classList.add('hidden');
        }
        handler();
      }
    });
  }

  openCreateChannelView(workspace) {
    const wsIdInput = document.getElementById('create-channel-workspace-id');
    const backBtnLabel = document.getElementById('back-to-workspace-detail-label');

    if (wsIdInput) wsIdInput.value = workspace.id;
    if (backBtnLabel) backBtnLabel.textContent = `Back to ${workspace.name || `Workspace #${workspace.id}`}`;

    this.renderHeaderBreadcrumbs([
      { label: 'Workspaces', target: 'workspaces', action: 'workspaces', icon: '<i class="fa-solid fa-briefcase text-xs text-zinc-400"></i>' },
      { label: workspace.name || `Workspace #${workspace.id}`, target: 'workspace-detail', action: 'workspace-detail', workspaceId: workspace.id },
      { label: 'Create Channel', icon: '<i class="fa-solid fa-circle-nodes text-xs text-white"></i>' }
    ]);

    this.resetCreateChannelForm();
    this.showSection('create-channel');
  }

  bindCreateChannel({ onSubmit, onCancel }) {
    const form = document.getElementById('form-create-channel');
    const wsIdInput = document.getElementById('create-channel-workspace-id');
    const platformSelect = document.getElementById('create-channel-platform');
    const platformIcon = document.getElementById('create-channel-platform-icon');
    const pageIdInput = document.getElementById('create-channel-page-id');
    const tokenInput = document.getElementById('create-channel-access-token');
    const toggleTokenBtn = document.getElementById('toggle-channel-token-visibility-btn');
    const submitBtn = document.getElementById('create-channel-submit-btn');
    const cancelBtn = document.getElementById('back-to-workspace-detail-btn');

    if (!form || !submitBtn) return;

    // Platform icon updater
    const updatePlatformIcon = () => {
      const val = platformSelect.value;
      if (platformIcon) {
        switch (val) {
          case 'instagram':
            platformIcon.innerHTML = `<i class="fa-brands fa-instagram text-pink-500"></i>`;
            break;
          case 'facebook':
            platformIcon.innerHTML = `<i class="fa-brands fa-facebook text-blue-500"></i>`;
            break;
          case 'whatsapp':
            platformIcon.innerHTML = `<i class="fa-brands fa-whatsapp text-emerald-400"></i>`;
            break;
          case 'telegram':
            platformIcon.innerHTML = `<i class="fa-brands fa-telegram text-sky-400"></i>`;
            break;
          case 'webchat':
            platformIcon.innerHTML = `<i class="fa-solid fa-comments text-amber-400"></i>`;
            break;
          default:
            platformIcon.innerHTML = `<i class="fa-solid fa-circle-nodes text-zinc-400"></i>`;
        }
      }
    };

    // Real-time validation
    const checkFormValidity = () => {
      const platform = platformSelect.value;
      const pageId = pageIdInput.value.trim();
      const token = tokenInput.value.trim();
      const isValid = Boolean(platform && pageId && token);

      if (isValid && !submitBtn.dataset.loading) {
        submitBtn.disabled = false;
        submitBtn.className = "w-full sm:w-auto px-7 py-3 rounded-xl font-semibold bg-white hover:bg-zinc-200 text-black text-xs sm:text-sm transition transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2 cursor-pointer";
      } else {
        submitBtn.disabled = true;
        submitBtn.className = "w-full sm:w-auto px-7 py-3 rounded-xl font-semibold bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed border border-zinc-700 text-xs sm:text-sm transition flex items-center justify-center gap-2";
      }
    };

    if (platformSelect) {
      platformSelect.addEventListener('change', () => {
        updatePlatformIcon();
        checkFormValidity();
      });
    }

    [pageIdInput, tokenInput].forEach(el => {
      if (el) el.addEventListener('input', checkFormValidity);
    });

    if (toggleTokenBtn && tokenInput) {
      toggleTokenBtn.addEventListener('click', () => {
        const type = tokenInput.getAttribute('type') === 'password' ? 'text' : 'password';
        tokenInput.setAttribute('type', type);
        toggleTokenBtn.innerHTML = type === 'password'
          ? '<i class="fa-regular fa-eye text-xs"></i>'
          : '<i class="fa-regular fa-eye-slash text-xs"></i>';
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitBtn.disabled) return;

      const payload = {
        workspaceId: Number(wsIdInput.value) || wsIdInput.value,
        platform: platformSelect.value,
        metaPageId: pageIdInput.value.trim(),
        pageAccessToken: tokenInput.value.trim()
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

  setCreateChannelLoading(isLoading) {
    const submitBtn = document.getElementById('create-channel-submit-btn');
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
        <span>Connecting Channel...</span>
      `;
    } else {
      delete submitBtn.dataset.loading;
      submitBtn.innerHTML = `
        <i class="fa-solid fa-plus text-xs"></i>
        <span>Create Channel</span>
      `;
      const pageIdInput = document.getElementById('create-channel-page-id');
      if (pageIdInput) pageIdInput.dispatchEvent(new Event('input'));
    }
  }

  showCreateChannelFeedback({ type, message }) {
    const fb = document.getElementById('create-channel-feedback');
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

  resetCreateChannelForm() {
    const form = document.getElementById('form-create-channel');
    if (form) form.reset();

    const fb = document.getElementById('create-channel-feedback');
    if (fb) fb.classList.add('hidden');

    const icon = document.getElementById('create-channel-platform-icon');
    if (icon) icon.innerHTML = `<i class="fa-solid fa-circle-nodes text-zinc-400"></i>`;

    const submitBtn = document.getElementById('create-channel-submit-btn');
    if (submitBtn) {
      delete submitBtn.dataset.loading;
      submitBtn.disabled = true;
      submitBtn.className = "w-full sm:w-auto px-7 py-3 rounded-xl font-semibold bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed border border-zinc-700 text-xs sm:text-sm transition flex items-center justify-center gap-2";
      submitBtn.innerHTML = `
        <i class="fa-solid fa-plus text-xs"></i>
        <span>Create Channel</span>
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
        const addBtn = e.target.closest('[data-action="add-workspace"]');
        if (addBtn) {
          if (this.workspacesMenu) {
            this.workspacesMenu.classList.add('hidden');
          }
          if (this.onAddWorkspaceCallback) {
            this.onAddWorkspaceCallback();
          }
          return;
        }

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
    const effectiveSection = (targetSection === 'create-workspace' || targetSection === 'workspace-detail' || targetSection === 'create-channel') ? 'workspaces' : targetSection;
    this.sidebarLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isTarget = href === `#${effectiveSection}`;

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
    if (this.createWorkspaceSection) this.createWorkspaceSection.classList.add('hidden');
    if (this.createChannelSection) this.createChannelSection.classList.add('hidden');
    if (this.conversationsSection) this.conversationsSection.classList.add('hidden');
    if (this.productsSection) this.productsSection.classList.add('hidden');
    if (this.integrationsSection) this.integrationsSection.classList.add('hidden');
    if (this.analyticsSection) this.analyticsSection.classList.add('hidden');
    if (this.settingsSection) this.settingsSection.classList.add('hidden');

    const isOverview = (sectionName === 'overview' || !sectionName || sectionName === '');

    if (sectionName === 'users') {
      if (this.usersSection) this.usersSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Users Directory', icon: '<i class="fa-solid fa-user text-xs text-zinc-400"></i>' }
      ]);
    } else if (sectionName === 'products') {
      if (this.productsSection) this.productsSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Products Catalog', icon: '<i class="fa-solid fa-boxes-stacked text-xs text-zinc-400"></i>' }
      ]);
    } else if (sectionName === 'conversations' || sectionName === 'chats') {
      if (this.conversationsSection) this.conversationsSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Conversations', icon: '<i class="fa-solid fa-comments text-xs text-zinc-400"></i>' }
      ]);
    } else if (sectionName === 'workspaces' || sectionName === 'chatbots') {
      if (this.workspacesSection) this.workspacesSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Workspaces', icon: '<i class="fa-solid fa-briefcase text-xs text-zinc-400"></i>' }
      ]);
    } else if (sectionName === 'workspace-detail') {
      if (this.workspaceDetailSection) this.workspaceDetailSection.classList.remove('hidden');
    } else if (sectionName === 'create-workspace') {
      if (this.createWorkspaceSection) this.createWorkspaceSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Workspaces', icon: '<i class="fa-solid fa-briefcase text-xs text-zinc-400"></i>', target: 'workspaces' },
        { label: 'Create Workspace', icon: '<i class="fa-solid fa-square-plus text-xs text-white"></i>' }
      ]);
    } else if (sectionName === 'create-channel') {
      if (this.createChannelSection) this.createChannelSection.classList.remove('hidden');
    } else if (sectionName === 'integrations') {
      if (this.integrationsSection) this.integrationsSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Integrations', icon: '<i class="fa-solid fa-plug-circle-bolt text-xs text-zinc-400"></i>' }
      ]);
    } else if (sectionName === 'analytics') {
      if (this.analyticsSection) this.analyticsSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Analytics & Logs', icon: '<i class="fa-solid fa-chart-line text-xs text-zinc-400"></i>' }
      ]);
    } else if (sectionName === 'settings') {
      if (this.settingsSection) this.settingsSection.classList.remove('hidden');
      this.renderHeaderBreadcrumbs([
        { label: 'Settings', icon: '<i class="fa-solid fa-sliders text-xs text-zinc-400"></i>' }
      ]);
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

    const addWorkspaceFooterHtml = `
      <div class="pt-1.5 mt-1 border-t border-zinc-800/80">
        <button type="button" data-action="add-workspace" class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-white transition cursor-pointer">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Add Workspace</span>
        </button>
      </div>
    `;

    this.workspacesList.innerHTML = allOptionHtml + profilesHtml + addWorkspaceFooterHtml;
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

    // Helper for Avatar rendering
    const getAvatarHtml = (user) => {
      if (user.imageUrl) {
        return `
          <img 
            src="${this._escape(user.imageUrl)}" 
            alt="${this._escape(user.username)}" 
            class="w-10 h-10 rounded-full object-cover border border-zinc-700/80 shrink-0 shadow-sm"
            loading="lazy"
            onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-300\\'>${this._escape(user.username ? user.username.charAt(0).toUpperCase() : 'U')}</div>';"
          />
        `;
      }
      const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
      return `
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 shrink-0 shadow-sm">
          <div class="w-full h-full bg-[#111114] rounded-full flex items-center justify-center font-bold text-xs text-white">
            ${this._escape(initial)}
          </div>
        </div>
      `;
    };

    // Helper for Clerk ID pill
    const getClerkBadge = (user) => {
      return user.clerkId ? `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          ${this._escape(user.clerkId)}
        </span>
      ` : `
        <span class="text-xs text-zinc-500 font-mono italic">Local User</span>
      `;
    };

    // Desktop Table Rows (hidden on mobile, visible md:table-row-group)
    const rowsHtml = users.map(user => {
      const avatarHtml = getAvatarHtml(user);
      const clerkBadge = getClerkBadge(user);

      return `
        <tr class="hover:bg-zinc-800/30 transition group" id="user-row-${user.id}">
          <!-- User / Avatar -->
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
            <div id="role-cell-${user.id}" data-role-cell="${user.id}" class="inline-flex items-center gap-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                ${this._escape(user.role || 'user')}
              </span>
              <button 
                type="button" 
                class="edit-role-btn text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer" 
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
            <div id="action-cell-${user.id}" data-action-cell="${user.id}" class="inline-flex items-center justify-end min-h-[28px]">
              <span class="text-xs text-zinc-600">—</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Mobile Responsive Card List (visible only on mobile - Zero horizontal scroll)
    const mobileCardsHtml = users.map(user => {
      const avatarHtml = getAvatarHtml(user);
      const clerkBadge = getClerkBadge(user);

      return `
        <div class="user-mobile-card p-4 rounded-2xl bg-[#0d0d10] border border-zinc-800/80 space-y-3.5 shadow-sm">
          <!-- Top Row: Avatar, Username, Email, and ID -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0 pr-2">
              ${avatarHtml}
              <div class="min-w-0">
                <div class="text-sm font-bold text-white leading-tight truncate">${this._escape(user.username)}</div>
                <div class="text-xs text-zinc-400 font-mono truncate mt-0.5">${this._escape(user.email)}</div>
              </div>
            </div>
            <span class="text-xs font-mono font-bold text-zinc-500 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-md shrink-0">#${this._escape(user.id)}</span>
          </div>

          <!-- Middle Row: Clerk Identity -->
          <div class="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/60">
            <span class="text-zinc-500 text-[11px] font-medium shrink-0">Clerk Identity:</span>
            <div class="truncate ml-2 text-right">
              ${clerkBadge}
            </div>
          </div>

          <!-- Bottom Row: Role & Actions -->
          <div class="flex items-center justify-between pt-2 border-t border-zinc-800/60">
            <div class="flex items-center gap-2">
              <span class="text-zinc-500 text-[11px] font-medium">Role:</span>
              <div data-role-cell="${user.id}" class="inline-flex items-center gap-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
                  ${this._escape(user.role || 'user')}
                </span>
                <button 
                  type="button" 
                  class="edit-role-btn text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer" 
                  data-user-id="${user.id}" 
                  data-current-role="${this._escape(user.role || 'user')}" 
                  title="Edit Role"
                >
                  <i class="fa-solid fa-pen-to-square text-xs pointer-events-none"></i>
                </button>
              </div>
            </div>
            <div data-action-cell="${user.id}" class="inline-flex items-center justify-end min-h-[28px]">
              <span class="text-xs text-zinc-600">—</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.usersTableContainer.innerHTML = `
      <div class="bento-card rounded-3xl p-4 sm:p-8 flex flex-col justify-between overflow-hidden">
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 border-b border-zinc-800 gap-2">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">Active User Records</h2>
              <p class="text-xs text-zinc-400 mt-0.5">Live records synchronized across database and identity providers.</p>
            </div>
            <div class="text-[11px] sm:text-xs text-zinc-500">
              <i class="fa-solid fa-shield-halved text-emerald-400 mr-1.5"></i> Password Hash Protected
            </div>
          </div>

          <!-- Desktop Table (md:block) -->
          <div class="hidden md:block overflow-x-auto no-scrollbar mt-2">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th class="py-4 pl-4 sm:pl-6 pr-4">User</th>
                  <th class="py-4 px-4">Email</th>
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

          <!-- Mobile User Cards (block md:hidden) -->
          <div class="block md:hidden space-y-3 mt-4">
            ${mobileCardsHtml}
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
        const parentContainer = saveBtn.closest('.user-mobile-card') || saveBtn.closest('tr');
        const roleCell = parentContainer ? parentContainer.querySelector(`[data-role-cell="${userId}"]`) : (document.getElementById(`role-cell-${userId}`) || document.querySelector(`[data-role-cell="${userId}"]`));
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
    const roleCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-role-cell="${userId}"], #role-cell-${userId}`) : [];
    roleCells.forEach(roleCell => {
      roleCell.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400">
          <svg class="animate-spin h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading roles...</span>
        </span>
      `;
    });
  }

  enableRoleEdit(userId, currentRole, roles) {
    const roleCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-role-cell="${userId}"], #role-cell-${userId}`) : [];
    const actionCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-action-cell="${userId}"], #action-cell-${userId}`) : [];

    const optionsHtml = roles.map(r => `
      <option value="${this._escape(r)}" ${r === currentRole ? 'selected' : ''}>
        ${this._formatRoleLabel(r)}
      </option>
    `).join('');

    roleCells.forEach(roleCell => {
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
            class="cancel-role-btn text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition cursor-pointer" 
            data-user-id="${userId}" 
            data-original-role="${currentRole}" 
            title="Cancel"
          >
            <i class="fa-solid fa-xmark text-xs pointer-events-none"></i>
          </button>
        </div>
      `;
    });

    actionCells.forEach(actionCell => {
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
    });
  }

  updateSaveButtonState(userId, hasChanged) {
    const actionCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-action-cell="${userId}"], #action-cell-${userId}`) : [];
    actionCells.forEach(actionCell => {
      const saveBtn = actionCell.querySelector('.save-role-btn');
      if (!saveBtn) return;

      if (hasChanged) {
        saveBtn.disabled = false;
        saveBtn.className = "save-role-btn px-3 py-1 rounded-lg text-xs font-semibold transition bg-white text-black hover:bg-zinc-200 cursor-pointer shadow-sm border border-white transform hover:scale-[1.02]";
      } else {
        saveBtn.disabled = true;
        saveBtn.className = "save-role-btn px-3 py-1 rounded-lg text-xs font-semibold transition bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed border border-zinc-700";
      }
    });
  }

  setSaveButtonLoading(userId) {
    const actionCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-action-cell="${userId}"], #action-cell-${userId}`) : [];
    actionCells.forEach(actionCell => {
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
    });
  }

  cancelRoleEdit(userId, originalRole) {
    const roleCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-role-cell="${userId}"], #role-cell-${userId}`) : [];
    const actionCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-action-cell="${userId}"], #action-cell-${userId}`) : [];

    roleCells.forEach(roleCell => {
      roleCell.innerHTML = `
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 capitalize">
          ${this._escape(originalRole)}
        </span>
        <button 
          type="button" 
          class="edit-role-btn text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer" 
          data-user-id="${userId}" 
          data-current-role="${this._escape(originalRole)}" 
          title="Edit Role"
        >
          <i class="fa-solid fa-pen-to-square text-xs pointer-events-none"></i>
        </button>
      `;
    });

    actionCells.forEach(actionCell => {
      actionCell.innerHTML = `<span class="text-xs text-zinc-600">—</span>`;
    });
  }

  renderUserRoleSaved(userId, newRole) {
    const roleCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-role-cell="${userId}"], #role-cell-${userId}`) : [];
    const actionCells = this.usersTableContainer ? this.usersTableContainer.querySelectorAll(`[data-action-cell="${userId}"], #action-cell-${userId}`) : [];

    roleCells.forEach(roleCell => {
      roleCell.innerHTML = `
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 capitalize">
          ${this._escape(newRole)}
        </span>
        <button 
          type="button" 
          class="edit-role-btn text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition cursor-pointer" 
          data-user-id="${userId}" 
          data-current-role="${this._escape(newRole)}" 
          title="Edit Role"
        >
          <i class="fa-solid fa-pen-to-square text-xs pointer-events-none"></i>
        </button>
      `;
    });

    actionCells.forEach(actionCell => {
      // Save button is no longer available once saved
      actionCell.innerHTML = `
        <span class="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <i class="fa-solid fa-check text-[10px]"></i> Saved
        </span>
      `;
    });

    setTimeout(() => {
      actionCells.forEach(actionCell => {
        actionCell.innerHTML = `<span class="text-xs text-zinc-600">—</span>`;
      });
    }, 2000);
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

  renderWorkspaceDetailView(workspace, channels, metrics = {}, { onBackToWorkspaces, onConfigureChannel, onOpenEditWorkspace, onOpenCreateChannel }) {
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
          <p class="text-xs text-zinc-500 mt-0.5 mb-4">There are no messaging platforms currently connected to this workspace.</p>
          <button 
            type="button" 
            class="btn-create-channel-empty inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl text-xs font-semibold transition transform hover:scale-[1.02] cursor-pointer"
            data-workspace-id="${workspace.id}"
          >
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Create Channel</span>
          </button>
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
          <div class="flex items-center justify-between pb-1 flex-wrap gap-3">
            <div>
              <h2 class="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Connected Channels</span>
              </h2>
              <p class="text-xs text-zinc-400 mt-0.5">Integrations routing conversations and checkout events for this storefront.</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111114] border border-zinc-800 text-xs text-zinc-300 font-mono">
                <i class="fa-solid fa-circle-nodes text-xs text-zinc-400"></i>
                <span id="workspace-channels-count-text">${channelsList.length} ${channelsList.length === 1 ? 'Channel' : 'Channels'}</span>
              </span>
              <button 
                type="button" 
                id="btn-create-channel"
                class="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition transform hover:scale-[1.02] shadow-sm cursor-pointer"
                data-workspace-id="${workspace.id}"
              >
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Create Channel</span>
              </button>
            </div>
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

    const createChannelBtn = document.getElementById('btn-create-channel');
    if (createChannelBtn && onOpenCreateChannel) {
      createChannelBtn.addEventListener('click', () => onOpenCreateChannel(workspace));
    }

    this.workspaceDetailContent.querySelectorAll('.btn-create-channel-empty').forEach(btn => {
      btn.addEventListener('click', () => {
        if (onOpenCreateChannel) onOpenCreateChannel(workspace);
      });
    });

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

  showDeleteChannelModal({ workspace, channel, onConfirm }) {
    if (!this.modalContainer) {
      this.modalContainer = document.getElementById('modal-container');
    }
    if (!this.modalContainer) return;

    const chPlatform = channel.platform || channel.channel || 'webchat';
    const wsName = workspace?.name || `Workspace #${workspace?.id || ''}`;
    const pageId = channel.metaPageId || channel.id || 'N/A';

    this.modalContainer.innerHTML = `
      <div id="delete-channel-modal-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div class="bento-card w-full max-w-md rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-rose-500/20 shadow-2xl animate-in zoom-in-95 duration-200">
          
          <!-- Ambient Glow Accent -->
          <div class="absolute -top-20 -right-20 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Danger Header Icon -->
          <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
            <i class="fa-solid fa-triangle-exclamation text-xl"></i>
          </div>

          <!-- Title & Prompt -->
          <h3 class="text-lg sm:text-xl font-bold text-white tracking-tight mb-2">
            Delete Channel?
          </h3>
          <p class="text-xs sm:text-sm text-zinc-400 mb-5 leading-relaxed">
            Are you sure you want to delete this channel? Active conversation webhooks will be disconnected.
          </p>

          <!-- Channel & Workspace Metadata Callout Card -->
          <div class="bg-[#0d0d10] border border-zinc-800 rounded-2xl p-4 space-y-2.5 mb-6 text-xs">
            <div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span class="text-zinc-500 font-medium">Channel</span>
              <span class="text-white font-semibold flex items-center gap-1.5 capitalize">
                ${this._getChannelIcon(chPlatform)}
                <span>${this._escape(chPlatform)}</span>
              </span>
            </div>
            <div class="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span class="text-zinc-500 font-medium">Workspace</span>
              <span class="text-white font-semibold flex items-center gap-1.5">
                <i class="fa-solid fa-briefcase text-xs text-zinc-400"></i>
                <span class="truncate max-w-[200px]">${this._escape(wsName)}</span>
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-zinc-500 font-medium">Meta Page ID</span>
              <span class="font-mono text-zinc-300 font-semibold flex items-center gap-1">
                <i class="fa-solid fa-hashtag text-[11px] text-zinc-500"></i>
                <span>${this._escape(pageId)}</span>
              </span>
            </div>
          </div>

          <!-- Error Feedback Container -->
          <div id="modal-delete-channel-error" class="hidden mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium"></div>

          <!-- Actions: Cancel and Yes -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button 
              type="button" 
              id="modal-cancel-delete-channel-btn" 
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button" 
              id="modal-confirm-delete-channel-btn" 
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
            >
              <i class="fa-solid fa-trash-can text-xs"></i>
              <span>Yes</span>
            </button>
          </div>

        </div>
      </div>
    `;

    const backdrop = document.getElementById('delete-channel-modal-backdrop');
    const cancelBtn = document.getElementById('modal-cancel-delete-channel-btn');
    const confirmBtn = document.getElementById('modal-confirm-delete-channel-btn');
    const errorBox = document.getElementById('modal-delete-channel-error');

    const closeModal = () => {
      if (this.modalContainer) this.modalContainer.innerHTML = '';
      document.removeEventListener('keydown', handleKey);
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    document.addEventListener('keydown', handleKey);

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;
        confirmBtn.innerHTML = `
          <svg class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Deleting...</span>
        `;
        if (errorBox) errorBox.classList.add('hidden');

        try {
          if (onConfirm) {
            await onConfirm(channel.id);
          }
          closeModal();
        } catch (err) {
          console.error("Modal delete channel error:", err);
          confirmBtn.disabled = false;
          if (cancelBtn) cancelBtn.disabled = false;
          confirmBtn.innerHTML = `<i class="fa-solid fa-trash-can text-xs"></i> <span>Yes</span>`;
          if (errorBox) {
            errorBox.textContent = err.serverMessage || err.message || "Failed to delete channel";
            errorBox.classList.remove('hidden');
          }
        }
      });
    }
  }

  renderChannelConfigView(workspace, channel, { onBackToWorkspaces, onBackToWorkspaceDetail, onToggleStatus, onSaveChannel, onDeleteChannel }) {
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
              <div class="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button 
                  type="button" 
                  id="back-to-channels-list-btn" 
                  class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <i class="fa-solid fa-arrow-left text-xs"></i>
                  <span>Back to Workspace</span>
                </button>
                <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button 
                    type="button" 
                    id="delete-channel-config-btn" 
                    class="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-2"
                    data-channel-id="${channel.id}"
                  >
                    <i class="fa-solid fa-trash-can text-xs"></i>
                    <span>Delete Channel</span>
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

    const deleteBtn = document.getElementById('delete-channel-config-btn');
    if (deleteBtn && onDeleteChannel) {
      deleteBtn.addEventListener('click', () => {
        this.showDeleteChannelModal({
          workspace,
          channel,
          onConfirm: async (channelId) => {
            await onDeleteChannel(channelId);
          }
        });
      });
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

  /**
   * Luxury Toast Notification System
   */
  showToast({ type = 'info', message = '' } = {}) {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isError = type === 'error';

    const icon = isSuccess 
      ? '<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i>' 
      : (isError 
        ? '<i class="fa-solid fa-triangle-exclamation text-rose-400 text-sm"></i>' 
        : '<i class="fa-solid fa-circle-info text-sky-400 text-sm"></i>');

    const borderStyle = isSuccess 
      ? 'border-emerald-500/30 shadow-emerald-500/10' 
      : (isError ? 'border-rose-500/30 shadow-rose-500/10' : 'border-zinc-700/80');

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111114]/95 backdrop-blur-xl border ${borderStyle} text-white shadow-2xl text-xs font-medium pointer-events-auto transition-all duration-300 transform translate-y-3 opacity-0 max-w-sm`;
    toast.innerHTML = `
      ${icon}
      <span class="flex-1 leading-snug">${this._escape(message)}</span>
      <button type="button" class="text-zinc-500 hover:text-zinc-300 text-xs ml-1 cursor-pointer">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    if (closeBtn) {
      closeBtn.onclick = () => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      };
    }

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-3');
    });

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }
    }, 3500);
  }

  _bindProductsViewToggle() {
    const tableBtn = document.getElementById('products-view-table-btn');
    const gridBtn = document.getElementById('products-view-grid-btn');
    if (!tableBtn || !gridBtn) return;

    tableBtn.onclick = () => {
      if (this.productsViewMode === 'table') return;
      this.productsViewMode = 'table';
      this._updateProductsViewToggleButtons();
      if (this.cachedProducts && this.cachedProductsHandlers) {
        this.renderProductsCatalog(this.cachedProducts, this.cachedProductsHandlers);
      }
    };

    gridBtn.onclick = () => {
      if (this.productsViewMode === 'grid') return;
      this.productsViewMode = 'grid';
      this._updateProductsViewToggleButtons();
      if (this.cachedProducts && this.cachedProductsHandlers) {
        this.renderProductsCatalog(this.cachedProducts, this.cachedProductsHandlers);
      }
    };
  }

  _updateProductsViewToggleButtons() {
    const tableBtn = document.getElementById('products-view-table-btn');
    const gridBtn = document.getElementById('products-view-grid-btn');
    if (!tableBtn || !gridBtn) return;

    if (this.productsViewMode === 'table') {
      tableBtn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition text-white bg-zinc-800 border border-zinc-700/80 shadow-sm cursor-pointer";
      gridBtn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition text-zinc-400 hover:text-white cursor-pointer";
    } else {
      gridBtn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition text-white bg-zinc-800 border border-zinc-700/80 shadow-sm cursor-pointer";
      tableBtn.className = "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition text-zinc-400 hover:text-white cursor-pointer";
    }
  }

  renderProductsWorkspaceOptions(workspaces, selectedWorkspaceId) {
    if (!this.productsWorkspaceSelect) return;
    if (!workspaces || workspaces.length === 0) {
      this.productsWorkspaceSelect.innerHTML = `<option value="" disabled selected>No workspaces found</option>`;
      return;
    }
    this.productsWorkspaceSelect.innerHTML = workspaces.map(w => {
      const isSelected = String(w.id) === String(selectedWorkspaceId);
      return `<option value="${w.id}" class="bg-[#111114] text-white" ${isSelected ? 'selected' : ''}>${this._escape(w.name || `Workspace #${w.id}`)}</option>`;
    }).join('');
  }

  bindProductsWorkspaceChange(handler) {
    if (this.productsWorkspaceSelect) {
      this.productsWorkspaceSelect.onchange = (e) => {
        handler(e.target.value);
      };
    }
  }

  renderProductsLoading() {
    if (!this.productsGridContainer) return;
    this.productsGridContainer.innerHTML = `
      <div class="bento-card rounded-3xl p-16 flex flex-col items-center justify-center gap-4 text-center">
        <svg class="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div class="text-sm font-semibold text-zinc-300">Loading products catalog...</div>
        <div class="text-xs text-zinc-500">Querying workspace inventory and variants</div>
      </div>
    `;
  }

  renderProductsError(errorMessage, onRetry = null) {
    if (!this.productsGridContainer) return;
    this.productsGridContainer.innerHTML = `
      <div class="bento-card rounded-3xl p-10 flex flex-col items-center justify-center text-center border border-rose-500/20">
        <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
          <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
        </div>
        <h3 class="text-lg font-bold text-white mb-1">Failed to Load Products</h3>
        <p class="text-xs text-zinc-400 max-w-md mb-6">${this._escape(errorMessage || 'Server error occurred while fetching products.')}</p>
        ${onRetry ? `
          <button type="button" id="retry-fetch-products-btn" class="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer">
            <i class="fa-solid fa-rotate-right mr-1.5"></i> Try Again
          </button>
        ` : ''}
      </div>
    `;
    if (onRetry) {
      const retryBtn = document.getElementById('retry-fetch-products-btn');
      if (retryBtn) retryBtn.onclick = () => onRetry();
    }
  }

  renderProductsEmpty(onAddClick = null) {
    if (!this.productsGridContainer) return;
    this.productsGridContainer.innerHTML = `
      <div class="bento-card rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 text-zinc-400">
        <div class="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 text-3xl shadow-lg">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <div class="text-base font-bold text-white">No products found</div>
        <p class="text-xs text-zinc-500 max-w-sm">This workspace does not have any product catalog items registered yet.</p>
        <button type="button" id="btn-empty-add-product" class="mt-2 inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-md">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Add First Product</span>
        </button>
      </div>
    `;

    const emptyBtn = document.getElementById('btn-empty-add-product');
    if (emptyBtn) {
      emptyBtn.onclick = () => {
        if (onAddClick) onAddClick();
        else if (this.onAddProductClick) this.onAddProductClick();
      };
    }
  }

  bindAddProductButton(handler) {
    this.onAddProductClick = handler;
    const addBtn = document.getElementById('btn-add-product');
    if (addBtn) {
      addBtn.onclick = () => {
        if (this.onAddProductClick) this.onAddProductClick();
      };
    }
  }

  /**
   * Renders interactive attribute chips with inline edit and delete actions, plus + Add button
   */
  renderProductAttributesChips(productId, rawAttributes, { showLabels = true } = {}) {
    const list = Array.isArray(rawAttributes) 
      ? rawAttributes 
      : (rawAttributes && typeof rawAttributes === 'object' ? Object.keys(rawAttributes) : []);

    const chipsHtml = list.map(attr => `
      <div class="product-attr-chip group/chip relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#18181b] hover:bg-[#202024] border border-zinc-700/70 text-zinc-200 text-xs font-medium transition shadow-sm" data-product-id="${productId}" data-attribute="${this._escape(attr)}">
        <span class="attr-label select-none cursor-pointer hover:text-white" title="Click to edit attribute">${this._escape(attr)}</span>
        
        <button type="button" class="btn-edit-attr text-zinc-500 hover:text-zinc-200 opacity-60 group-hover/chip:opacity-100 transition p-0.5 cursor-pointer text-[10px]" title="Edit attribute">
          <i class="fa-solid fa-pen text-[9px]"></i>
        </button>

        <button type="button" class="btn-delete-attr text-zinc-500 hover:text-rose-400 opacity-60 group-hover/chip:opacity-100 transition p-0.5 cursor-pointer text-[11px]" title="Remove attribute">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <!-- Inline Edit Box -->
        <div class="attr-edit-box hidden absolute inset-0 bg-[#18181b] rounded-lg border border-zinc-500 flex items-center px-1.5 z-10 shadow-lg">
          <input type="text" class="attr-edit-input w-24 bg-transparent text-xs text-white focus:outline-none font-medium" value="${this._escape(attr)}" />
          <button type="button" class="btn-confirm-edit text-emerald-400 hover:text-emerald-300 p-1 text-[10px] cursor-pointer" title="Save"><i class="fa-solid fa-check"></i></button>
          <button type="button" class="btn-cancel-edit text-zinc-400 hover:text-zinc-200 p-1 text-[10px] cursor-pointer" title="Cancel"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `).join('');

    const addBtnHtml = `
      <div class="inline-flex items-center attr-add-wrapper" data-product-id="${productId}">
        <button type="button" class="btn-open-add-attr border border-dashed border-zinc-700/90 hover:border-zinc-500 hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer">
          <i class="fa-solid fa-plus text-[9px]"></i>
          <span>Add</span>
        </button>
        <div class="attr-add-box hidden items-center gap-1 bg-[#18181b] border border-zinc-600 rounded-lg px-2 py-0.5 shadow-lg">
          <input type="text" placeholder="e.g. Material" class="attr-add-input w-24 bg-transparent text-xs text-white focus:outline-none placeholder-zinc-500 font-medium" />
          <button type="button" class="btn-confirm-add text-emerald-400 hover:text-emerald-300 p-1 text-[10px] cursor-pointer" title="Add attribute"><i class="fa-solid fa-check"></i></button>
          <button type="button" class="btn-cancel-add text-zinc-400 hover:text-zinc-200 p-1 text-[10px] cursor-pointer" title="Cancel"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `;

    return `<div class="flex items-center gap-1.5 flex-wrap attributes-list-container" data-product-id="${productId}">${chipsHtml}${addBtnHtml}</div>`;
  }

  /**
   * Binds interaction events to all attribute chips and add triggers
   */
  bindProductAttributesEvents(container, { onAddAttribute, onEditAttribute, onDeleteAttribute } = {}) {
    if (!container) return;

    // 1. Open Add Box
    container.querySelectorAll('.btn-open-add-attr').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const wrapper = btn.closest('.attr-add-wrapper');
        const addBox = wrapper?.querySelector('.attr-add-box');
        const input = wrapper?.querySelector('.attr-add-input');
        if (addBox && input) {
          btn.classList.add('hidden');
          addBox.classList.remove('hidden');
          addBox.classList.add('flex');
          input.value = '';
          input.focus();
        }
      };
    });

    // Cancel Add Box
    container.querySelectorAll('.btn-cancel-add').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const wrapper = btn.closest('.attr-add-wrapper');
        const openBtn = wrapper?.querySelector('.btn-open-add-attr');
        const addBox = wrapper?.querySelector('.attr-add-box');
        if (openBtn && addBox) {
          addBox.classList.add('hidden');
          addBox.classList.remove('flex');
          openBtn.classList.remove('hidden');
        }
      };
    });

    // Confirm Add
    const handleConfirmAdd = async (wrapper) => {
      const pid = Number(wrapper.dataset.productId);
      const input = wrapper.querySelector('.attr-add-input');
      const val = input?.value.trim();
      if (!val) return;

      const confirmBtn = wrapper.querySelector('.btn-confirm-add');
      if (confirmBtn) {
        confirmBtn.innerHTML = `<svg class="animate-spin h-3 w-3 inline text-emerald-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
      }
      if (input) input.disabled = true;

      try {
        if (onAddAttribute) {
          await onAddAttribute(pid, val);
        }
      } catch (err) {
        if (confirmBtn) confirmBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;
        if (input) input.disabled = false;
        this.showToast({ type: 'error', message: err.serverMessage || err.message || 'Failed to add attribute' });
      }
    };

    container.querySelectorAll('.btn-confirm-add').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        handleConfirmAdd(btn.closest('.attr-add-wrapper'));
      };
    });

    container.querySelectorAll('.attr-add-input').forEach(input => {
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleConfirmAdd(input.closest('.attr-add-wrapper'));
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          const wrapper = input.closest('.attr-add-wrapper');
          wrapper?.querySelector('.btn-cancel-add')?.click();
        }
      };
    });

    // 2. Open Edit Box
    container.querySelectorAll('.btn-edit-attr, .attr-label').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const chip = el.closest('.product-attr-chip');
        const editBox = chip?.querySelector('.attr-edit-box');
        const input = chip?.querySelector('.attr-edit-input');
        if (editBox && input) {
          editBox.classList.remove('hidden');
          input.focus();
          input.select();
        }
      };
    });

    // Cancel Edit Box
    container.querySelectorAll('.btn-cancel-edit').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const chip = btn.closest('.product-attr-chip');
        chip?.querySelector('.attr-edit-box')?.classList.add('hidden');
      };
    });

    // Confirm Edit
    const handleConfirmEdit = async (chip) => {
      const pid = Number(chip.dataset.productId);
      const oldAttr = chip.dataset.attribute;
      const input = chip.querySelector('.attr-edit-input');
      const newAttr = input?.value.trim();

      if (!newAttr || newAttr === oldAttr) {
        chip.querySelector('.attr-edit-box')?.classList.add('hidden');
        return;
      }

      const confirmBtn = chip.querySelector('.btn-confirm-edit');
      if (confirmBtn) {
        confirmBtn.innerHTML = `<svg class="animate-spin h-3 w-3 inline text-emerald-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
      }
      if (input) input.disabled = true;

      try {
        if (onEditAttribute) {
          await onEditAttribute(pid, oldAttr, newAttr);
        }
      } catch (err) {
        if (confirmBtn) confirmBtn.innerHTML = `<i class="fa-solid fa-check"></i>`;
        if (input) input.disabled = false;
        this.showToast({ type: 'error', message: err.serverMessage || err.message || 'Failed to edit attribute' });
      }
    };

    container.querySelectorAll('.btn-confirm-edit').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        handleConfirmEdit(btn.closest('.product-attr-chip'));
      };
    });

    container.querySelectorAll('.attr-edit-input').forEach(input => {
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleConfirmEdit(input.closest('.product-attr-chip'));
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          const chip = input.closest('.product-attr-chip');
          chip?.querySelector('.btn-cancel-edit')?.click();
        }
      };
    });

    // 3. Delete Attribute
    container.querySelectorAll('.btn-delete-attr').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const chip = btn.closest('.product-attr-chip');
        const pid = Number(chip.dataset.productId);
        const attr = chip.dataset.attribute;

        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-3 w-3 inline text-rose-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

        try {
          if (onDeleteAttribute) {
            await onDeleteAttribute(pid, attr);
          }
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
          this.showToast({ type: 'error', message: err.serverMessage || err.message || 'Failed to delete attribute' });
        }
      };
    });
  }

  /**
   * Enterprise Table View for Products with Interactive Attributes
   */
  renderProductsTable(products, handlers = {}) {
    if (!this.productsGridContainer) return;
    const { onProductClick } = handlers;

    if (!products || products.length === 0) {
      this.renderProductsEmpty(handlers.onAddProduct);
      return;
    }

    const rowsHtml = products.map(p => {
      const priceFormatted = `$${Number(p.price || 0).toFixed(2)}`;
      const variantsCount = Array.isArray(p.productVariants) ? p.productVariants.length : 0;
      const attributesChips = this.renderProductAttributesChips(p.id, p.attributes);

      let imageHtml;
      if (p.imageUrl) {
        imageHtml = `<img src="${this._escape(p.imageUrl)}" alt="${this._escape(p.name)}" class="w-full h-full object-cover" onerror="this.onerror=null;this.parentElement.innerHTML='<i class=\\'fa-solid fa-box text-zinc-600 text-sm\\'></i>';" />`;
      } else {
        imageHtml = `<i class="fa-solid fa-box text-zinc-600 text-sm"></i>`;
      }

      return `
        <tr class="hover:bg-zinc-800/30 transition group/row" data-product-id="${p.id}">
          <!-- Product Name & Thumbnail -->
          <td class="py-3.5 px-5">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
                ${imageHtml}
              </div>
              <div class="min-w-0">
                <div class="text-xs sm:text-sm font-bold text-white hover:text-zinc-200 transition cursor-pointer truncate max-w-[180px] sm:max-w-[220px] btn-product-title" title="${this._escape(p.name)}">
                  ${this._escape(p.name)}
                </div>
                <div class="text-[11px] text-zinc-500 truncate max-w-[180px] sm:max-w-[220px] mt-0.5">
                  ${this._escape(p.description || 'No description')}
                </div>
                <span class="text-[10px] font-mono text-zinc-500">ID #${p.id}</span>
              </div>
            </div>
          </td>

          <!-- Price -->
          <td class="py-3.5 px-4 font-mono font-extrabold text-xs sm:text-sm text-white whitespace-nowrap">
            ${priceFormatted}
          </td>

          <!-- Status -->
          <td class="py-3.5 px-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}">
              ${p.isActive !== false ? 'Active' : 'Draft'}
            </span>
          </td>

          <!-- Variants -->
          <td class="py-3.5 px-4 whitespace-nowrap">
            <span class="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 inline-flex items-center gap-1.5">
              <i class="fa-solid fa-layer-group text-[10px] text-zinc-500"></i>
              <span>${variantsCount}</span>
            </span>
          </td>

          <!-- Attributes (Interactive!) -->
          <td class="py-3.5 px-5">
            ${attributesChips}
          </td>

          <!-- Actions -->
          <td class="py-3.5 px-5 text-right whitespace-nowrap">
            <button type="button" class="btn-product-details border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm inline-flex items-center gap-1.5" data-product-id="${p.id}">
              <span>Details</span>
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    this.productsGridContainer.innerHTML = `
      <div class="bento-card rounded-3xl overflow-hidden border border-zinc-800/80 shadow-2xl bg-[#111114]">
        <!-- Table Toolbar -->
        <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d0d10]/40">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Inventory Catalog</span>
            <span class="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full">${products.length} Products</span>
          </div>
          <div class="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <i class="fa-solid fa-wand-magic-sparkles text-amber-400 text-xs"></i>
            <span>Interactive attributes: Click to edit, hover <i class="fa-solid fa-xmark text-[10px] text-zinc-400"></i> to delete, or click <span class="text-zinc-300 font-semibold">+ Add</span>.</span>
          </div>
        </div>

        <!-- Table Body -->
        <div class="overflow-x-auto no-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-500 tracking-wider bg-[#0d0d10]/80">
                <th class="py-3.5 px-5">Product</th>
                <th class="py-3.5 px-4">Price</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4">Variants</th>
                <th class="py-3.5 px-5 min-w-[300px]">Attributes</th>
                <th class="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind Attributes Events
    this.bindProductAttributesEvents(this.productsGridContainer, handlers);

    // Bind Details click
    this.productsGridContainer.querySelectorAll('.btn-product-details, .btn-product-title').forEach(btn => {
      btn.onclick = () => {
        const pid = Number(btn.closest('[data-product-id]').dataset.productId);
        const product = products.find(p => p.id === pid);
        if (product && onProductClick) onProductClick(product);
      };
    });
  }

  /**
   * Grid Cards View for Products with Interactive Attributes
   */
  renderProductsGrid(products, handlers = {}) {
    if (!this.productsGridContainer) return;
    const onProductClick = typeof handlers === 'function' ? handlers : handlers.onProductClick;

    if (!products || products.length === 0) {
      this.renderProductsEmpty(handlers.onAddProduct);
      return;
    }

    const cardsHtml = products.map(p => {
      const priceFormatted = `$${Number(p.price || 0).toFixed(2)}`;
      const variantsCount = Array.isArray(p.productVariants) ? p.productVariants.length : 0;
      const attributesChips = this.renderProductAttributesChips(p.id, p.attributes);

      let imageHtml;
      if (p.imageUrl) {
        imageHtml = `
          <img 
            src="${this._escape(p.imageUrl)}" 
            alt="${this._escape(p.name)}" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            loading="lazy"
            onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-1 bg-zinc-900/80\\'><i class=\\'fa-solid fa-box text-3xl text-zinc-700\\'></i><span class=\\'text-[10px] text-zinc-500\\'>No image</span></div>';"
          />
        `;
      } else {
        imageHtml = `
          <div class="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-1 bg-zinc-900/60">
            <i class="fa-solid fa-box text-3xl text-zinc-700"></i>
            <span class="text-[10px] text-zinc-500 font-medium">No Image</span>
          </div>
        `;
      }

      return `
        <div 
          class="product-box bento-card rounded-2xl p-4 hover:border-zinc-500/60 transition duration-300 transform hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between group relative"
          data-product-id="${p.id}"
        >
          <div>
            <!-- Product Image Box -->
            <div class="relative w-full h-44 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 mb-3 flex items-center justify-center cursor-pointer btn-open-modal-trigger">
              ${imageHtml}
              <span class="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${p.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md' : 'bg-zinc-800/90 text-zinc-400 border border-zinc-700'}">
                ${p.isActive !== false ? 'Active' : 'Draft'}
              </span>
            </div>

            <!-- Product Name -->
            <h3 class="text-sm font-bold text-white group-hover:text-zinc-200 transition truncate cursor-pointer btn-open-modal-trigger" title="${this._escape(p.name)}">
              ${this._escape(p.name)}
            </h3>

            <!-- Description snippet -->
            <p class="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
              ${this._escape(p.description || 'No description provided')}
            </p>

            <!-- Variants info badge -->
            <div class="mt-2.5 flex items-center gap-1.5">
              <span class="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/60">
                ${variantsCount} ${variantsCount === 1 ? 'Variant' : 'Variants'}
              </span>
            </div>

            <!-- Interactive Attributes Area -->
            <div class="mt-3 pt-2.5 border-t border-zinc-800/80">
              <span class="text-[10px] uppercase font-bold text-zinc-500 block mb-1.5">Attributes:</span>
              ${attributesChips}
            </div>
          </div>

          <!-- Price & Action CTA -->
          <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] uppercase font-bold text-zinc-500">Price</span>
              <div class="text-base font-extrabold text-white leading-tight">
                ${priceFormatted}
              </div>
            </div>
            <button type="button" class="btn-card-details inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition cursor-pointer">
              <span>Details</span>
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.productsGridContainer.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${cardsHtml}
      </div>
    `;

    // Bind Attributes Events
    this.bindProductAttributesEvents(this.productsGridContainer, handlers);

    // Bind click events on cards for details
    this.productsGridContainer.querySelectorAll('.btn-open-modal-trigger, .btn-card-details').forEach(el => {
      el.onclick = (e) => {
        const card = el.closest('.product-box');
        const pid = Number(card.dataset.productId);
        const product = products.find(p => p.id === pid);
        if (product && onProductClick) {
          onProductClick(product);
        }
      };
    });
  }

  /**
   * Universal Catalog Renderer routing to active view mode (Table or Grid)
   */
  renderProductsCatalog(products, handlers = {}) {
    this.cachedProducts = products;
    this.cachedProductsHandlers = handlers;

    if (!products || products.length === 0) {
      this.renderProductsEmpty(handlers.onAddProduct);
      return;
    }

    if (this.productsViewMode === 'grid') {
      this.renderProductsGrid(products, handlers);
    } else {
      this.renderProductsTable(products, handlers);
    }
  }

  /**
   * Product Details & Attributes Management Modal
   */
  openProductDetailsModal(product, handlers = {}) {
    const { onEdit, onSave, onDelete, onAddAttribute, onEditAttribute, onDeleteAttribute } = handlers;

    if (!this.modalContainer) {
      this.modalContainer = document.getElementById('modal-container');
    }
    if (!this.modalContainer) return;

    const variants = Array.isArray(product.productVariants) ? product.productVariants : [];

    let imageHtml;
    if (product.imageUrl) {
      imageHtml = `
        <img 
          src="${this._escape(product.imageUrl)}" 
          alt="${this._escape(product.name)}" 
          class="w-full h-56 sm:h-64 object-cover rounded-2xl bg-zinc-900 border border-zinc-800" 
          onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'w-full h-56 sm:h-64 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-600 gap-2\\'><i class=\\'fa-solid fa-box text-4xl\\'></i><span class=\\'text-xs\\'>No image</span></div>';"
        />
      `;
    } else {
      imageHtml = `
        <div class="w-full h-56 sm:h-64 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-600 gap-2">
          <i class="fa-solid fa-box text-4xl text-zinc-700"></i>
          <span class="text-xs text-zinc-500 font-medium">No Image Available</span>
        </div>
      `;
    }

    const variantsRows = variants.map(v => {
      let attrDisplay = '—';
      if (v.attributes && typeof v.attributes === 'object') {
        attrDisplay = Object.entries(v.attributes).map(([k, val]) => `<span class="text-white font-medium">${this._escape(k)}:</span> ${this._escape(val)}`).join(' · ');
      }
      return `
        <tr class="hover:bg-zinc-800/40 transition">
          <td class="py-3 px-3 text-xs font-mono font-bold text-white">${this._escape(v.sku || 'N/A')}</td>
          <td class="py-3 px-3 text-xs text-zinc-300">${attrDisplay}</td>
          <td class="py-3 px-3 text-xs font-mono font-semibold text-white">$${Number(v.price || 0).toFixed(2)}</td>
          <td class="py-3 px-3 text-right">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${v.stock > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
              ${v.stock} in stock
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const attributesChipsHtml = this.renderProductAttributesChips(product.id, product.attributes);

    this.modalContainer.innerHTML = `
      <div id="product-modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div class="bento-card w-full max-w-2xl rounded-3xl p-6 sm:p-8 relative border border-zinc-700/80 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          
          <!-- Close Button -->
          <button type="button" id="close-product-modal-btn" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer" aria-label="Close modal">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <!-- VIEW MODE -->
          <div id="product-modal-view-mode" class="space-y-6">
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              <div class="w-full sm:w-1/2 shrink-0">
                ${imageHtml}
              </div>
              <div class="w-full sm:w-1/2 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${product.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}">
                      ${product.isActive !== false ? 'Active' : 'Draft'}
                    </span>
                    <span class="text-zinc-500 text-xs font-mono">ID #${product.id}</span>
                  </div>
                  <h2 class="text-xl sm:text-2xl font-extrabold text-white leading-tight">${this._escape(product.name)}</h2>
                  <div class="text-2xl font-extrabold text-white mt-2">$${Number(product.price || 0).toFixed(2)}</div>
                </div>

                <p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">${this._escape(product.description || 'No description provided.')}</p>

                <!-- Interactive Attributes Management Section in Modal -->
                <div class="pt-3 border-t border-zinc-800">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Product Attributes:</span>
                    <span class="text-[10px] text-zinc-500 flex items-center gap-1">
                      <i class="fa-solid fa-bolt text-amber-400 text-[9px]"></i> Live Sync
                    </span>
                  </div>
                  <div id="modal-attributes-container">
                    ${attributesChipsHtml}
                  </div>
                </div>
              </div>
            </div>

            <!-- Variants Table -->
            <div class="pt-4 border-t border-zinc-800">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Product Variants (${variants.length})</h3>
                <span class="text-[11px] text-zinc-500">Live inventory status</span>
              </div>
              
              ${variants.length > 0 ? `
                <div class="overflow-x-auto no-scrollbar border border-zinc-800/80 rounded-2xl bg-[#0d0d10]/60">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-500 tracking-wider">
                        <th class="py-2.5 px-3">SKU</th>
                        <th class="py-2.5 px-3">Attributes</th>
                        <th class="py-2.5 px-3">Price</th>
                        <th class="py-2.5 px-3 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-800/60">
                      ${variantsRows}
                    </tbody>
                  </table>
                </div>
              ` : `
                <div class="p-4 rounded-xl bg-zinc-900/40 text-center text-xs text-zinc-500">No variants registered for this product.</div>
              `}
            </div>

            <!-- Footer Actions -->
            <div class="pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span class="text-[11px] text-zinc-500">Workspace #${product.workspaceId}</span>
              <div class="flex items-center gap-3">
                <button type="button" id="start-edit-product-btn" class="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md">
                  <i class="fa-solid fa-pen-to-square text-xs"></i>
                  <span>Edit Product</span>
                </button>
                <button type="button" id="cancel-product-modal-btn" class="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>

          <!-- EDIT FORM MODE -->
          <div id="product-modal-edit-mode" class="hidden space-y-5">
            <div class="pb-3 border-b border-zinc-800">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-pen-to-square text-zinc-400"></i>
                <span>Edit Product Details</span>
              </h2>
              <p class="text-xs text-zinc-400 mt-0.5">Modify information for SKU catalog sync.</p>
            </div>

            <form id="product-edit-form" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Product Name</label>
                <input 
                  type="text" 
                  id="edit-product-name" 
                  value="${this._escape(product.name)}" 
                  required 
                  class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    id="edit-product-price" 
                    value="${product.price || 0}" 
                    required 
                    class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Status</label>
                  <select 
                    id="edit-product-status" 
                    class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="true" ${product.isActive !== false ? 'selected' : ''}>Active</option>
                    <option value="false" ${product.isActive === false ? 'selected' : ''}>Draft / Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Image URL</label>
                <input 
                  type="url" 
                  id="edit-product-image" 
                  value="${this._escape(product.imageUrl || '')}" 
                  placeholder="https://..." 
                  class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Description</label>
                <textarea 
                  id="edit-product-description" 
                  rows="3" 
                  class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
                >${this._escape(product.description || '')}</textarea>
              </div>

              <div id="product-edit-feedback" class="hidden text-xs py-2 px-3 rounded-lg"></div>

              <div class="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button type="button" id="delete-product-btn" class="border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer">
                  <i class="fa-solid fa-trash text-xs"></i>
                  <span>Delete Product</span>
                </button>
                <div class="flex items-center gap-3">
                  <button type="button" id="cancel-edit-mode-btn" class="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" id="save-product-changes-btn" class="bg-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md">
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    `;

    // Bind Modal Attributes Management Events
    const modalAttrsContainer = document.getElementById('modal-attributes-container');
    const refreshModalAttributes = (updatedProduct) => {
      if (updatedProduct && updatedProduct.attributes !== undefined) {
        product.attributes = updatedProduct.attributes;
      }
      if (modalAttrsContainer) {
        modalAttrsContainer.innerHTML = this.renderProductAttributesChips(product.id, product.attributes);
        this.bindProductAttributesEvents(modalAttrsContainer, modalAttrHandlers);
      }
    };

    const modalAttrHandlers = {
      onAddAttribute: async (pid, val) => {
        if (onAddAttribute) {
          const res = await onAddAttribute(pid, val);
          refreshModalAttributes(res);
          return res;
        }
      },
      onEditAttribute: async (pid, oldVal, newVal) => {
        if (onEditAttribute) {
          const res = await onEditAttribute(pid, oldVal, newVal);
          refreshModalAttributes(res);
          return res;
        }
      },
      onDeleteAttribute: async (pid, val) => {
        if (onDeleteAttribute) {
          const res = await onDeleteAttribute(pid, val);
          refreshModalAttributes(res);
          return res;
        }
      }
    };

    this.bindProductAttributesEvents(modalAttrsContainer, modalAttrHandlers);

    // Event handlers for modal modes
    const viewMode = document.getElementById('product-modal-view-mode');
    const editMode = document.getElementById('product-modal-edit-mode');
    const startEditBtn = document.getElementById('start-edit-product-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-mode-btn');
    const deleteBtn = document.getElementById('delete-product-btn');
    const closeBtn = document.getElementById('close-product-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-product-modal-btn');
    const backdrop = document.getElementById('product-modal-backdrop');
    const editForm = document.getElementById('product-edit-form');

    if (startEditBtn && viewMode && editMode) {
      startEditBtn.onclick = () => {
        viewMode.classList.add('hidden');
        editMode.classList.remove('hidden');
        if (onEdit) onEdit(product);
      };
    }

    if (cancelEditBtn && viewMode && editMode) {
      cancelEditBtn.onclick = () => {
        editMode.classList.add('hidden');
        viewMode.classList.remove('hidden');
      };
    }

    const handleClose = () => this.closeProductDetailsModal();
    if (closeBtn) closeBtn.onclick = handleClose;
    if (cancelModalBtn) cancelModalBtn.onclick = handleClose;
    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) handleClose();
      };
    }

    if (editForm && onSave) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('save-product-changes-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<svg class="animate-spin h-3.5 w-3.5 inline text-black mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...`;
        }

        const updateData = {
          name: document.getElementById('edit-product-name')?.value.trim() || product.name,
          price: document.getElementById('edit-product-price')?.value || product.price,
          description: document.getElementById('edit-product-description')?.value.trim() || product.description,
          imageUrl: document.getElementById('edit-product-image')?.value.trim() || product.imageUrl,
          isActive: document.getElementById('edit-product-status')?.value === 'true'
        };

        try {
          await onSave(product.id, updateData);
          this.closeProductDetailsModal();
        } catch (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
          }
          const fb = document.getElementById('product-edit-feedback');
          if (fb) {
            fb.className = "text-xs py-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 block";
            fb.textContent = err.serverMessage || err.message || "Failed to update product.";
          }
        }
      };
    }

    if (deleteBtn && onDelete) {
      deleteBtn.onclick = async () => {
        const confirmDelete = window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        deleteBtn.disabled = true;
        deleteBtn.innerHTML = `<svg class="animate-spin h-3.5 w-3.5 inline text-rose-400 mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Deleting...`;

        try {
          await onDelete(product.id);
          this.closeProductDetailsModal();
        } catch (err) {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = `<i class="fa-solid fa-trash text-xs"></i><span>Delete Product</span>`;
          const fb = document.getElementById('product-edit-feedback');
          if (fb) {
            fb.className = "text-xs py-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 block";
            fb.textContent = err.serverMessage || err.message || "Failed to delete product.";
          }
        }
      };
    }
  }

  closeProductDetailsModal() {
    if (this.modalContainer) {
      this.modalContainer.innerHTML = '';
    }
  }

  /**
   * Opens the Create Product Modal with full attribute and variant configuration
   */
  openCreateProductModal({ workspaceId, onSubmit }) {
    if (!this.modalContainer) {
      this.modalContainer = document.getElementById('modal-container');
    }
    if (!this.modalContainer) return;

    let attributesList = ['Size', 'Color'];

    this.modalContainer.innerHTML = `
      <div id="create-product-modal-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div class="bento-card w-full max-w-2xl rounded-3xl p-6 sm:p-8 relative border border-zinc-700/80 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          
          <!-- Close Button -->
          <button type="button" id="close-create-product-modal-btn" class="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer" aria-label="Close modal">
            <i class="fa-solid fa-xmark text-sm"></i>
          </button>

          <div class="pb-4 border-b border-zinc-800">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm shadow-md">
                <i class="fa-solid fa-box-open"></i>
              </div>
              <h2 class="text-lg sm:text-xl font-bold text-white tracking-tight">Add New Product</h2>
            </div>
            <p class="text-xs text-zinc-400 mt-1">Create a catalog item with attributes and inventory for Workspace #${workspaceId || ''}</p>
          </div>

          <form id="create-product-form" class="space-y-5 mt-5">
            <div id="create-product-feedback" class="hidden text-xs py-2.5 px-3.5 rounded-xl"></div>

            <!-- Field: Name -->
            <div>
              <label for="new-product-name" class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Product Name <span class="text-rose-400">*</span>
              </label>
              <input 
                type="text" 
                id="new-product-name" 
                required 
                placeholder="e.g. Signature Cotton Hoodie" 
                class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition"
              />
            </div>

            <!-- Grid: Price & Status -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="new-product-price" class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Base Price ($) <span class="text-rose-400">*</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <span class="text-xs font-mono font-bold">$</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    id="new-product-price" 
                    required 
                    placeholder="49.99" 
                    class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition"
                  />
                </div>
              </div>

              <div>
                <label for="new-product-status" class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Initial Status
                </label>
                <select 
                  id="new-product-status" 
                  class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  <option value="true" selected>Active (Storefront Visible)</option>
                  <option value="false">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            <!-- Field: Image URL -->
            <div>
              <label for="new-product-image" class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Image URL (Optional)
              </label>
              <input 
                type="url" 
                id="new-product-image" 
                placeholder="https://images.unsplash.com/..." 
                class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <!-- Field: Description -->
            <div>
              <label for="new-product-description" class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Description (Optional)
              </label>
              <textarea 
                id="new-product-description" 
                rows="2" 
                placeholder="Brief summary of fabric, specs, or styling notes..." 
                class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
              ></textarea>
            </div>

            <!-- Section: Product Attributes Tag Manager -->
            <div class="pt-3 border-t border-zinc-800/80">
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Product Attributes <span class="text-rose-400">*</span>
                </label>
                <span class="text-[10px] text-zinc-500">Dimensions (e.g. Size, Color, Material)</span>
              </div>
              
              <div class="p-3 rounded-2xl bg-[#0d0d10] border border-zinc-800 space-y-2.5">
                <div id="new-product-attributes-tags" class="flex flex-wrap gap-1.5 min-h-[28px]">
                  <!-- Rendered dynamically -->
                </div>
                
                <div class="flex items-center gap-2">
                  <input 
                    type="text" 
                    id="new-product-attr-input" 
                    placeholder="Add an attribute (e.g. Material) and press Enter" 
                    class="flex-1 bg-[#18181b] border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                  <button 
                    type="button" 
                    id="new-product-add-attr-btn" 
                    class="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <!-- Section: Initial Variant Setup -->
            <div class="pt-3 border-t border-zinc-800/80">
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Initial Stock & SKU <span class="text-rose-400">*</span>
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input 
                    type="text" 
                    id="new-product-sku" 
                    placeholder="SKU (e.g. HOODIE-BLK-01)" 
                    class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    min="1" 
                    id="new-product-stock" 
                    value="25" 
                    placeholder="Initial Stock" 
                    class="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button 
                type="button" 
                id="cancel-create-product-btn" 
                class="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                id="submit-create-product-btn" 
                class="bg-white hover:bg-zinc-200 text-black px-6 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Create Product</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    // Render attribute tags inside modal
    const tagsContainer = document.getElementById('new-product-attributes-tags');
    const attrInput = document.getElementById('new-product-attr-input');
    const addAttrBtn = document.getElementById('new-product-add-attr-btn');

    const renderTags = () => {
      if (!tagsContainer) return;
      if (attributesList.length === 0) {
        tagsContainer.innerHTML = `<span class="text-xs text-zinc-500 italic">No attributes added yet.</span>`;
        return;
      }
      tagsContainer.innerHTML = attributesList.map(a => `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-medium">
          <span>${this._escape(a)}</span>
          <button type="button" class="remove-tag-btn text-zinc-500 hover:text-rose-400 p-0.5 cursor-pointer text-[10px]" data-tag="${this._escape(a)}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </span>
      `).join('');

      tagsContainer.querySelectorAll('.remove-tag-btn').forEach(btn => {
        btn.onclick = () => {
          const tag = btn.dataset.tag;
          attributesList = attributesList.filter(t => t !== tag);
          renderTags();
        };
      });
    };

    renderTags();

    const addTag = () => {
      const val = attrInput?.value.trim();
      if (!val) return;
      if (!attributesList.includes(val)) {
        attributesList.push(val);
        renderTags();
      }
      if (attrInput) {
        attrInput.value = '';
        attrInput.focus();
      }
    };

    if (addAttrBtn) addAttrBtn.onclick = addTag;
    if (attrInput) {
      attrInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addTag();
        }
      };
    }

    // Modal controls
    const closeBtn = document.getElementById('close-create-product-modal-btn');
    const cancelBtn = document.getElementById('cancel-create-product-btn');
    const backdrop = document.getElementById('create-product-modal-backdrop');
    const form = document.getElementById('create-product-form');

    const handleClose = () => this.closeProductDetailsModal();
    if (closeBtn) closeBtn.onclick = handleClose;
    if (cancelBtn) cancelBtn.onclick = handleClose;
    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) handleClose();
      };
    }

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-create-product-btn');
        const feedback = document.getElementById('create-product-feedback');

        if (attributesList.length === 0) {
          if (feedback) {
            feedback.className = "text-xs py-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 block";
            feedback.textContent = "Please add at least one product attribute (e.g. Size, Color).";
          }
          return;
        }

        const name = document.getElementById('new-product-name')?.value.trim();
        const price = parseFloat(document.getElementById('new-product-price')?.value || '0');
        const isActive = document.getElementById('new-product-status')?.value === 'true';
        const imageUrl = document.getElementById('new-product-image')?.value.trim() || null;
        const description = document.getElementById('new-product-description')?.value.trim() || null;
        const sku = document.getElementById('new-product-sku')?.value.trim() || `${name.replace(/\s+/g, '-').toUpperCase().slice(0, 8)}-01`;
        const stock = parseInt(document.getElementById('new-product-stock')?.value || '10', 10);

        // Build default variant attributes map
        const variantAttributes = {};
        attributesList.forEach(a => {
          variantAttributes[a] = 'Standard';
        });

        const productPayload = {
          workspaceId: Number(workspaceId),
          name,
          price,
          isActive,
          imageUrl,
          description,
          attributes: attributesList,
          productVariants: [
            {
              sku,
              price,
              stock: isNaN(stock) ? 10 : stock,
              imageUrl,
              attributes: variantAttributes
            }
          ]
        };

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<svg class="animate-spin h-3.5 w-3.5 inline text-black mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...`;
        }

        try {
          if (onSubmit) {
            await onSubmit(productPayload);
          }
          this.closeProductDetailsModal();
        } catch (err) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-plus text-xs"></i><span>Create Product</span>`;
          }
          if (feedback) {
            feedback.className = "text-xs py-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 block";
            feedback.textContent = err.serverMessage || err.message || "Failed to create product.";
          }
        }
      };
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
