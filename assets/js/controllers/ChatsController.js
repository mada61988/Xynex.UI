import { ChatModel } from '../models/ChatModel.js';
import { ChatView } from '../views/ChatView.js';
import { pollingService, POLLING_INTERVALS } from '../services/PollingService.js';

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
    this.pollingRegistered = false;

    // Per-chat in-memory caching to eliminate loaders on return visits
    this.chatDetailsCache = new Map(); // chatId -> full chat object (messages, cart, etc.)
    this.chatOrdersCache = new Map();  // chatId -> customer orders array
    this.loadedChatsSet = new Set();   // Set of chatIds that have been loaded once
  }

  async init() {
    // 1. Setup DOM event listeners only once
    if (!this.isInitialized) {
      this.bindEvents();
      this.isInitialized = true;
    }

    // 2. Register background polling tasks for conversations
    if (!this.pollingRegistered) {
      this.registerBackgroundPolling();
      this.pollingRegistered = true;
    }

    // Default to mobile list view if on smaller screens
    if (window.innerWidth < 768) {
      this.view.showMobileListView();
    }

    // 3. Populate workspace options in filter dropdown and initial channel options
    await this.loadWorkspaceFilterOptions();

    // 4. Initial Load: Only display loader on the very first visit if chats are empty
    if (this.model.chats.length === 0) {
      await this.fetchInitialChats();
    } else {
      // Data already cached - render immediately with NO loader!
      const filtered = this.model.getFilteredChats();
      this.view.renderThreadCards(filtered, this.model.selectedChatId);
      if (this.model.selectedChatId) {
        const activeChat = this.model.getChatById(this.model.selectedChatId);
        if (activeChat) {
          this.view.renderActiveChat(activeChat, activeChat.messages);
        }
      }
    }
  }

  /**
   * Registers silent background polling tasks for conversation threads and active messages
   */
  registerBackgroundPolling() {
    // Task 1: Inbound Conversation Threads (Priority 1: 4 seconds)
    pollingService.register('conversations_threads', {
      section: ['conversations', 'chats'],
      interval: 4000,
      fetchFn: async () => {
        try {
          const rawData = await this.model.apiService.fetchChats({
            workspaceId: this.model.currentWorkspaceId,
            channelId: this.model.currentChannelId,
            limit: 25,
            offset: 0
          });
          return this.model.flattenChats(rawData);
        } catch (err) {
          console.warn('[ChatsController] Polling fetchChats failed:', err.message || err);
          return null;
        }
      },
      onUpdate: (freshChats) => {
        if (Array.isArray(freshChats)) {
          this.handlePolledChatsUpdate(freshChats);
        }
      }
    });

    // Task 2: Active Chat Messages, Cart & Customer Orders (Priority 1: 3 seconds)
    pollingService.register('conversations_active_messages', {
      section: ['conversations', 'chats'],
      interval: POLLING_INTERVALS.CHAT_MESSAGES,
      fetchFn: async () => {
        if (!this.model.selectedChatId) return null;
        const chatId = this.model.selectedChatId;
        const chat = this.chatDetailsCache.get(chatId) || this.model.getChatById(chatId);
        const senderId = chat?.senderId || (typeof chat?.sender_id === 'object' ? chat?.sender_id?.id : chat?.sender_id);

        const [chatRes, ordersRes] = await Promise.allSettled([
          this.model.fetchChatDetails(chatId),
          senderId ? this.model.fetchOrdersBySender(senderId) : Promise.resolve([])
        ]);

        return {
          chatId,
          fullChat: chatRes.status === 'fulfilled' ? chatRes.value : null,
          orders: ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) ? ordersRes.value : null
        };
      },
      onUpdate: (pollResult) => {
        if (!pollResult || pollResult.chatId !== this.model.selectedChatId) return;
        this.handlePolledActiveChatSync(pollResult);
      }
    });
  }

  handlePolledChatsUpdate(freshChats) {
    if (!Array.isArray(freshChats) || freshChats.length === 0) return;

    const currentChats = this.model.chats || [];
    const currentMap = new Map(currentChats.map(c => [String(c.id), c]));
    let hasNewChats = false;
    let updatedChatId = null;
    const newChatsList = [];

    // 1. Identify brand-new chats and updated existing chats
    freshChats.forEach(freshChat => {
      const existing = currentMap.get(String(freshChat.id));
      if (!existing) {
        // Brand new chat from the backend!
        hasNewChats = true;
        updatedChatId = freshChat.id;
        newChatsList.push(freshChat);
      } else {
        // Existing chat: update properties if snippet or timestamp changed
        const oldSnippet = existing.lastMessageSnippet || existing.snippet;
        const newSnippet = freshChat.lastMessageSnippet || freshChat.snippet;
        const oldTs = existing.lastMessageTimestamp || existing.timestamp;
        const newTs = freshChat.lastMessageTimestamp || freshChat.timestamp;

        if (oldSnippet !== newSnippet || oldTs !== newTs) {
          Object.assign(existing, freshChat);
          updatedChatId = existing.id;
          this.view.updateThreadCardSnippet(existing.id, newSnippet, newTs, true);
        }
      }
    });

    // 2. If new chats were detected, prepend them to the model and deduplicate
    if (hasNewChats) {
      this.model.chats = [...newChatsList, ...this.model.chats];
      const seen = new Set();
      this.model.chats = this.model.chats.filter(c => {
        if (seen.has(String(c.id))) return false;
        seen.add(String(c.id));
        return true;
      });
    }

    // 3. Re-sort chats descending by latest timestamp
    this.model.chats.sort((a, b) => {
      const timeA = a.lastMessageTimestamp || a.timestamp ? new Date(a.lastMessageTimestamp || a.timestamp).getTime() : 0;
      const timeB = b.lastMessageTimestamp || b.timestamp ? new Date(b.lastMessageTimestamp || b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    // 4. Re-render thread cards if any new chats were added or updated
    if (hasNewChats || updatedChatId) {
      const filtered = this.model.getFilteredChats();
      this.view.renderThreadCards(filtered, this.model.selectedChatId);

      // Animate the updated or newly added chat card!
      if (updatedChatId) {
        this.view.flashUpdate(`[data-chat-id="${updatedChatId}"]`);
      }

      // If no chat was previously selected (e.g. initial empty inbox), auto-select the new chat
      if (!this.model.selectedChatId && filtered.length > 0) {
        this.selectChat(filtered[0].id);
      }
    }
  }

  handlePolledActiveChatSync(pollResult) {
    const { chatId, fullChat, orders } = pollResult;
    let cachedChat = this.chatDetailsCache.get(chatId) || this.model.getChatById(chatId);
    if (!cachedChat) return;

    // 1. Check for new incoming messages
    if (fullChat && Array.isArray(fullChat.messages)) {
      const currentMessages = Array.isArray(cachedChat.messages) ? cachedChat.messages : [];
      const currentIds = new Set(currentMessages.map(m => String(m.id || m._id)));
      const newMessages = fullChat.messages.filter(m => !currentIds.has(String(m.id || m._id)));

      if (newMessages.length > 0) {
        // Append new messages to the UI stream with animation
        this.view.appendNewMessages(newMessages, cachedChat);
        cachedChat.messages = fullChat.messages;

        // Update the thread card snippet in the left panel with pulse
        const lastMsg = newMessages[newMessages.length - 1];
        const snippetText = lastMsg.text || lastMsg.content || 'New message';
        cachedChat.lastMessageSnippet = snippetText;
        cachedChat.lastMessageTimestamp = lastMsg.createdAt || Date.now();
        this.view.updateThreadCardSnippet(chatId, snippetText, cachedChat.lastMessageTimestamp, true);
      }
    }

    // 2. Check for cart updates
    if (fullChat && (fullChat.cart || fullChat.pendingSelections)) {
      const oldCartTotal = cachedChat.cart?.totalPrice;
      const newCartTotal = fullChat.cart?.totalPrice;
      const oldItemsCount = Array.isArray(cachedChat.cart?.items) ? cachedChat.cart.items.length : 0;
      const newItemsCount = Array.isArray(fullChat.cart?.items) ? fullChat.cart.items.length : 0;
      const oldPending = cachedChat.pendingSelections?.productId;
      const newPending = fullChat.pendingSelections?.productId;

      const cartChanged = oldCartTotal !== newCartTotal || oldItemsCount !== newItemsCount || oldPending !== newPending;
      if (cartChanged) {
        cachedChat.cart = fullChat.cart;
        cachedChat.pendingSelections = fullChat.pendingSelections;
        this.view.updateActiveCart(cachedChat, true);
      }
    }

    // 3. Check for customer orders updates
    if (Array.isArray(orders)) {
      const oldOrders = this.chatOrdersCache.get(chatId) || [];
      const ordersChanged = JSON.stringify(oldOrders) !== JSON.stringify(orders);

      if (ordersChanged) {
        this.chatOrdersCache.set(chatId, orders);
        this.currentChatOrders = orders;
        this.view.renderUserOrders(orders, true);
      }
    }

    this.chatDetailsCache.set(chatId, cachedChat);
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
   * Selects a chat thread, triggers GET /chats/:id to load full chat data and messages.
   * Caches chat details and orders per-chat so return visits render instantly with zero loaders.
   */
  async selectChat(chatId) {
    this.model.selectedChatId = chatId;
    this.view.setActiveCard(chatId);

    const isAlreadyLoaded = this.loadedChatsSet.has(chatId);

    // If chat was already opened previously, display from cache immediately with ZERO loaders!
    if (isAlreadyLoaded) {
      const cachedChat = this.chatDetailsCache.get(chatId) || this.model.getChatById(chatId);
      const cachedOrders = this.chatOrdersCache.get(chatId) || [];
      this.currentChatOrders = cachedOrders;

      if (cachedChat) {
        this.view.renderActiveChat(cachedChat, cachedChat.messages, cachedOrders);
        this.view.scrollToBottom();
      }
      return;
    }

    // FIRST TIME ONLY for this chat:
    let chat = this.model.getChatById(chatId);
    if (chat) {
      this.view.renderActiveChat(chat);
      this.view.setChatStreamLoading(); // Loader only shown on first visit
    }

    // Fetch full chat data, messages, and customer orders
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

        // Fetch customer orders using GET /orders/sender/:senderId
        const senderId = chat.senderId || (typeof chat.sender_id === 'object' ? chat.sender_id.id : chat.sender_id);
        let orders = [];
        if (senderId) {
          try {
            const fetchedOrders = await this.model.fetchOrdersBySender(senderId);
            orders = Array.isArray(fetchedOrders) ? fetchedOrders : [];
          } catch (orderErr) {
            console.warn(`ChatsController: Could not load orders for sender ${senderId}:`, orderErr);
          }
        }

        this.currentChatOrders = orders;
        this.chatDetailsCache.set(chatId, chat);
        this.chatOrdersCache.set(chatId, orders);
        this.loadedChatsSet.add(chatId);

        // Render complete chat timeline and context sidebar with orders
        this.view.renderActiveChat(chat, chat.messages, orders);
        this.view.scrollToBottom();
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
