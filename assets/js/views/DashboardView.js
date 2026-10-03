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
    this.usersTableContainer = document.getElementById('users-table-container');
    this.usersCountBadge = document.getElementById('users-count-badge');

    // Channels dropdown elements
    this.channelsWrapper = document.getElementById('channels-dropdown-wrapper');
    this.channelsBtn = document.getElementById('channels-dropdown-btn');
    this.channelsMenu = document.getElementById('channels-dropdown-menu');
    this.channelsList = document.getElementById('channels-dropdown-list');
    this.selectedChannelIcon = document.getElementById('selected-channel-icon');
    this.selectedChannelName = document.getElementById('selected-channel-name');
    this.selectedProfileId = null;

    // Callbacks for role editing
    this.onEditRoleClick = null;
    this.onSaveRoleClick = null;

    this._bindChannelsDropdownEvents();
  }

  _bindChannelsDropdownEvents() {
    if (this.channelsBtn && this.channelsMenu) {
      this.channelsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.channelsMenu.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (this.channelsWrapper && !this.channelsWrapper.contains(e.target)) {
          this.channelsMenu.classList.add('hidden');
        }
      });
    }

    if (this.channelsList) {
      this.channelsList.addEventListener('click', (e) => {
        const item = e.target.closest('.channel-item');
        if (item) {
          const profileId = Number(item.dataset.profileId) || item.dataset.profileId;
          const channel = item.dataset.channel;
          const name = item.dataset.name;

          this.selectedProfileId = profileId;
          if (this.selectedChannelIcon) {
            this.selectedChannelIcon.innerHTML = this._getChannelIcon(channel);
          }
          if (this.selectedChannelName) {
            this.selectedChannelName.textContent = name;
          }
          if (this.channelsMenu) {
            this.channelsMenu.classList.add('hidden');
          }

          this.channelsList.querySelectorAll('.channel-item').forEach(btn => {
            if (btn === item) {
              btn.classList.add('bg-zinc-800/90', 'text-white', 'font-semibold');
              btn.classList.remove('text-zinc-300');
            } else {
              btn.classList.remove('bg-zinc-800/90', 'text-white', 'font-semibold');
              btn.classList.add('text-zinc-300');
            }
          });
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
    if (sectionName === 'users') {
      if (this.overviewSection) this.overviewSection.classList.add('hidden');
      if (this.usersSection) this.usersSection.classList.remove('hidden');
    } else {
      if (this.overviewSection) this.overviewSection.classList.remove('hidden');
      if (this.usersSection) this.usersSection.classList.add('hidden');
    }
    this.setActiveSidebarLink(sectionName);
  }

  renderMetrics(metrics) {
    console.log("DashboardView: Telemetry ready.");
  }

  setProfilesLoading() {
    const card = document.getElementById('card-metric-profiles');
    const icon = document.getElementById('icon-metric-profiles');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const elCount = document.getElementById('metric-profiles-count');
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

    const elPercentage = document.getElementById('metric-profiles-percentage');
    if (elPercentage) {
      elPercentage.className = "text-zinc-500 font-medium flex items-center gap-1";
      elPercentage.textContent = "Connecting to API...";
    }
  }

  renderProfilesMetric({ total, active, percentage }) {
    const card = document.getElementById('card-metric-profiles');
    const icon = document.getElementById('icon-metric-profiles');
    if (card) card.classList.remove('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-white transition";
    }

    const elCount = document.getElementById('metric-profiles-count');
    const elPercentage = document.getElementById('metric-profiles-percentage');
    const elSubtext = document.getElementById('metric-profiles-subtext');

    if (elCount) {
      elCount.className = "text-3xl font-extrabold text-white tracking-tight mb-2";
      elCount.textContent = `${total} / ${active}`;
    }

    if (elPercentage) {
      const pct = Math.round(Number(percentage) || 0);
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
      elSubtext.textContent = `· ${active} Active of ${total}`;
    }
  }

  renderProfilesError(errorMessage) {
    const card = document.getElementById('card-metric-profiles');
    const icon = document.getElementById('icon-metric-profiles');
    if (card) card.classList.add('border-rose-500/30');
    if (icon) {
      icon.className = "w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 transition";
    }

    const elCount = document.getElementById('metric-profiles-count');
    const elPercentage = document.getElementById('metric-profiles-percentage');
    const elSubtext = document.getElementById('metric-profiles-subtext');

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

  renderChannelsDropdown(profiles, errorMessage = null) {
    if (!this.channelsList || !this.selectedChannelName) return;

    if (errorMessage || !profiles || profiles.length === 0) {
      if (this.selectedChannelIcon) {
        this.selectedChannelIcon.innerHTML = `<i class="fa-solid fa-circle-nodes text-zinc-500"></i>`;
      }
      this.selectedChannelName.textContent = errorMessage ? 'Channels Error' : 'No Channels';
      this.channelsList.innerHTML = `
        <div class="px-3 py-2 text-xs text-zinc-500 text-center">
          ${this._escape(errorMessage || 'No channels available')}
        </div>
      `;
      return;
    }

    // Determine initial selected profile: prefer active, otherwise first
    let selected = profiles.find(p => p.id === this.selectedProfileId);
    if (!selected) {
      selected = profiles.find(p => Boolean(p.isActive)) || profiles[0];
      this.selectedProfileId = selected.id;
    }

    const selectedName = selected.username || selected.name || selected.handle || selected.title || `Profile #${selected.id}`;
    if (this.selectedChannelIcon) {
      this.selectedChannelIcon.innerHTML = this._getChannelIcon(selected.channel || selected.chanell);
    }
    this.selectedChannelName.textContent = selectedName;

    // Build the dropdown items
    this.channelsList.innerHTML = profiles.map(p => {
      const name = p.username || p.name || p.handle || p.title || `Profile #${p.id}`;
      const channel = p.channel || p.chanell || 'unknown';
      const isSelected = p.id === selected.id;
      const activeBadge = p.isActive 
        ? `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"><span class="w-1 h-1 rounded-full bg-emerald-400"></span>Active</span>`
        : `<span class="text-[10px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">Offline</span>`;

      return `
        <button 
          type="button" 
          class="channel-item w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-zinc-800/70 transition text-left cursor-pointer ${isSelected ? 'bg-zinc-800/90 text-white font-semibold' : 'text-zinc-300'}"
          data-profile-id="${p.id}"
          data-channel="${this._escape(channel)}"
          data-name="${this._escape(name)}"
        >
          <div class="flex items-center gap-2.5 min-w-0 pr-2">
            <span class="text-sm shrink-0">${this._getChannelIcon(channel)}</span>
            <div class="truncate">
              <div class="truncate text-white font-medium">${this._escape(name)}</div>
              <div class="text-[10px] text-zinc-500 capitalize">${this._escape(channel)}</div>
            </div>
          </div>
          <div class="shrink-0">
            ${activeBadge}
          </div>
        </button>
      `;
    }).join('');
  }

  _getChannelIcon(channel) {
    const ch = String(channel || '').toLowerCase().trim();
    switch (ch) {
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
      elTrend.className = "text-emerald-400 font-semibold flex items-center gap-0.5";
      elTrend.innerHTML = `<i class="fa-solid fa-arrow-trend-up text-[10px]"></i> Live Synced`;
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
