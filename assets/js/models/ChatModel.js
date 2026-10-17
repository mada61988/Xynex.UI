import { ApiService } from '../services/ApiServices.js';

export class ChatModel {
  constructor() {
    this.apiService = new ApiService();
    this.chats = []; // Flattened chats list
    this.workspacesData = []; // Raw nested data
    this.currentWorkspaceId = 'all';
    this.currentChannelFilter = 'all';
    this.searchQuery = '';
    this.limit = 10;
    this.offset = 0;
    this.isLoading = false;
    this.hasMore = true;
    this.selectedChatId = null;
  }

  /**
   * Flattens the deeply nested Workspaces -> Channels -> Chats backend payload
   * and sorts by lastMessageTimestamp descending (newest messages first).
   */
  flattenChats(workspacesPayload) {
    if (!Array.isArray(workspacesPayload)) return [];
    const flat = [];

    for (const workspace of workspacesPayload) {
      const workspaceName = workspace.name || `Workspace #${workspace.id}`;
      const workspaceId = workspace.id;
      const channels = Array.isArray(workspace.channels) ? workspace.channels : [];

      for (const channel of channels) {
        const channelName = channel.name || `Channel #${channel.id}`;
        const channelId = channel.id;
        const platform = (channel.platform || 'webchat').toLowerCase();
        const chats = Array.isArray(channel.chats) ? channel.chats : [];

        for (const chat of chats) {
          flat.push({
            ...chat,
            workspaceId,
            workspaceName,
            channelId,
            channelName,
            platform,
            title: chat.userName || chat.username || chat.name || chat.senderId || `Chat #${chat.id}`,
            snippet: chat.lastMessageSnippet || 'No messages yet',
            timestamp: chat.lastMessageTimestamp || chat.updatedAt || chat.createdAt || null
          });
        }
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
   * Fetches chats from the API with pagination and workspace filter
   */
  async fetchChats({ workspaceId = this.currentWorkspaceId, reset = false } = {}) {
    if (this.isLoading) return [];
    if (!reset && !this.hasMore) return [];

    if (reset) {
      this.offset = 0;
      this.hasMore = true;
      this.chats = [];
    }

    this.isLoading = true;
    this.currentWorkspaceId = workspaceId;

    try {
      const rawData = await this.apiService.fetchChats({
        workspaceId: this.currentWorkspaceId,
        limit: this.limit,
        offset: this.offset
      });

      this.workspacesData = Array.isArray(rawData) ? rawData : [];
      const newFlattenedChats = this.flattenChats(this.workspacesData);

      if (newFlattenedChats.length < this.limit) {
        this.hasMore = false;
      }

      if (reset) {
        this.chats = newFlattenedChats;
      } else {
        const existingIds = new Set(this.chats.map(c => c.id));
        const filteredNew = newFlattenedChats.filter(c => !existingIds.has(c.id));
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
      // Channel platform filter
      if (this.currentChannelFilter !== 'all') {
        if (chat.platform !== this.currentChannelFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query filter (title, snippet, workspaceName)
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const title = (chat.title || '').toLowerCase();
        const snippet = (chat.snippet || '').toLowerCase();
        const wsName = (chat.workspaceName || '').toLowerCase();
        if (!title.includes(q) && !snippet.includes(q) && !wsName.includes(q)) {
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
