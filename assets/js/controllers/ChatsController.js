import { ChatModel } from '../models/ChatModel.js';
import { ChatView } from '../views/ChatView.js';

export class ChatsController {
  constructor(authModel = null, dashboardModel = null) {
    this.authModel = authModel;
    this.dashboardModel = dashboardModel;
    this.model = new ChatModel();
    this.view = new ChatView();
    this.isInitialized = false;
    this.observer = null;
  }

  async init() {
    // 1. Setup DOM event listeners only once
    if (!this.isInitialized) {
      this.bindEvents();
      this.isInitialized = true;
    }

    // 2. Populate workspace options in filter dropdown
    await this.loadWorkspaceFilterOptions();

    // 3. Initial Load: fetch workspaceId=all, limit=10, offset=0
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
      if (clerkId && this.dashboardModel) {
        try {
          const data = await this.dashboardModel.fetchUserWorkspaces(clerkId);
          workspaces = data.workspaces || data.profiles || [];
        } catch (_) {}
      }
    }

    this.view.populateWorkspaceFilterOptions(workspaces, this.model.currentWorkspaceId);
  }

  async fetchInitialChats() {
    this.view.renderThreadListLoading(true);
    this.view.renderNoActiveChat();

    try {
      await this.model.fetchChats({ workspaceId: this.model.currentWorkspaceId, reset: true });
      const filtered = this.model.getFilteredChats();

      if (filtered.length === 0) {
        this.view.renderThreadListEmpty("No conversations found for this workspace.");
        this.view.renderNoActiveChat();
      } else {
        const firstChat = filtered[0];
        this.model.selectedChatId = firstChat.id;
        this.view.renderThreadCards(filtered, firstChat.id);
        this.view.renderActiveChat(firstChat);
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
    this.model.offset = 0;
    this.model.hasMore = true;

    const wsText = workspaceId === 'all' 
      ? 'All Workspaces' 
      : (this.view.getSelectedWorkspaceText() || `Workspace #${workspaceId}`);
    const chText = this.view.getSelectedChannelText() || 'All Channels';
    this.view.updateScopeSummary(wsText, chText);

    this.view.renderThreadListLoading(true);
    this.view.renderNoActiveChat();

    try {
      await this.model.fetchChats({ workspaceId, reset: true });
      const filtered = this.model.getFilteredChats();

      if (filtered.length === 0) {
        this.view.renderThreadListEmpty(`No conversations found for ${wsText}.`);
        this.view.renderNoActiveChat();
      } else {
        const firstChat = filtered[0];
        this.model.selectedChatId = firstChat.id;
        this.view.renderThreadCards(filtered, firstChat.id);
        this.view.renderActiveChat(firstChat);
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

  handleChannelFilterChange(channel) {
    this.model.currentChannelFilter = channel;
    const wsText = this.view.getSelectedWorkspaceText() || 'All Workspaces';
    const chText = channel === 'all' ? 'All Channels' : channel.toUpperCase();
    this.view.updateScopeSummary(wsText, chText);

    const filtered = this.model.getFilteredChats();
    if (filtered.length === 0) {
      this.view.renderThreadListEmpty(`No conversations for ${channel}.`);
      this.view.renderNoActiveChat();
    } else {
      const activeChat = this.model.getSelectedChat();
      this.view.renderThreadCards(filtered, activeChat?.id);
      if (activeChat) this.view.renderActiveChat(activeChat);
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
      if (activeChat) this.view.renderActiveChat(activeChat);
    }
  }

  async handleInfiniteScroll() {
    if (this.model.isLoading || !this.model.hasMore) return;

    // Increment offset by limit (10)
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

  bindEvents() {
    // 1. Workspace dropdown filter change
    this.view.bindWorkspaceFilter((workspaceId) => {
      this.handleWorkspaceFilterChange(workspaceId);
    });

    // 2. Channel dropdown filter change
    this.view.bindChannelFilter((channel) => {
      this.handleChannelFilterChange(channel);
    });

    // 3. Search input filtering
    this.view.bindSearchInput((query) => {
      this.handleSearch(query);
    });

    // 4. Thread card selection delegation
    this.view.bindThreadCardSelect((chatId) => {
      this.model.selectedChatId = chatId;
      const chat = this.model.getChatById(chatId);
      if (chat) {
        this.view.setActiveCard(chatId);
        this.view.renderActiveChat(chat);
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
