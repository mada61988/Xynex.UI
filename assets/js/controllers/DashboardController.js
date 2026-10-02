export class DashboardController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  async init() {
    // Delegate event handlers to View
    this.view.bindSidebarToggle((isOpen) => this.view.toggleSidebar(isOpen));
    this.view.bindSidebarLinkSelection();
    this.view.bindTimeframeSelection(this.handleTimeframeChange.bind(this));

    // Initial Data Payload
    const metrics = await this.model.fetchMetrics();
    this.view.renderMetrics(metrics);
  }

  async handleTimeframeChange(timeframe) {
    console.log(`DashboardController: Timeframe changed to ${timeframe}`);
    // Request updated data from Model and re-render View
    const metrics = await this.model.fetchMetrics(); 
    this.view.renderMetrics(metrics);
  }
}
