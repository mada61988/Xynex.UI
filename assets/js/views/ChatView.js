export class ChatView {
  constructor() {
    this.filterWorkspace = document.getElementById('filter-workspace');
    this.filterChannel = document.getElementById('filter-channel');
    this.scopeSummaryText = document.getElementById('scope-summary-text');
    this.chatSearchInput = document.getElementById('chat-search-input');
    this.chatsSidebarPane = document.getElementById('chats-sidebar-pane');
    this.threadListContainer = document.getElementById('chats-thread-list');
    this.threadCardsContainer = document.getElementById('chats-thread-cards');
    this.scrollSentinel = document.getElementById('chats-scroll-sentinel');
    this.activeChatContainer = document.getElementById('active-chat-container');
    this.activeChatContext = document.getElementById('active-chat-context');
    this.mobileContextDrawer = document.getElementById('mobile-chat-context-drawer');
    this.mobileContextBackdrop = document.getElementById('mobile-context-backdrop');
    this.mobileContextContent = document.getElementById('mobile-chat-context-content');
    this.onMobileBackHandler = null;
    this._mobileBackBound = false;

    this._bindMobileOrderDrawer();
  }

  _bindMobileOrderDrawer() {
    if (this.activeChatContainer) {
      this.activeChatContainer.addEventListener('click', (e) => {
        const orderBtn = e.target.closest('#chat-mobile-order-btn') || e.target.closest('.view-active-order-link');
        if (orderBtn) {
          e.preventDefault();
          this.showMobileOrderDrawer();
        }
      });
    }

    const closeBtn = document.getElementById('close-mobile-context-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideMobileOrderDrawer();
      });
    }

    if (this.mobileContextBackdrop) {
      this.mobileContextBackdrop.addEventListener('click', () => {
        this.hideMobileOrderDrawer();
      });
    }
  }

  showMobileOrderDrawer() {
    if (this.mobileContextDrawer) {
      this.mobileContextDrawer.classList.remove('translate-x-full');
    }
    if (this.mobileContextBackdrop) {
      this.mobileContextBackdrop.classList.remove('hidden');
    }
  }

  hideMobileOrderDrawer() {
    if (this.mobileContextDrawer) {
      this.mobileContextDrawer.classList.add('translate-x-full');
    }
    if (this.mobileContextBackdrop) {
      this.mobileContextBackdrop.classList.add('hidden');
    }
  }

  showMobileChatView() {
    if (this.chatsSidebarPane) {
      this.chatsSidebarPane.classList.add('hidden');
      this.chatsSidebarPane.classList.remove('flex');
    }
    if (this.activeChatContainer) {
      this.activeChatContainer.classList.remove('hidden');
      this.activeChatContainer.classList.add('flex', 'w-full');
    }
    this.scrollToBottom();
  }

  showMobileListView() {
    if (this.chatsSidebarPane) {
      this.chatsSidebarPane.classList.remove('hidden');
      this.chatsSidebarPane.classList.add('flex', 'w-full');
    }
    if (this.activeChatContainer) {
      this.activeChatContainer.classList.add('hidden');
      this.activeChatContainer.classList.remove('flex', 'w-full');
    }
  }

  resetResponsiveLayout() {
    if (this.chatsSidebarPane) {
      this.chatsSidebarPane.classList.remove('hidden', 'w-full');
      this.chatsSidebarPane.classList.add('flex');
    }
    if (this.activeChatContainer) {
      this.activeChatContainer.classList.remove('hidden', 'w-full');
      this.activeChatContainer.classList.add('flex');
    }
  }

  bindMobileBack(handler) {
    this.onMobileBackHandler = handler;
    if (this.activeChatContainer && !this._mobileBackBound) {
      this._mobileBackBound = true;
      this.activeChatContainer.addEventListener('click', (e) => {
        const backBtn = e.target.closest('#chat-mobile-back-btn');
        if (backBtn && this.onMobileBackHandler) {
          e.preventDefault();
          this.onMobileBackHandler();
        }
      });
    }
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

  _buildMediaAttachmentHtml(msg, isAgent) {
    let mediaHtml = '';

    // 1. Image
    if (msg.imageUrl) {
      mediaHtml += `
        <div class="rounded-xl overflow-hidden mb-2 border border-white/10 max-w-xs sm:max-w-sm bg-black/40 shadow-sm">
          <a href="${this._escape(msg.imageUrl)}" target="_blank" rel="noopener noreferrer" class="block group relative" title="Click to view full image">
            <img src="${this._escape(msg.imageUrl)}" alt="Attached image" class="max-w-full max-h-72 object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.02]" loading="lazy" />
            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
              <i class="fa-solid fa-up-right-from-square text-xs bg-black/60 p-2 rounded-lg"></i>
            </div>
          </a>
        </div>
      `;
    } else if (msg.type === 'image') {
      mediaHtml += `
        <div class="flex items-center gap-2 p-2.5 rounded-xl ${isAgent ? 'bg-blue-600/40' : 'bg-zinc-900/60'} border border-white/10 text-xs text-zinc-300 mb-1.5">
          <i class="fa-regular fa-image text-zinc-400"></i>
          <span>Photo attachment</span>
        </div>
      `;
    }

    // 2. Video
    if (msg.videoUrl) {
      mediaHtml += `
        <div class="rounded-xl overflow-hidden mb-2 border border-white/10 max-w-xs sm:max-w-sm bg-black shadow-sm">
          <video src="${this._escape(msg.videoUrl)}" controls preload="metadata" class="max-w-full max-h-72 rounded-xl"></video>
        </div>
      `;
    }

    // 3. Audio / Voice Note
    const audioSrc = msg.voiceNoteUrl || msg.audioUrl;
    if (audioSrc) {
      mediaHtml += `
        <div class="flex items-center gap-2.5 p-2 rounded-xl ${isAgent ? 'bg-blue-600/50' : 'bg-zinc-900/80'} border border-white/10 mb-2 max-w-[280px]">
          <div class="w-7 h-7 rounded-full ${isAgent ? 'bg-white/20 text-white' : 'bg-zinc-800 text-blue-400'} flex items-center justify-center shrink-0">
            <i class="fa-solid fa-microphone text-[10px]"></i>
          </div>
          <audio src="${this._escape(audioSrc)}" controls class="h-8 max-w-[210px] filter invert contrast-125"></audio>
        </div>
      `;
    }

    // 4. File / Document
    if (msg.fileUrl) {
      let fileName = 'Attachment Document';
      try {
        const parts = msg.fileUrl.split('/');
        fileName = decodeURIComponent(parts[parts.length - 1].split('?')[0]) || fileName;
      } catch (_) {}

      mediaHtml += `
        <a href="${this._escape(msg.fileUrl)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-2.5 rounded-xl ${isAgent ? 'bg-blue-600/40 hover:bg-blue-600/60' : 'bg-zinc-900/80 hover:bg-zinc-800'} border border-white/10 transition group mb-2 max-w-xs">
          <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white">
            <i class="fa-solid fa-file-arrow-down text-xs"></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-medium text-xs text-white truncate group-hover:underline">${this._escape(fileName)}</div>
            <div class="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
              <span>Click to view file</span>
            </div>
          </div>
        </a>
      `;
    }

    // 5. Location Coordinates
    if (msg.locationCoordinates) {
      let lat = null, lng = null;
      if (typeof msg.locationCoordinates === 'object' && msg.locationCoordinates !== null) {
        lat = msg.locationCoordinates.latitude ?? msg.locationCoordinates.lat;
        lng = msg.locationCoordinates.longitude ?? msg.locationCoordinates.lng;
      } else if (typeof msg.locationCoordinates === 'string') {
        const coords = msg.locationCoordinates.split(',');
        if (coords.length >= 2) {
          lat = coords[0].trim();
          lng = coords[1].trim();
        }
      }

      if (lat && lng) {
        mediaHtml += `
          <a href="https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-2.5 rounded-xl ${isAgent ? 'bg-blue-600/40 hover:bg-blue-600/60' : 'bg-zinc-900/80 hover:bg-zinc-800'} border border-white/10 transition group mb-2 max-w-xs">
            <div class="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-location-dot text-xs"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-xs text-white">Shared Location</div>
              <div class="text-[10px] text-zinc-400 font-mono mt-0.5">${this._escape(lat)}, ${this._escape(lng)}</div>
            </div>
            <i class="fa-solid fa-arrow-up-right-from-square text-zinc-400 text-[10px]"></i>
          </a>
        `;
      }
    }

    // 6. Sticker
    if (msg.stickerId) {
      const isUrl = String(msg.stickerId).startsWith('http://') || String(msg.stickerId).startsWith('https://');
      if (isUrl) {
        mediaHtml += `
          <div class="mb-2">
            <img src="${this._escape(msg.stickerId)}" alt="Sticker" class="w-24 h-24 object-contain" loading="lazy" />
          </div>
        `;
      } else {
        mediaHtml += `
          <div class="flex items-center gap-2 p-2 rounded-xl bg-zinc-900/60 border border-zinc-700/50 text-xs text-zinc-300 mb-2">
            <i class="fa-regular fa-face-smile text-amber-400 text-sm"></i>
            <span>Sticker #${this._escape(msg.stickerId)}</span>
          </div>
        `;
      }
    }

    return mediaHtml;
  }

  _buildMessageBubbleHtml(msg, chat) {
    const sender = String(msg.sender || '').toLowerCase().trim();
    const isAgent = sender === 'agent' || sender === 'bot' || sender === 'ai';
    const msgText = this._escape(msg.text || msg.content || msg.body || '');
    const msgTime = this.formatRelativeTime(msg.createdAt || msg.timestamp);
    const customerName = this._escape(chat.userName || chat.user_name || chat.title || 'Customer');

    const mediaHtml = this._buildMediaAttachmentHtml(msg, isAgent);
    const textHtml = msgText ? `<div class="leading-relaxed break-words">${msgText}</div>` : '';

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
            ${mediaHtml}
            ${textHtml}
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
          ${mediaHtml}
          ${textHtml}
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
      <div class="h-14 border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-[#0d0d10]">
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <!-- Mobile Back Button (Only on mobile: md:hidden) -->
          <button 
            type="button" 
            id="chat-mobile-back-btn" 
            class="md:hidden text-zinc-400 hover:text-white p-2 -ml-1 sm:-ml-2 rounded-xl hover:bg-zinc-800 transition flex items-center justify-center cursor-pointer shrink-0" 
            aria-label="Back to conversations list"
            title="Back to conversations"
          >
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </button>

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

        <!-- Bot Pause & Mobile Order Toggle -->
        <div class="flex items-center gap-2">
          <!-- Mobile Order Info Toggle Button (xl:hidden) -->
          <button 
            type="button" 
            id="chat-mobile-order-btn" 
            class="xl:hidden bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 text-xs text-zinc-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="View Active Order & Context"
          >
            <i class="fa-solid fa-cart-shopping text-emerald-400 text-xs"></i>
            <span class="font-semibold text-white text-xs">Order</span>
          </button>

          <!-- Bot Pause Toggle -->
          <button type="button" class="bg-zinc-900 border border-zinc-700 hover:border-rose-500/50 text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer">
            <i class="fa-solid fa-hand text-rose-400"></i>
            <span class="hidden sm:inline">Pause AI Agent</span>
          </button>
        </div>
      </div>

      <!-- Chat Stream -->
      <div id="active-chat-stream" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <!-- Mobile In-Stream Active Order Pill -->
        ${chat.cart || chat.cartId ? `
          <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300 shadow-sm xl:hidden">
            <div class="flex items-center gap-2.5 min-w-0 pr-2">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <i class="fa-solid fa-cart-shopping text-xs"></i>
              </div>
              <div class="truncate">
                <div class="font-bold text-white truncate text-xs">Active Cart #${this._escape(chat.cart?.id || chat.cartId || 557)}</div>
                <div class="text-[10px] text-zinc-400 font-mono">${Array.isArray(chat.cart?.items) ? chat.cart.items.length : 0} item(s) • ${this._escape(chat.cart?.currencyCode || 'USD')} ${this._escape(chat.cart?.totalPrice !== undefined ? Number(chat.cart.totalPrice).toFixed(2) : '0.00')}</div>
              </div>
            </div>
            <button type="button" class="view-active-order-link px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:text-white font-semibold text-[11px] shrink-0 transition cursor-pointer">Order Info &rarr;</button>
          </div>
        ` : ''}
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

    const contextHtml = `
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
          <div class="border-t border-zinc-800/80 pt-2.5 flex justify-end">
            <button type="button" class="view-active-cart-btn text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer" data-cart-id="${this._escape(cartId)}">
              <span>Cart Details</span>
              <i class="fa-solid fa-chevron-right text-[8px]"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Orders Display (User Orders) -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Customer Orders</h3>
          <span id="user-orders-count-badge" class="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-full">Syncing...</span>
        </div>
        <div id="user-orders-list-container" class="bg-[#111114] border border-zinc-800 rounded-2xl p-3 space-y-2 max-h-56 overflow-y-auto shadow-sm">
          <div class="py-4 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
            <svg class="animate-spin h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-[11px] font-mono text-zinc-500">Fetching customer orders...</span>
          </div>
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

    if (this.activeChatContext) {
      this.activeChatContext.innerHTML = contextHtml;
    }
    if (this.mobileContextContent) {
      this.mobileContextContent.innerHTML = contextHtml;
    }

    // Automatically scroll to the bottom of the conversation stream (most recent messages)
    this.scrollToBottom();
  }

  /**
   * Scrolls the active chat stream container to the bottom so newest messages are immediately visible
   */
  scrollToBottom({ smooth = false } = {}) {
    const stream = document.getElementById('active-chat-stream');
    if (!stream) return;

    const performScroll = () => {
      if (smooth) {
        stream.scrollTo({
          top: stream.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        stream.scrollTop = stream.scrollHeight;
      }
    };

    // 1. Immediate scroll execution
    performScroll();

    // 2. Next animation frame (DOM paint cycle)
    requestAnimationFrame(() => {
      performScroll();
      // 3. Staggered ticks for layout reflow and font metric settlement
      setTimeout(performScroll, 50);
      setTimeout(performScroll, 150);
    });

    // 4. Attach load listeners for any media or attachments in the stream
    const images = stream.querySelectorAll('img');
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', () => performScroll(), { once: true });
        img.addEventListener('error', () => performScroll(), { once: true });
      }
    });
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
    this.scrollToBottom();
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
    const noContextHtml = `
      <div class="p-4 text-center text-zinc-600 text-xs">
        No conversation context selected
      </div>
    `;
    if (this.activeChatContext) {
      this.activeChatContext.innerHTML = noContextHtml;
    }
    if (this.mobileContextContent) {
      this.mobileContextContent.innerHTML = noContextHtml;
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

  renderUserOrders(orders) {
    const containers = [
      document.querySelector('#active-chat-context #user-orders-list-container'),
      document.querySelector('#mobile-chat-context-content #user-orders-list-container')
    ].filter(Boolean);

    const badges = [
      document.querySelector('#active-chat-context #user-orders-count-badge'),
      document.querySelector('#mobile-chat-context-content #user-orders-count-badge')
    ].filter(Boolean);

    const list = Array.isArray(orders) ? orders : [];

    badges.forEach(badge => {
      badge.textContent = `${list.length} order${list.length === 1 ? '' : 's'}`;
    });

    if (containers.length === 0) return;

    if (list.length === 0) {
      const emptyHtml = `
        <div class="py-4 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-1.5">
          <i class="fa-solid fa-box-open text-zinc-600 text-lg"></i>
          <span>No previous orders found</span>
        </div>
      `;
      containers.forEach(c => c.innerHTML = emptyHtml);
      return;
    }

    const ordersHtml = list.map(order => {
      const status = String(order.status || 'CONFIRMED').toUpperCase();
      let statusBadge = 'bg-zinc-800 text-zinc-400 border-zinc-700';
      if (status === 'CONFIRMED') statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      else if (status === 'PENDING') statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      else if (status === 'CANCELLED' || status === 'REFUNDED') statusBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      const orderDate = this.formatRelativeTime(order.createdAt);
      const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
      const price = Number(order.totalPrice || 0).toFixed(2);

      return `
        <div class="user-order-item cursor-pointer p-3 rounded-xl bg-[#0d0d10] hover:bg-zinc-800/80 border border-zinc-800/90 hover:border-zinc-700 transition flex items-center justify-between group" data-order-id="${order.id}">
          <div class="min-w-0 pr-2 space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-white text-xs group-hover:text-blue-400 transition">Order #${order.id}</span>
              <span class="${statusBadge} text-[9px] font-bold px-1.5 py-0.2 rounded-full border">${this._escape(status)}</span>
            </div>
            <div class="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 truncate">
              <span>${orderDate || 'Recent'}</span>
              <span>•</span>
              <span>${itemsCount} item(s)</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-xs font-bold text-white font-mono">$${price}</div>
            <span class="text-[10px] text-zinc-400 group-hover:text-white flex items-center justify-end gap-1 mt-0.5 transition">
              Details <i class="fa-solid fa-chevron-right text-[8px]"></i>
            </span>
          </div>
        </div>
      `;
    }).join('');

    containers.forEach(c => c.innerHTML = ordersHtml);
  }

  renderOrderDetailsModal(order) {
    if (!order) return;
    let modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'modal-container';
      document.body.appendChild(modalContainer);
    }

    const status = String(order.status || 'CONFIRMED').toUpperCase();
    let statusBadge = 'bg-zinc-800 text-zinc-400 border-zinc-700';
    if (status === 'CONFIRMED') statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    else if (status === 'PENDING') statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    else if (status === 'CANCELLED' || status === 'REFUNDED') statusBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

    const items = Array.isArray(order.items) ? order.items : [];
    const itemsRows = items.length > 0 ? items.map(item => {
      const unitPrice = Number(item.unitPrice || 0);
      const qty = Number(item.quantity || 1);
      const subtotal = (unitPrice * qty).toFixed(2);

      return `
        <tr class="hover:bg-zinc-800/30 transition text-zinc-300">
          <td class="p-3 font-medium text-white flex flex-col">
            <span>${this._escape(item.productName || 'Product')}</span>
            <span class="text-[10px] text-zinc-500 font-mono">Variant ID #${item.productVariantId || 'N/A'}</span>
          </td>
          <td class="p-3 font-mono text-[11px] text-zinc-400">${this._escape(item.sku || 'N/A')}</td>
          <td class="p-3 text-center font-mono font-semibold">${qty}</td>
          <td class="p-3 text-right font-mono">$${unitPrice.toFixed(2)}</td>
          <td class="p-3 text-right font-mono font-bold text-white">$${subtotal}</td>
        </tr>
      `;
    }).join('') : `
      <tr>
        <td colspan="5" class="p-4 text-center text-zinc-500">No individual line items listed.</td>
      </tr>
    `;

    modalContainer.innerHTML = `
      <div id="order-details-modal" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div class="relative w-full max-w-2xl bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0d0d10]">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <i class="fa-solid fa-receipt text-sm"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-white">Order #${order.id}</h2>
                  <span class="${statusBadge} text-[10px] font-bold px-2 py-0.5 rounded-full border">${this._escape(status)}</span>
                </div>
                <p class="text-[11px] text-zinc-500 font-mono mt-0.5">Date: ${new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <button id="close-order-modal-btn" type="button" class="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div class="p-6 overflow-y-auto space-y-5 text-xs">
            <!-- Customer & Shipping Information -->
            <div>
              <h4 class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <i class="fa-solid fa-truck text-zinc-500"></i> Shipping & Customer Information
              </h4>
              <div class="bg-[#0d0d10] border border-zinc-800 rounded-xl p-3.5 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-zinc-500">Customer Name</span>
                  <span class="text-white font-semibold">${this._escape(order.shippingInfo?.customerName || 'N/A')}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-zinc-500">Phone Number</span>
                  <span class="text-white font-mono">${this._escape(order.shippingInfo?.phoneNumber || 'N/A')}</span>
                </div>
                <div class="flex justify-between items-start">
                  <span class="text-zinc-500 shrink-0 mr-4">Delivery Address</span>
                  <span class="text-white text-right">${this._escape(order.shippingInfo?.address || 'N/A')}</span>
                </div>
                <div class="flex justify-between items-center border-t border-zinc-800/80 pt-2 text-[11px]">
                  <span class="text-zinc-500">Sender ID</span>
                  <span class="text-zinc-400 font-mono truncate max-w-xs">${this._escape(order.senderId || 'N/A')}</span>
                </div>
              </div>
            </div>

            <!-- Order Items -->
            <div>
              <h4 class="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <i class="fa-solid fa-box text-zinc-500"></i> Order Items (${items.length})
              </h4>
              <div class="border border-zinc-800 rounded-xl overflow-hidden">
                <table class="w-full text-left">
                  <thead class="bg-[#0d0d10] text-zinc-500 text-[10px] uppercase font-mono border-b border-zinc-800">
                    <tr>
                      <th class="p-3">Product</th>
                      <th class="p-3">SKU</th>
                      <th class="p-3 text-center">Qty</th>
                      <th class="p-3 text-right">Unit Price</th>
                      <th class="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-800/60 bg-[#111114]">
                    ${itemsRows}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Financial Summary -->
            <div class="bg-[#0d0d10] border border-zinc-800 rounded-xl p-4 space-y-2">
              <div class="flex justify-between text-zinc-400 items-center">
                <span class="font-medium">Total Order Amount</span>
                <span class="text-lg font-extrabold text-emerald-400 font-mono">$${Number(order.totalPrice || 0).toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-2">
                <span>Associated Cart ID</span>
                <span class="font-mono text-zinc-400">Cart #${order.cartId || 'N/A'}</span>
              </div>
              <div class="flex justify-between text-[11px] text-zinc-500">
                <span>Associated Chat ID</span>
                <span class="font-mono text-zinc-400">Chat #${order.chatId || 'N/A'}</span>
              </div>
              <div class="flex justify-between text-[11px] text-zinc-500">
                <span>Workspace ID</span>
                <span class="font-mono text-zinc-400">Workspace #${order.workspaceId || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-3 border-t border-zinc-800 bg-[#0d0d10] flex justify-end">
            <button id="close-order-modal-btn-footer" type="button" class="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    // Modal close listeners
    const modalEl = document.getElementById('order-details-modal');
    const closeBtn = document.getElementById('close-order-modal-btn');
    const closeFooterBtn = document.getElementById('close-order-modal-btn-footer');

    const handleClose = () => this.closeOrderDetailsModal();
    if (closeBtn) closeBtn.addEventListener('click', handleClose);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', handleClose);
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) handleClose();
      });
    }

    if (this._modalEscListener) {
      window.removeEventListener('keydown', this._modalEscListener);
    }
    this._modalEscListener = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', this._modalEscListener);
  }

  closeOrderDetailsModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = '';
    }
    if (this._modalEscListener) {
      window.removeEventListener('keydown', this._modalEscListener);
      this._modalEscListener = null;
    }
  }

  bindUserOrderClick(handler) {
    const onOrderClick = (e) => {
      const orderItem = e.target.closest('.user-order-item');
      if (orderItem && orderItem.dataset.orderId) {
        e.preventDefault();
        e.stopPropagation();
        handler(orderItem.dataset.orderId, false);
        return;
      }

      const cartBtn = e.target.closest('.view-active-cart-btn');
      if (cartBtn && cartBtn.dataset.cartId) {
        e.preventDefault();
        e.stopPropagation();
        handler(cartBtn.dataset.cartId, true);
        return;
      }
    };

    if (this.activeChatContext) {
      this.activeChatContext.addEventListener('click', onOrderClick);
    }
    if (this.mobileContextDrawer) {
      this.mobileContextDrawer.addEventListener('click', onOrderClick);
    }
    if (this.mobileContextContent) {
      this.mobileContextContent.addEventListener('click', onOrderClick);
    }
    document.addEventListener('click', onOrderClick);
  }
}

