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

  /**
   * Formats a timestamp into relative time (e.g. "2m ago", "15s ago", "3h ago")
   */
  formatRelativeTime(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 0) return 'just now';
    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  formatChatTimestamp(ts) {
    return this.formatRelativeTime(ts);
  }

  _formatChannelLabel(ch) {
    const platform = (ch.platform || 'Channel').toUpperCase();
    const name = ch.name || ch.metaPageId || `ID #${ch.id}`;
    return `${platform} (${name})`;
  }

  renderThreadCardHtml(chat, isActive) {
    const activeClasses = isActive
      ? 'p-4 bg-zinc-800/40 border-l-2 border-l-white cursor-pointer hover:bg-zinc-800/60 transition'
      : 'p-4 hover:bg-zinc-800/20 border-l-2 border-l-transparent cursor-pointer transition';

    const platformIcon = this.getPlatformIcon(chat.platform);
    const relativeTime = this.formatRelativeTime(chat.lastMessageTimestamp || chat.timestamp);
    const heading = this._escape(chat.user_name || chat.title || 'Customer');
    const snippet = this._escape(chat.lastMessageSnippet || chat.snippet || 'No message snippet');
    const workspaceName = this._escape(chat.workspaceName || 'Workspace');

    // Context badge (Cart / Order status or platform badge)
    let badgeHtml = '';
    if (chat.cartId || chat.cart) {
      const cartNum = chat.cartId || (chat.cart && chat.cart.id) || 502;
      badgeHtml = `<span class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full text-[10px]">Cart #${this._escape(cartNum)}</span>`;
    } else {
      badgeHtml = `<span class="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700 capitalize text-[10px]">${this._escape(chat.platform || 'Direct')}</span>`;
    }

    return `
      <div class="chat-thread-card ${activeClasses}" data-chat-id="${chat.id}">
        <div class="flex justify-between items-start mb-1.5">
          <div class="flex items-center gap-2 min-w-0 pr-2">
            ${platformIcon}
            <span class="font-bold text-white text-xs truncate max-w-[140px]">${heading}</span>
          </div>
          <span class="text-[10px] text-zinc-500 font-mono shrink-0">${relativeTime}</span>
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

  setChatStreamLoading() {
    const stream = document.getElementById('active-chat-stream');
    if (stream) {
      stream.innerHTML = `
        <div class="py-16 flex flex-col items-center justify-center text-center text-zinc-500 gap-3">
          <svg class="animate-spin h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-xs font-mono text-zinc-400">Loading conversation history...</span>
        </div>
      `;
    }
  }

  _buildMessageBubbleHtml(msg, chat) {
    const sender = String(msg.sender || '').toLowerCase().trim();
    const isAgent = sender === 'agent' || sender === 'bot' || sender === 'ai';
    const msgText = this._escape(msg.text || msg.content || msg.body || '');
    const msgTime = this.formatRelativeTime(msg.createdAt || msg.timestamp);
    const customerName = this._escape(chat.userName || chat.user_name || chat.title || 'Customer');

    if (isAgent) {
      // Outgoing message for agent: displayed in blue background like Instagram DM with explicit sender tag
      return `
        <div class="flex flex-col items-end max-w-lg ml-auto space-y-1">
          <div class="flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold px-1">
            <i class="fa-solid fa-robot text-[9px]"></i>
            <span>Agent (AI Moderator)</span>
            ${msgTime ? `<span class="text-zinc-500 font-normal font-mono">• ${msgTime}</span>` : ''}
          </div>
          <div class="bg-[#0084ff] text-white p-3.5 rounded-2xl rounded-tr-sm text-xs shadow-md leading-relaxed break-words font-normal">
            ${msgText}
          </div>
        </div>
      `;
    }

    // Incoming message for user/customer: left-aligned with explicit sender tag
    return `
      <div class="flex flex-col items-start max-w-lg mr-auto space-y-1">
        <div class="flex items-center gap-1.5 text-[10px] text-zinc-300 font-semibold px-1">
          <i class="fa-regular fa-user text-[9px] text-zinc-400"></i>
          <span>${customerName}</span>
          ${msgTime ? `<span class="text-zinc-500 font-normal font-mono">• ${msgTime}</span>` : ''}
        </div>
        <div class="bg-zinc-800 text-zinc-100 p-3.5 rounded-2xl rounded-tl-sm text-xs border border-zinc-700/60 leading-relaxed break-words shadow-sm">
          ${msgText}
        </div>
      </div>
    `;
  }

  renderActiveChat(chat, messages = null) {
    if (!this.activeChatContainer) return;

    const heading = this._escape(chat.userName || chat.user_name || chat.title || 'Customer');
    const platform = this._escape(chat.platform || 'webchat');
    const workspaceName = this._escape(chat.workspaceName || 'Workspace');
    const channelId = this._escape(chat.channelId || 'ch_default');
    const channelName = this._escape(chat.channelName || platform);
    const snippet = this._escape(chat.lastMessageSnippet || chat.snippet || 'No message snippet');
    const relativeTime = this.formatRelativeTime(chat.lastMessageTimestamp || chat.timestamp);

    // Generate Initials
    const initials = heading
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

    // Build timeline messages HTML
    const msgList = Array.isArray(messages) ? messages : (Array.isArray(chat.messages) ? chat.messages : []);
    let messagesHtml = '';

    if (msgList.length > 0) {
      messagesHtml = msgList.map(msg => this._buildMessageBubbleHtml(msg, chat)).join('');
    } else {
      // Default initial message stream view
      messagesHtml = `
        <div class="flex flex-col items-start max-w-lg mr-auto space-y-1">
          <div class="flex items-center gap-1.5 text-[10px] text-zinc-300 font-semibold px-1">
            <i class="fa-regular fa-user text-[9px] text-zinc-400"></i>
            <span>${heading}</span>
            ${relativeTime ? `<span class="text-zinc-500 font-normal font-mono">• ${relativeTime}</span>` : ''}
          </div>
          <div class="bg-zinc-800 text-zinc-100 p-3.5 rounded-2xl rounded-tl-sm text-xs border border-zinc-700/60 leading-relaxed break-words shadow-sm">
            ${snippet}
          </div>
        </div>

        <!-- System Execution Tag -->
        <div class="flex justify-center my-3">
          <div class="bg-[#0d0d10] border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] font-mono text-zinc-400 flex items-center gap-2 shadow-sm">
            <i class="fa-solid fa-bolt text-amber-400"></i>
            <span>Conversation Connected: <strong class="text-white">${heading}</strong></span>
            <span class="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">LIVE</span>
          </div>
        </div>
      `;
    }

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
              <span class="truncate">${heading}</span>
              <span class="${pillClass} border text-[10px] px-1.5 py-0.2 rounded capitalize shrink-0">${platform}</span>
            </div>
            <div class="text-[10px] text-zinc-500 font-mono truncate">Channel: ${channelName} • Workspace: ${workspaceName}</div>
          </div>
        </div>

        <!-- Bot Pause Toggle -->
        <button type="button" class="bg-zinc-900 border border-zinc-700 hover:border-rose-500/50 text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer">
          <i class="fa-solid fa-hand text-rose-400"></i>
          <span class="hidden sm:inline">Pause AI Agent</span>
        </button>
      </div>

      <!-- Chat Stream -->
      <div id="active-chat-stream" class="flex-1 overflow-y-auto p-6 space-y-4">
        ${messagesHtml}
      </div>

      <!-- Chat Input Intervene -->
      <div class="p-4 border-t border-zinc-800 bg-[#0d0d10]">
        <div class="relative">
          <input type="text" placeholder="AI Agent is actively handling this thread. Type here to intervene..." class="w-full bg-[#111114] border border-zinc-800 rounded-xl pl-4 pr-20 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700">
          <button type="button" class="absolute right-2 top-1.5 bg-zinc-800 text-zinc-400 hover:text-white px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer">Send</button>
        </div>
      </div>
    `;

    // PANE 3: Context & Metadata
    if (this.activeChatContext) {
      const cartObj = chat.cart;
      const cartId = cartObj?.id || chat.cartId || 557;
      const currency = cartObj?.currencyCode || 'USD';
      const totalPrice = cartObj?.totalPrice !== undefined ? Number(cartObj.totalPrice).toFixed(2) : '0.00';
      const itemsCount = Array.isArray(cartObj?.items) ? cartObj.items.length : 0;

      let pendingHtml = '';
      if (chat.pendingSelections && chat.pendingSelections.productId) {
        pendingHtml = `
          <div class="border-t border-zinc-800/80 pt-2.5 mt-2.5 text-xs space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <i class="fa-solid fa-cart-arrow-down text-[9px]"></i> Pending Selection
            </span>
            <div class="text-zinc-300 font-mono text-[11px]">Product SKU #${this._escape(chat.pendingSelections.productId)}</div>
          </div>
        `;
      }

      this.activeChatContext.innerHTML = `
        <!-- Active Order State -->
        <div>
          <h3 class="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Active Order State</h3>
          <div class="bg-[#111114] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-white">Cart #${this._escape(cartId)}</span>
              <span class="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">ACTIVE</span>
            </div>
            <div class="border-t border-zinc-800/80 pt-2 flex justify-between text-xs">
              <span class="text-zinc-400">Total Price</span>
              <span class="font-mono text-white font-bold">${this._escape(currency)} ${this._escape(totalPrice)}</span>
            </div>
            <div class="flex justify-between text-[11px] text-zinc-500">
              <span>Items in cart</span>
              <span>${itemsCount} item(s)</span>
            </div>
            ${pendingHtml}
          </div>
        </div>

        <!-- Channel Telemetry -->
        <div>
          <h3 class="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3">Channel Telemetry</h3>
          <div class="bg-[#111114] border border-zinc-800 rounded-2xl p-4 space-y-2.5 text-xs shadow-sm">
            <div class="flex justify-between">
              <span class="text-zinc-400">Platform</span>
              <span class="text-white font-medium capitalize flex items-center gap-1.5">
                ${this.getPlatformIcon(chat.platform)}
                ${platform}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-400">Channel ID</span>
              <span class="text-white font-mono">#${channelId}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-zinc-400">Sender ID</span>
              <span class="text-zinc-400 font-mono truncate max-w-[120px]" title="${this._escape(chat.senderId || '')}">${this._escape(chat.senderId || 'N/A')}</span>
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

  renderChatMessages(chat, messages) {
    const stream = document.getElementById('active-chat-stream');
    if (!stream) return;

    const list = Array.isArray(messages) ? messages : [];
    if (list.length === 0) {
      stream.innerHTML = `
        <div class="py-12 text-center text-zinc-500 text-xs">
          No messages found in this conversation.
        </div>
      `;
      return;
    }

    stream.innerHTML = list.map(msg => this._buildMessageBubbleHtml(msg, chat)).join('');
    stream.scrollTop = stream.scrollHeight;
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

  populateChannelFilterOptions(channels, currentSelectedId = 'all') {
    if (!this.filterChannel) return;
    const chList = Array.isArray(channels) ? channels : [];

    let optionsHtml = `<option value="all" class="bg-[#111114] text-white">All Channels</option>`;
    optionsHtml += chList.map(ch => `
      <option value="${ch.id}" class="bg-[#111114] text-white" ${String(ch.id) === String(currentSelectedId) ? 'selected' : ''}>
        ${this._escape(this._formatChannelLabel(ch))}
      </option>
    `).join('');

    this.filterChannel.innerHTML = optionsHtml;
    this.filterChannel.value = String(currentSelectedId || 'all');
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
