const Storage = {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  },

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  async getReminders() {
    const reminders = await this.get('reminders') || [];
    return reminders;
  },

  async addReminder(reminder) {
    const reminders = await this.getReminders();
    reminders.push(reminder);
    await this.set('reminders', reminders);
  },

  async removeReminder(id) {
    const reminders = await this.getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    await this.set('reminders', filtered);
  }
};
