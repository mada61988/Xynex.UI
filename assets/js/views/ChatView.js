export class ChatView {
  constructor() {
    this.filterWorkspace = document.getElementById('filter-workspace');
    this.filterChannel = document.getElementById('filter-channel');
    this.scopeSummaryText = document.getElementById('scope-summary-text');
    this.chatSearchInput = document.getElementById('chat-search-input');
    this.threadListContainer = document.getElementById('chats-thread-list');
    this.threadCardsContainer = document.getElementById('chats-thread-cards');
    this.scrollSentinel = document.getElementById('chats-scroll-sentinel');
    this.activeChatContainer = document.getElementById('active-chat-container');
    this.activeChatContext = document.getElementById('active-chat-context');
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

  getPlatformIcon(platform) {
    const p = String(platform || '').toLowerCase().trim();
    switch (p) {
      case 'instagram':
        return `<i class="fa-brands fa-instagram text-pink-500 text-xs shrink-0"></i>`;
      case 'facebook':
        return `<i class="fa-brands fa-facebook text-blue-500 text-xs shrink-0"></i>`;
      case 'whatsapp':
        return `<i class="fa-brands fa-whatsapp text-emerald-400 text-xs shrink-0"></i>`;
      case 'telegram':
        return `<i class="fa-brands fa-telegram text-sky-400 text-xs shrink-0"></i>`;
      case 'webchat':
        return `<i class="fa-solid fa-comments text-amber-400 text-xs shrink-0"></i>`;
      default:
        return `<i class="fa-solid fa-message text-zinc-400 text-xs shrink-0"></i>`;
    }
  }

  formatChatTimestamp(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  renderThreadCardHtml(chat, isActive) {
    const activeClasses = isActive
      ? 'p-4 bg-zinc-800/40 border-l-2 border-l-white cursor-pointer hover:bg-zinc-800/60 transition'
      : 'p-4 hover:bg-zinc-800/20 border-l-2 border-l-transparent cursor-pointer transition';

    const platformIcon = this.getPlatformIcon(chat.platform);
    const formattedTime = this.formatChatTimestamp(chat.timestamp);
    const title = this._escape(chat.title);
    const snippet = this._escape(chat.snippet);
    const workspaceName = this._escape(chat.workspaceName);

    // Context badge (Cart / Order status or channel type)
    let badgeHtml = '';
    if (chat.cartId || chat.cart) {
      const cartNum = chat.cartId || (chat.cart && chat.cart.id) || 502;
      badgeHtml = `<span class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full">Cart #${this._escape(cartNum)}</span>`;
    } else {
      badgeHtml = `<span class="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700 capitalize">${this._escape(chat.platform || 'Inquiry')}</span>`;
    }

    return `
      <div class="chat-thread-card ${activeClasses}" data-chat-id="${chat.id}">
        <div class="flex justify-between items-start mb-1.5">
          <div class="flex items-center gap-2 min-w-0 pr-2">
            ${platformIcon}
            <span class="font-bold text-white text-xs truncate max-w-[140px]">${title}</span>
          </div>
          <span class="text-[10px] text-zinc-500 font-mono shrink-0">${formattedTime}</span>
        </div>
        <div class="text-xs text-zinc-300 truncate mb-2">${snippet}</div>
        <div class="flex items-center justify-between text-[10px]">
          <span class="text-zinc-500 font-mono truncate max-w-[120px]">${workspaceName}</span>
          ${badgeHtml}
        </div>
      </div>
    `;
  }

  renderThreadCards(chats, activeChatId) {
    if (!this.threadCardsContainer) return;
    this.threadCardsContainer.innerHTML = chats.map(chat => {
      const isActive = String(chat.id) === String(activeChatId);
      return this.renderThreadCardHtml(chat, isActive);
    }).join('');
  }

  appendThreadCards(newChats, activeChatId) {
    if (!this.threadCardsContainer) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newChats.map(chat => {
      const isActive = String(chat.id) === String(activeChatId);
      return this.renderThreadCardHtml(chat, isActive);
    }).join('');

    while (tempDiv.firstChild) {
      this.threadCardsContainer.appendChild(tempDiv.firstChild);
    }
  }

  setActiveCard(activeChatId) {
    if (!this.threadCardsContainer) return;
    const cards = this.threadCardsContainer.querySelectorAll('.chat-thread-card');
    cards.forEach(card => {
      if (card.dataset.chatId === String(activeChatId)) {
        card.className = 'chat-thread-card p-4 bg-zinc-800/40 border-l-2 border-l-white cursor-pointer hover:bg-zinc-800/60 transition';
      } else {
        card.className = 'chat-thread-card p-4 hover:bg-zinc-800/20 border-l-2 border-l-transparent cursor-pointer transition';
      }
    });
  }

  renderThreadListLoading(isInitial = true) {
    if (!this.threadCardsContainer) return;
    if (isInitial) {
      this.threadCardsContainer.innerHTML = Array(4).fill(0).map(() => `
        <div class="p-4 border-l-2 border-l-transparent animate-pulse space-y-2.5">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="w-3.5 h-3.5 bg-zinc-800 rounded-full"></div>
              <div class="h-3 bg-zinc-800 rounded w-24"></div>
            </div>
            <div class="h-2.5 bg-zinc-800 rounded w-10"></div>
          </div>
          <div class="h-2.5 bg-zinc-800/70 rounded w-3/4"></div>
          <div class="flex justify-between items-center pt-1">
            <div class="h-2 bg-zinc-800/50 rounded w-16"></div>
            <div class="h-3.5 bg-zinc-800/60 rounded-full w-12"></div>
          </div>
        </div>
      `).join('');
    }
  }

  renderThreadListEmpty(message = "No conversations found.") {
    if (!this.threadCardsContainer) return;
    this.threadCardsContainer.innerHTML = `
      <div class="p-8 text-center text-zinc-500 flex flex-col items-center justify-center">
        <i class="fa-solid fa-inbox text-2xl text-zinc-700 mb-2"></i>
        <div class="text-xs font-semibold text-zinc-400">${this._escape(message)}</div>
        <div class="text-[10px] text-zinc-600 mt-1">Threads will appear once customers send direct messages.</div>
      </div>
    `;
  }

  showScrollSentinel() {
    if (this.scrollSentinel) {
      this.scrollSentinel.classList.remove('hidden');
    }
  }

  hideScrollSentinel() {
    if (this.scrollSentinel) {
      this.scrollSentinel.classList.add('hidden');
    }
  }

  renderActiveChat(chat) {
    if (!this.activeChatContainer) return;

    const title = this._escape(chat.title);
    const platform = this._escape(chat.platform || 'webchat');
    const workspaceName = this._escape(chat.workspaceName || 'Workspace');
    const channelId = this._escape(chat.channelId || 'ch_default');
    const snippet = this._escape(chat.snippet || 'No message snippet');
    const timestamp = this.formatChatTimestamp(chat.timestamp);

    // Generate Initials
    const initials = title
      .split(' ')
      .map(w => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CX';

    // Platform Tag Color
    const platformColors = {
      instagram: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      facebook: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      whatsapp: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      telegram: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      webchat: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
    const pillClass = platformColors[platform.toLowerCase()] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

    // PANE 2: Live Chat Timeline
    this.activeChatContainer.innerHTML = `
      <!-- Active Chat Header -->
      <div class="h-14 border-b border-zinc-800 px-6 flex items-center justify-between shrink-0 bg-[#0d0d10]">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shrink-0">
            <div class="w-full h-full bg-[#111114] rounded-full flex items-center justify-center text-xs font-bold text-white">
              ${initials}
            </div>
          </div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-white flex items-center gap-2 truncate">
              <span class="truncate">${title}</span>
              <span class="${pillClass} border text-[10px] px-1.5 py-0.2 rounded capitalize shrink-0">${platform}</span>
            </div>
            <div class="text-[10px] text-zinc-500 font-mono truncate">Channel ID: ${channelId} • Workspace: ${workspaceName}</div>
          </div>
        </div>

        <!-- Bot Pause Toggle -->
        <button type="button" class="bg-zinc-900 border border-zinc-700 hover:border-rose-500/50 text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition flex items-center gap-2 shrink-0">
          <i class="fa-solid fa-hand text-rose-400"></i>
          <span class="hidden sm:inline">Pause AI Agent</span>
        </button>
      </div>

      <!-- Chat Stream -->
      <div class="flex-1 overflow-y-auto p-6 space-y-5">
        <!-- Customer Msg -->
        <div class="flex flex-col items-start max-w-md">
          <span class="text-[10px] text-zinc-500 mb-1">Customer • ${timestamp}</span>
          <div class="bg-zinc-800 text-white p-3 rounded-2xl rounded-tl-sm text-xs border border-zinc-700/60 leading-relaxed">
            ${snippet}
          </div>
        </div>

        <!-- System Execution Tag -->
        <div class="flex justify-center">
          <div class="bg-[#0d0d10] border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] font-mono text-zinc-400 flex items-center gap-2 shadow-sm">
            <i class="fa-solid fa-bolt text-amber-400"></i>
            <span>Vision Engine Synced: <strong class="text-white">Active Product Match</strong></span>
            <span class="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">LIVE</span>
          </div>
        </div>

        <!-- AI Bot Msg -->
        <div class="flex flex-col items-end max-w-md ml-auto">
          <span class="text-[10px] text-zinc-500 mb-1">Xynex AI • Just now</span>
          <div class="bg-white text-black font-medium p-3 rounded-2xl rounded-tr-sm text-xs shadow-sm leading-relaxed">
            I am currently handling customer inquiries on ${platform}. Live catalog SKU checkout links are dispatched directly to the customer.
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="p-4 border-t border-zinc-800 bg-[#0d0d10]">
        <div class="relative">
          <input type="text" placeholder="AI Agent is actively handling this thread. Type here to intervene..." class="w-full bg-[#111114] border border-zinc-800 rounded-xl pl-4 pr-20 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700">
          <button type="button" class="absolute right-2 top-1.5 bg-zinc-800 text-zinc-400 hover:text-white px-3 py-1 rounded-lg text-xs font-semibold transition">Send</button>
        </div>
      </div>
    `;

    // PANE 3: Context & Metadata
    if (this.activeChatContext) {
      this.activeChatContext.innerHTML = `
        <!-- Active Order State -->
        <div>
          <h3 class="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Active Order State</h3>
          <div class="bg-[#111114] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-white">Cart #${this._escape(chat.cartId || 502)}</span>
              <span class="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">CONFIRMED</span>
            </div>
            <div class="border-t border-zinc-800/80 pt-2 flex justify-between text-xs">
              <span class="text-zinc-400">Total Price</span>
              <span class="font-mono text-white font-bold">$280.00</span>
            </div>
          </div>
        </div>

        <!-- Channel Telemetry -->
        <div>
          <h3 class="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Channel Telemetry</h3>
          <div class="bg-[#111114] border border-zinc-800 rounded-2xl p-4 space-y-2.5 text-xs shadow-sm">
            <div class="flex justify-between">
              <span class="text-zinc-400">Channel</span>
              <span class="text-white font-medium capitalize flex items-center gap-1.5">
                ${this.getPlatformIcon(chat.platform)}
                ${platform}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-400">Latency</span>
              <span class="text-emerald-400 font-mono font-semibold">0.78s</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-400">Webhook Status</span>
              <span class="text-emerald-400 font-medium">200 OK</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  renderNoActiveChat() {
    if (this.activeChatContainer) {
      this.activeChatContainer.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
          <i class="fa-solid fa-inbox text-3xl mb-3 text-zinc-700"></i>
          <p class="text-xs font-semibold text-zinc-400">Select a conversation</p>
          <p class="text-[11px] text-zinc-600 mt-1 max-w-xs">Choose a thread from the inbox list to inspect messages, AI actions, and live telemetry.</p>
        </div>
      `;
    }
    if (this.activeChatContext) {
      this.activeChatContext.innerHTML = `
        <div class="p-4 text-center text-zinc-600 text-xs">
          No conversation context selected
        </div>
      `;
    }
  }

  populateWorkspaceFilterOptions(workspaces, currentSelectedId) {
    if (!this.filterWorkspace) return;
    const wsList = Array.isArray(workspaces) ? workspaces : [];

    let optionsHtml = `<option value="all" class="bg-[#111114] text-white">All Workspaces</option>`;
    optionsHtml += wsList.map(ws => `
      <option value="${ws.id}" class="bg-[#111114] text-white" ${String(ws.id) === String(currentSelectedId) ? 'selected' : ''}>
        ${this._escape(ws.name || `Workspace #${ws.id}`)}
      </option>
    `).join('');

    this.filterWorkspace.innerHTML = optionsHtml;
  }

  updateScopeSummary(workspaceText, channelText) {
    if (this.scopeSummaryText) {
      this.scopeSummaryText.textContent = `Showing: ${workspaceText} / ${channelText}`;
    }
  }

  getSelectedWorkspaceText() {
    if (!this.filterWorkspace) return '';
    const sel = this.filterWorkspace.selectedOptions[0];
    return sel ? sel.textContent.trim() : '';
  }

  getSelectedChannelText() {
    if (!this.filterChannel) return '';
    const sel = this.filterChannel.selectedOptions[0];
    return sel ? sel.textContent.trim() : '';
  }

  bindWorkspaceFilter(handler) {
    if (this.filterWorkspace) {
      this.filterWorkspace.addEventListener('change', (e) => {
        handler(e.target.value);
      });
    }
  }

  bindChannelFilter(handler) {
    if (this.filterChannel) {
      this.filterChannel.addEventListener('change', (e) => {
        handler(e.target.value);
      });
    }
  }

  bindSearchInput(handler) {
    if (this.chatSearchInput) {
      this.chatSearchInput.addEventListener('input', (e) => {
        handler(e.target.value.trim());
      });
    }
  }

  bindThreadCardSelect(handler) {
    if (this.threadCardsContainer) {
      this.threadCardsContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.chat-thread-card');
        if (card && card.dataset.chatId) {
          handler(card.dataset.chatId);
        }
      });
    }
  }
}
