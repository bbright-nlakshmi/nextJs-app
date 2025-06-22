import EventEmitter from 'events';

class GlobalEmitter extends EventEmitter {
  constructor() {
    super();
    // You can initialize any properties here if needed
  }

  // You can add custom methods to emit specific events
  emitUserLoggedIn(userId) {
    this.emit('userLoggedIn', userId);
  }

  emitDataUpdated(data) {
    this.emit('dataUpdated', data);
  }
}

// Export a singleton instance to ensure all parts of your application
// interact with the same emitter instance.
const globalEmitter = new GlobalEmitter();
export default globalEmitter;