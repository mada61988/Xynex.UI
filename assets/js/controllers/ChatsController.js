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
    this.currentChatOrders = [];
    this.observer = null;
    this.isMobileChatOpen = false;
  }

  async init() {
    // 1. Setup DOM event listeners only once
    if (!this.isInitialized) {
      this.bindEvents();
      this.isInitialized = true;
    }

    // Default to mobile list view if on smaller screens
    if (window.innerWidth < 768) {
      this.view.showMobileListView();
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
        this.view.renderThreadCards(filtered, firstChat.id);
        if (window.innerWidth >= 768) {
          await this.selectChat(firstChat.id);
        } else {
          // Mobile default: Keep thread list open at 100% width
          this.view.showMobileListView();
          await this.selectChat(firstChat.id);
          this.view.showMobileListView();
        }
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
        this.view.renderThreadCards(filtered, firstChat.id);
        await this.selectChat(firstChat.id);
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
        this.view.renderThreadCards(filtered, firstChat.id);
        await this.selectChat(firstChat.id);
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

  /**
   * Selects a chat thread, triggers GET /chats/:id to load full chat data and messages,
   * and renders the messages with agent blue background and explicit sender labels.
   */
  async selectChat(chatId) {
    this.model.selectedChatId = chatId;
    this.view.setActiveCard(chatId);

    // 1. Immediately render cached chat metadata in Pane 2 & 3 while fetching
    let chat = this.model.getChatById(chatId);
    if (chat) {
      this.view.renderActiveChat(chat);
      this.view.setChatStreamLoading();
    }

    // 2. Fetch full chat data and messages from GET /chats/:id
    try {
      const fullChatData = await this.model.fetchChatDetails(chatId);
      if (fullChatData) {
        chat = {
          ...(chat || {}),
          ...fullChatData,
          messages: fullChatData.messages || [],
          cart: fullChatData.cart || (chat?.cart),
          userName: fullChatData.userName || chat?.userName || chat?.user_name,
          user_name: fullChatData.userName || chat?.userName || chat?.user_name
        };
        // Re-render complete chat timeline and context sidebar
        this.view.renderActiveChat(chat, chat.messages);
        this.view.scrollToBottom();

        // 3. Fetch customer orders using GET /orders/sender/:senderId
        const senderId = chat.senderId || (typeof chat.sender_id === 'object' ? chat.sender_id.id : chat.sender_id);
        if (senderId) {
          try {
            const orders = await this.model.fetchOrdersBySender(senderId);
            this.currentChatOrders = Array.isArray(orders) ? orders : [];
            this.view.renderUserOrders(this.currentChatOrders);
          } catch (orderErr) {
            console.warn(`ChatsController: Could not load orders for sender ${senderId}:`, orderErr);
            this.currentChatOrders = [];
            this.view.renderUserOrders([]);
          }
        } else {
          this.currentChatOrders = [];
          this.view.renderUserOrders([]);
        }
      }
    } catch (err) {
      console.error(`ChatsController: Error fetching chat details for #${chatId}:`, err);
      if (chat) {
        this.view.renderActiveChat(chat);
      }
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

    // 4. Thread card selection delegation (clicking a chat calls GET /chats/:id)
    this.view.bindThreadCardSelect(async (chatId) => {
      if (window.innerWidth < 768) {
        this.isMobileChatOpen = true;
        this.view.showMobileChatView();
      }
      await this.selectChat(chatId);
    });

    // 5. Mobile back button delegation
    this.view.bindMobileBack(() => {
      this.isMobileChatOpen = false;
      this.view.showMobileListView();
    });

    // 6. User order card click delegation to open details modal
    this.view.bindUserOrderClick(async (orderId, isCart = false) => {
      const activeChat = this.model.getSelectedChat();

      // Check if it's the active cart
      if (isCart || (activeChat && (String(activeChat.cart?.id) === String(orderId) || String(activeChat.cartId) === String(orderId)))) {
        const cart = activeChat?.cart || {};
        const items = Array.isArray(cart.items) ? cart.items : [];
        const cartOrder = {
          id: `${orderId}`,
          status: 'ACTIVE CART',
          createdAt: activeChat?.timestamp || new Date().toISOString(),
          totalPrice: cart.totalPrice !== undefined ? cart.totalPrice : 0,
          currency: cart.currencyCode || 'USD',
          items: items.map(it => ({
            productName: it.productName || it.title || it.name || 'Product',
            productVariantId: it.productVariantId || it.variantId || it.variant_id || 'N/A',
            sku: it.sku || 'N/A',
            quantity: it.quantity || 1,
            unitPrice: it.price || it.unitPrice || 0
          })),
          cartId: cart.id || orderId,
          chatId: activeChat?.id,
          workspaceId: activeChat?.workspaceId,
          senderId: activeChat?.senderId,
          shippingInfo: {
            customerName: activeChat?.userName || activeChat?.title || 'Active Customer',
            phoneNumber: 'N/A',
            address: 'Active checkout in progress'
          }
        };
        this.view.renderOrderDetailsModal(cartOrder);
        return;
      }

      // Check from cached customer orders
      let order = this.currentChatOrders.find(o => String(o.id) === String(orderId));
      if (!order && activeChat?.orders) {
        order = activeChat.orders.find(o => String(o.id) === String(orderId));
      }

      // If not in memory, try to fetch order details from API
      if (!order) {
        try {
          const fetchedOrder = await this.model.fetchOrderById(orderId);
          if (fetchedOrder) order = fetchedOrder;
        } catch (_) {}
      }

      if (order) {
        this.view.renderOrderDetailsModal(order);
      } else {
        console.warn(`ChatsController: Order #${orderId} could not be resolved.`);
      }
    });

    // 7. Responsive window resize listener
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        this.view.resetResponsiveLayout();
      } else {
        if (this.isMobileChatOpen && this.model.selectedChatId) {
          this.view.showMobileChatView();
        } else {
          this.view.showMobileListView();
        }
      }
    });

    // 8. Infinite Scroll Pagination (IntersectionObserver + Scroll fallback)
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
