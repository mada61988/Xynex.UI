export class DashboardModel {
  constructor() {
    this.metrics = {
      activeBots: 3,
      messagesHandled: 48291,
      conversionRate: 18.4,
      automatedSales: 142850
    };
  }

  async fetchMetrics() {
    // Simulate an async API call to fetch live chatbot metrics
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.metrics);
      }, 300);
    });
  }
}
