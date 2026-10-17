import { ApiService } from '../services/ApiServices.js';

export class ChatModel {
  constructor() {
    this.apiService = new ApiService();
    this.chats = []; // Flattened chats list
    this.workspacesData = []; // Raw nested data
    this.currentWorkspaceId = 'all';
    this.currentChannelId = 'all';
    this.searchQuery = '';
    this.limit = 10;
    this.offset = 0;
    this.isLoading = false;
    this.hasMore = true;
    this.selectedChatId = null;
  }

  /**
   * Normalizes an individual chat object extracting sender_id (now structured as { id, user_name } or string)
   * and setting user_name as the primary thread heading.
   */
  _normalizeChat(chat, defaults = {}) {
    let userName = '';
    if (chat.sender_id && typeof chat.sender_id === 'object') {
      userName = chat.sender_id.user_name || chat.sender_id.userName || chat.sender_id.name || chat.sender_id.username || String(chat.sender_id.id || '');
    } else if (chat.sender_id !== undefined && chat.sender_id !== null) {
      userName = String(chat.sender_id);
    }

    if (!userName) {
      userName = chat.user_name || chat.userName || chat.username || chat.name || chat.senderId || `Customer #${chat.id}`;
    }

    const workspaceId = chat.workspaceId ?? defaults.workspaceId ?? null;
    const workspaceName = chat.workspaceName || defaults.workspaceName || (workspaceId ? `Workspace #${workspaceId}` : 'All Workspaces');
    const channelId = chat.channelId ?? defaults.channelId ?? null;
    const channelName = chat.channelName || defaults.channelName || (channelId ? `Channel #${channelId}` : 'Direct');
    const platform = (chat.platform || defaults.platform || 'webchat').toLowerCase();
    const snippet = chat.lastMessageSnippet || chat.last_message_snippet || chat.snippet || chat.lastMessage || 'No messages yet';
    const timestamp = chat.lastMessageTimestamp || chat.last_message_timestamp || chat.updatedAt || chat.createdAt || null;
    const cartId = chat.cartId || chat.cart_id || (chat.cart && chat.cart.id) || null;

    return {
      ...chat,
      id: chat.id,
      workspaceId,
      workspaceName,
      channelId,
      channelName,
      platform,
      user_name: userName,
      title: userName,
      snippet,
      lastMessageSnippet: snippet,
      timestamp,
      lastMessageTimestamp: timestamp,
      cartId
    };
  }

  /**
   * Flattens the deeply nested Workspace -> Channels -> Chats backend payload
   * and sorts by lastMessageTimestamp descending (newest messages first).
   */
  flattenChats(workspacesPayload) {
    if (!workspacesPayload) return [];
    const flat = [];
    const list = Array.isArray(workspacesPayload) 
      ? workspacesPayload 
      : (workspacesPayload.workspaces || workspacesPayload.data || [workspacesPayload]);

    for (const item of list) {
      // Case 1: Item is a Workspace with nested channels
      if (Array.isArray(item.channels)) {
        const workspaceName = item.name || `Workspace #${item.id}`;
        const workspaceId = item.id;

        for (const channel of item.channels) {
          const channelName = channel.name || `Channel #${channel.id}`;
          const channelId = channel.id;
          const platform = (channel.platform || 'webchat').toLowerCase();
          const chats = Array.isArray(channel.chats) ? channel.chats : [];

          for (const chat of chats) {
            flat.push(this._normalizeChat(chat, { workspaceId, workspaceName, channelId, channelName, platform }));
          }
        }
      } 
      // Case 2: Item is a Channel with nested chats
      else if (Array.isArray(item.chats)) {
        const channelName = item.name || `Channel #${item.id}`;
        const channelId = item.id;
        const platform = (item.platform || 'webchat').toLowerCase();

        for (const chat of item.chats) {
          flat.push(this._normalizeChat(chat, { channelId, channelName, platform }));
        }
      }
      // Case 3: Item is already a Chat object
      else if (item.id !== undefined && (item.sender_id !== undefined || item.lastMessageSnippet !== undefined || item.lastMessageTimestamp !== undefined || item.messages !== undefined)) {
        flat.push(this._normalizeChat(item));
      }
    }

    // Sort by lastMessageTimestamp descending (newest first)
    flat.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    return flat;
  }

  /**
   * Fetches chats from the API with pagination, workspaceId, and channelId filters.
   */
  async fetchChats({ workspaceId = this.currentWorkspaceId, channelId = this.currentChannelId, reset = false } = {}) {
    if (this.isLoading) return [];
    if (!reset && !this.hasMore) return [];

    if (reset) {
      this.offset = 0;
      this.hasMore = true;
      this.chats = [];
    }

    this.isLoading = true;
    this.currentWorkspaceId = workspaceId;
    this.currentChannelId = channelId;

    try {
      const rawData = await this.apiService.fetchChats({
        workspaceId: this.currentWorkspaceId,
        channelId: this.currentChannelId,
        limit: this.limit,
        offset: this.offset
      });

      let list = [];
      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.workspaces)) list = rawData.workspaces;
        else if (Array.isArray(rawData.data)) list = rawData.data;
        else if (Array.isArray(rawData.channels)) list = [rawData];
        else if (Array.isArray(rawData.chats)) list = [{ channels: [rawData] }];
        else if (rawData.id !== undefined) list = [rawData];
      }

      this.workspacesData = list;
      const newFlattenedChats = this.flattenChats(this.workspacesData);

      if (newFlattenedChats.length < this.limit) {
        this.hasMore = false;
      }

      if (reset) {
        this.chats = newFlattenedChats;
      } else {
        const existingIds = new Set(this.chats.map(c => String(c.id)));
        const filteredNew = newFlattenedChats.filter(c => !existingIds.has(String(c.id)));
        this.chats = [...this.chats, ...filteredNew];
        if (filteredNew.length === 0 && newFlattenedChats.length > 0) {
          this.hasMore = false;
        }
      }

      return newFlattenedChats;
    } finally {
      this.isLoading = false;
    }
  }

  getFilteredChats() {
    return this.chats.filter(chat => {
      // Search query filter (title/user_name, snippet, workspaceName, channelName)
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const title = (chat.title || '').toLowerCase();
        const snippet = (chat.snippet || '').toLowerCase();
        const wsName = (chat.workspaceName || '').toLowerCase();
        const chName = (chat.channelName || '').toLowerCase();
        if (!title.includes(q) && !snippet.includes(q) && !wsName.includes(q) && !chName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }

  getChatById(id) {
    return this.chats.find(c => String(c.id) === String(id)) || null;
  }

  getSelectedChat() {
    if (this.selectedChatId) {
      const found = this.getChatById(this.selectedChatId);
      if (found) return found;
    }
    const filtered = this.getFilteredChats();
    return filtered[0] || null;
  }
}
