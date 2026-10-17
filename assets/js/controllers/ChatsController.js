import { ChatModel } from '../models/ChatModel.js';
import { ChatView } from '../views/ChatView.js';

export class ChatsController {
  constructor(authModel = null, dashboardModel = null) {
    this.authModel = authModel;
    this.dashboardModel = dashboardModel;
    this.model = new ChatModel();
    this.view = new ChatView();
    this.isInitialized = false;
    this.workspacesCache = [];
    this.observer = null;
  }

  async init() {
    // 1. Setup DOM event listeners only once
    if (!this.isInitialized) {
      this.bindEvents();
      this.isInitialized = true;
    }

    // 2. Populate workspace options in filter dropdown and initial channel options
    await this.loadWorkspaceFilterOptions();

    // 3. Initial Load: fetch with workspaceId=all, channelId=all, limit=10, offset=0
    if (this.model.chats.length === 0) {
      await this.fetchInitialChats();
    }
  }

  async loadWorkspaceFilterOptions() {
    let workspaces = [];
    if (this.dashboardModel && typeof this.dashboardModel.getUserWorkspaces === 'function') {
      workspaces = this.dashboardModel.getUserWorkspaces();
    }

    if (!workspaces || workspaces.length === 0) {
      const clerkId = this.authModel?.user?.id || window.Clerk?.user?.id;
      if (clerkId && this.dashboardModel && typeof this.dashboardModel.fetchUserWorkspaces === 'function') {
        try {
          const data = await this.dashboardModel.fetchUserWorkspaces(clerkId);
          workspaces = data.workspaces || data.profiles || [];
        } catch (_) {}
      }
    }

    this.workspacesCache = Array.isArray(workspaces) ? workspaces : [];
    this.view.populateWorkspaceFilterOptions(this.workspacesCache, this.model.currentWorkspaceId);
    this.populateChannelOptions(this.model.currentWorkspaceId);
  }

  populateChannelOptions(workspaceId) {
    if (workspaceId === 'all') {
      // Show 'All Channels' when 'All Workspaces' is active
      this.view.populateChannelFilterOptions([], 'all');
      return;
    }

    const ws = this.workspacesCache.find(w => String(w.id) === String(workspaceId));
    const channels = Array.isArray(ws?.channels) ? ws.channels : [];
    this.view.populateChannelFilterOptions(channels, this.model.currentChannelId);
  }

  async fetchInitialChats() {
    this.view.renderThreadListLoading(true);
    this.view.renderNoActiveChat();

    try {
      await this.model.fetchChats({
        workspaceId: 'all',
        channelId: 'all',
        reset: true
      });

      const filtered = this.model.getFilteredChats();

      if (filtered.length === 0) {
        this.view.renderThreadListEmpty("No conversations found.");
        this.view.renderNoActiveChat();
      } else {
        const firstChat = filtered[0];
        this.model.selectedChatId = firstChat.id;
        this.view.renderThreadCards(filtered, firstChat.id);
        this.view.renderActiveChat(firstChat);

        // Fetch full message history for first chat if available
        this._fetchAndRenderHistory(firstChat.id);
      }
    } catch (err) {
      console.error("ChatsController: Error fetching initial chats:", err);
      this.view.renderThreadListEmpty(err.serverMessage || err.message || "Failed to load chats.");
    } finally {
      if (!this.model.hasMore) {
        this.view.hideScrollSentinel();
      } else {
        this.view.showScrollSentinel();
      }
    }
  }

  async handleWorkspaceFilterChange(workspaceId) {
    this.model.currentWorkspaceId = workspaceId;
    this.model.currentChannelId = 'all';
    this.model.offset = 0;
    this.model.hasMore = true;

    // Dynamically update channel options based on chosen workspace
    this.populateChannelOptions(workspaceId);

    const wsText = workspaceId === 'all' 
      ? 'All Workspaces' 
      : (this.view.getSelectedWorkspaceText() || `Workspace #${workspaceId}`);
    const chText = 'All Channels';
    this.view.updateScopeSummary(wsText, chText);

    // Reset pagination & clear thread list
    this.view.renderThreadListLoading(true);
    this.view.renderNoActiveChat();

    try {
      await this.model.fetchChats({
        workspaceId,
        channelId: 'all',
        reset: true
      });

      const filtered = this.model.getFilteredChats();

      if (filtered.length === 0) {
        this.view.renderThreadListEmpty(`No conversations found for ${wsText}.`);
        this.view.renderNoActiveChat();
      } else {
        const firstChat = filtered[0];
        this.model.selectedChatId = firstChat.id;
        this.view.renderThreadCards(filtered, firstChat.id);
        this.view.renderActiveChat(firstChat);
        this._fetchAndRenderHistory(firstChat.id);
      }
    } catch (err) {
      console.error("ChatsController: Error changing workspace filter:", err);
      this.view.renderThreadListEmpty(err.serverMessage || err.message || "Failed to load chats.");
    } finally {
      if (!this.model.hasMore) {
        this.view.hideScrollSentinel();
      } else {
        this.view.showScrollSentinel();
      }
    }
  }

  async handleChannelFilterChange(channelId) {
    this.model.currentChannelId = channelId;
    this.model.offset = 0;
    this.model.hasMore = true;

    const wsText = this.view.getSelectedWorkspaceText() || 'All Workspaces';
    const chText = this.view.getSelectedChannelText() || 'All Channels';
    this.view.updateScopeSummary(wsText, chText);

    // Reset pagination & clear thread list
    this.view.renderThreadListLoading(true);
    this.view.renderNoActiveChat();

    try {
      await this.model.fetchChats({
        workspaceId: this.model.currentWorkspaceId,
        channelId: this.model.currentChannelId,
        reset: true
      });

      const filtered = this.model.getFilteredChats();

      if (filtered.length === 0) {
        this.view.renderThreadListEmpty(`No conversations found for ${chText}.`);
        this.view.renderNoActiveChat();
      } else {
        const firstChat = filtered[0];
        this.model.selectedChatId = firstChat.id;
        this.view.renderThreadCards(filtered, firstChat.id);
        this.view.renderActiveChat(firstChat);
        this._fetchAndRenderHistory(firstChat.id);
      }
    } catch (err) {
      console.error("ChatsController: Error changing channel filter:", err);
      this.view.renderThreadListEmpty(err.serverMessage || err.message || "Failed to load chats.");
    } finally {
      if (!this.model.hasMore) {
        this.view.hideScrollSentinel();
      } else {
        this.view.showScrollSentinel();
      }
    }
  }

  handleSearch(query) {
    this.model.searchQuery = query;
    const filtered = this.model.getFilteredChats();

    if (filtered.length === 0) {
      this.view.renderThreadListEmpty("No matching conversations found.");
      this.view.renderNoActiveChat();
    } else {
      const activeChat = this.model.getSelectedChat();
      this.view.renderThreadCards(filtered, activeChat?.id);
      if (activeChat) {
        this.view.renderActiveChat(activeChat);
      }
    }
  }

  async handleInfiniteScroll() {
    if (this.model.isLoading || !this.model.hasMore) return;

    // Increment offset by limit (10) and fetch next page
    this.model.offset += this.model.limit;
    this.view.showScrollSentinel();

    try {
      const newChats = await this.model.fetchChats({ reset: false });
      if (newChats.length > 0) {
        this.view.appendThreadCards(newChats, this.model.selectedChatId);
      }
    } catch (err) {
      console.error("ChatsController: Infinite scroll fetch failed:", err);
    } finally {
      if (!this.model.hasMore) {
        this.view.hideScrollSentinel();
      }
    }
  }

  async _fetchAndRenderHistory(chatId) {
    const chat = this.model.getChatById(chatId);
    if (!chat) return;

    try {
      const messages = await this.model.apiService.fetchChatMessages(chatId);
      if (Array.isArray(messages) && messages.length > 0) {
        this.view.renderChatMessages(chat, messages);
      }
    } catch (e) {
      // Gracefully keeps default snippet view if full history endpoint is not available
    }
  }

  bindEvents() {
    // 1. Workspace dropdown filter change
    this.view.bindWorkspaceFilter((workspaceId) => {
      this.handleWorkspaceFilterChange(workspaceId);
    });

    // 2. Channel dropdown filter change
    this.view.bindChannelFilter((channelId) => {
      this.handleChannelFilterChange(channelId);
    });

    // 3. Search input filtering
    this.view.bindSearchInput((query) => {
      this.handleSearch(query);
    });

    // 4. Thread card selection delegation
    this.view.bindThreadCardSelect(async (chatId) => {
      this.model.selectedChatId = chatId;
      const chat = this.model.getChatById(chatId);
      if (chat) {
        this.view.setActiveCard(chatId);
        this.view.renderActiveChat(chat);
        await this._fetchAndRenderHistory(chatId);
      }
    });

    // 5. Infinite Scroll Pagination (IntersectionObserver + Scroll fallback)
    this.setupInfiniteScroll();
  }

  setupInfiniteScroll() {
    const sentinel = document.getElementById('chats-scroll-sentinel');
    const container = document.getElementById('chats-thread-list');

    if (window.IntersectionObserver && sentinel && container) {
      this.observer = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !this.model.isLoading && this.model.hasMore) {
          this.handleInfiniteScroll();
        }
      }, {
        root: container,
        rootMargin: '120px',
        threshold: 0.1
      });

      this.observer.observe(sentinel);
    }

    // Scroll fallback
    if (container) {
      container.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 80) {
          if (!this.model.isLoading && this.model.hasMore) {
            this.handleInfiniteScroll();
          }
        }
      });
    }
  }
}

// Export both names for maximum compatibility
export { ChatsController as ChatController };
