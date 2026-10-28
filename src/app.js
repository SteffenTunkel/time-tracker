/**
 * Work Time Tracker - Refactored Version
 * A modular, maintainable time tracking application
 */

// Configuration Constants
const CONFIG = {
  TIMELINE: {
    UPDATE_INTERVAL_MS: 20000,
    MIN_SESSION_DURATION_MS: 1000
  },
  STORAGE_KEYS: {
    WORK_TIMES: 'worktimes',
    TIMER_STATE: 'timerState',
    TIMELINE_DATA: 'timelineData',
    NET_ADJUSTMENTS: 'netAdjustments'
  }
};

// Utility Functions
const Utils = {
  formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  },

  getTodayString() {
    return new Date().toISOString().slice(0, 10);
  },

  getDayStart(dateString) {
    return new Date(dateString + 'T00:00:00').getTime();
  },

  formatDisplayTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },

  getDurationInMinutes(start, end) {
    return Math.round((end - start) / 60000);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Storage Manager
const StorageManager = {
  getJSON(key, defaultValue = {}) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to parse JSON from localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage key "${key}":`, error);
    }
  },

  getWorkTimes() {
    return this.getJSON(CONFIG.STORAGE_KEYS.WORK_TIMES, {});
  },

  setWorkTimes(workTimes) {
    this.setJSON(CONFIG.STORAGE_KEYS.WORK_TIMES, workTimes);
  },

  getTodayWorkTime() {
    const workTimes = this.getWorkTimes();
    const today = Utils.getTodayString();
    return workTimes[today] || 0;
  },

  setTodayWorkTime(seconds) {
    const workTimes = this.getWorkTimes();
    const today = Utils.getTodayString();
    workTimes[today] = seconds;
    this.setWorkTimes(workTimes);
  },

  getTimerState() {
    return this.getJSON(CONFIG.STORAGE_KEYS.TIMER_STATE, {});
  },

  setTimerState(state) {
    this.setJSON(CONFIG.STORAGE_KEYS.TIMER_STATE, state);
  },

  getTimelineData() {
    return this.getJSON(CONFIG.STORAGE_KEYS.TIMELINE_DATA, {});
  },

  setTimelineData(timelineData) {
    this.setJSON(CONFIG.STORAGE_KEYS.TIMELINE_DATA, timelineData);
  },

  getTodayTimeline() {
    const timelineData = this.getTimelineData();
    const today = Utils.getTodayString();
    return timelineData[today] || [];
  },

  addTimelineSession(session) {
    const timelineData = this.getTimelineData();
    const today = Utils.getTodayString();
    
    if (!timelineData[today]) {
      timelineData[today] = [];
    }
    
    timelineData[today].push(session);
    this.setTimelineData(timelineData);
  },

  clearTodayTimeline() {
    const timelineData = this.getTimelineData();
    const today = Utils.getTodayString();
    delete timelineData[today];
    this.setTimelineData(timelineData);
  },

  getNetAdjustments() {
    return this.getJSON(CONFIG.STORAGE_KEYS.NET_ADJUSTMENTS, {});
  },

  setNetAdjustments(adjustments) {
    this.setJSON(CONFIG.STORAGE_KEYS.NET_ADJUSTMENTS, adjustments);
  },

  getTodayNetAdjustments() {
    const adjustments = this.getNetAdjustments();
    const today = Utils.getTodayString();
    return adjustments[today] || 0;
  },

  setTodayNetAdjustments(seconds) {
    const adjustments = this.getNetAdjustments();
    const today = Utils.getTodayString();
    adjustments[today] = seconds;
    this.setNetAdjustments(adjustments);
  },

  clearTodayNetAdjustments() {
    const adjustments = this.getNetAdjustments();
    const today = Utils.getTodayString();
    delete adjustments[today];
    this.setNetAdjustments(adjustments);
  },

  clearTimerState() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TIMER_STATE);
  }
};

// Timer Class
class Timer {
  constructor() {
    this.startTime = null;
    this.elapsed = 0;
    this.timerInterval = null;
    this.netAdjustments = 0;
    this.updateCallbacks = [];
    
    this.timerDisplay = document.getElementById('timer');
    this.startPauseBtn = document.getElementById('startPauseBtn');
    
    this.loadFromStorage();
    this.setupEventListeners();
  }

  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  triggerUpdate() {
    this.updateCallbacks.forEach(callback => callback());
  }

  getCurrentElapsed() {
    return this.elapsed + (this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0);
  }

  isRunning() {
    return this.startTime !== null;
  }

  updateDisplay() {
    const currentElapsed = this.getCurrentElapsed();
    this.timerDisplay.textContent = Utils.formatTime(currentElapsed);
  }

  start() {
    if (this.timerInterval) return;
    if (!this.startTime) this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.updateDisplay();
      this.triggerUpdate();
      
    }, 1000);
    
    this.startPauseBtn.textContent = 'Pause';
    this.triggerUpdate();
    console.log('Timer started at', new Date().toLocaleTimeString());
  }

  pause() {
    if (!this.startTime) return;
    
    this.elapsed += Math.floor((Date.now() - this.startTime) / 1000);
    this.startTime = null;
    
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    
    this.startPauseBtn.textContent = 'Start';
    this.saveToStorage();
    this.triggerUpdate();
    console.log('Timer paused at', new Date().toLocaleTimeString());
  }

  reset() {
    if (!confirm("Reset today's time?")) return false;
    
    this.startTime = null;
    this.elapsed = 0;
    this.netAdjustments = 0;
    
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    
    this.startPauseBtn.textContent = 'Start';
    this.updateDisplay();
    this.saveToStorage();
    
    StorageManager.clearTimerState();
    StorageManager.clearTodayTimeline();
    StorageManager.clearTodayNetAdjustments();
    
    this.triggerUpdate();
    console.log('Timer reset');
    return true;
  }

  adjustTime(seconds) {
    this.elapsed += seconds;
    this.netAdjustments += seconds;
    
    if (this.elapsed < 0) this.elapsed = 0;
    
    this.updateDisplay();
    this.saveToStorage();
    this.triggerUpdate();
    
    console.log(`Timer adjusted by ${seconds} seconds`);
  }

  getNetAdjustmentsInfo() {
    const hours = Math.floor(Math.abs(this.netAdjustments) / 3600);
    const minutes = Math.floor((Math.abs(this.netAdjustments) % 3600) / 60);
    const sign = this.netAdjustments >= 0 ? '+' : '-';
    const timeStr = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    return {
      timeStr,
      isPositive: this.netAdjustments >= 0
    };
  }

  loadFromStorage() {
    const today = Utils.getTodayString();
    
    this.elapsed = StorageManager.getTodayWorkTime();
    
    const state = StorageManager.getTimerState();
    if (state.date === today && state.isRunning) {
      this.startTime = state.startTime;
      this.elapsed = state.elapsed;
      this.start();
    } else if (state.date === today) {
      this.elapsed = state.elapsed;
    } else if (state.date && state.date !== today) {
      StorageManager.clearTimerState();
    }
    
    this.netAdjustments = StorageManager.getTodayNetAdjustments();
    
    this.updateDisplay();
    console.log('Timer state loaded from storage');
  }

  saveToStorage() {
    const today = Utils.getTodayString();
    
    const currentElapsed = this.getCurrentElapsed();
    StorageManager.setTodayWorkTime(currentElapsed);
    
    const state = {
      elapsed: this.elapsed,
      isRunning: this.startTime !== null,
      startTime: this.startTime,
      date: today
    };
    StorageManager.setTimerState(state);
    
    StorageManager.setTodayNetAdjustments(this.netAdjustments);
    
    console.log('Timer state saved to storage at', new Date().toLocaleTimeString());
  }

  setupEventListeners() {
    this.startPauseBtn.addEventListener('click', () => {
      if (this.isRunning()) {
        this.pause();
      } else {
        this.start();
      }
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.reset();
    });

    document.getElementById('addBtn').addEventListener('click', () => {
      const minutes = parseInt(document.getElementById('manualMinutes').value) || 10;
      this.adjustTime(minutes * 60);
    });

    document.getElementById('subtractBtn').addEventListener('click', () => {
      const minutes = parseInt(document.getElementById('manualMinutes').value) || 10;
      this.adjustTime(-minutes * 60);
    });

    const manualMinutesInput = document.getElementById('manualMinutes');
    manualMinutesInput.addEventListener('input', this.updateButtonText);

    window.addEventListener('beforeunload', () => {
      if (this.isRunning()) {
        this.saveToStorage();
      }
    });

    this.updateButtonText();
  }

  updateButtonText() {
    const minutes = parseInt(document.getElementById('manualMinutes').value) || 10;
    document.getElementById('addBtn').textContent = `+ ${minutes} Min`;
    document.getElementById('subtractBtn').textContent = `- ${minutes} Min`;
  }
}

// Timeline Class
class Timeline {
  constructor(timer) {
    this.timer = timer;
    
    this.timelineBar = document.getElementById('timelineBar');
    this.timelineLabels = document.querySelector('.timeline-labels');
    
    this.updateTimeline();
    this.setupPeriodicUpdate();
  }

  setupPeriodicUpdate() {
    setInterval(() => {
      if (this.timer.isRunning()) {
        this.updateTimeline();
      }
    }, CONFIG.TIMELINE.UPDATE_INTERVAL_MS);
  }

  saveCurrentSession() {
    if (!this.timer.startTime) return;
    
    const sessionStart = this.timer.startTime;
    const sessionEnd = Date.now();
    
    if (sessionEnd - sessionStart > CONFIG.TIMELINE.MIN_SESSION_DURATION_MS) {
      const session = {
        start: sessionStart,
        end: sessionEnd
      };
      
      StorageManager.addTimelineSession(session);
      console.log(`Saved work session from ${Utils.formatDisplayTime(sessionStart)} to ${Utils.formatDisplayTime(sessionEnd)}`);
    }
  }

  updateTimeline() {
    const today = Utils.getTodayString();
    this.timelineBar.innerHTML = '';
    this.timelineLabels.innerHTML = '';
    
    const todayData = StorageManager.getTodayTimeline();
    
    if (todayData.length === 0 && !this.timer.isRunning()) {
      this.renderDefaultView();
      return;
    }
    
    const timeRange = this.calculateTimeRange(todayData);
    this.renderTimelineLabels(timeRange);
    this.renderTimelineTicks(timeRange);
    this.renderCompletedSessions(todayData, timeRange);
    this.renderCurrentSession(timeRange);
  }

  renderDefaultView() {
    const defaultHours = [0, 6, 12, 18, 24];
    defaultHours.forEach((hour, index) => {
      const percent = (index / (defaultHours.length - 1)) * 100;
      this.createTimelineLabel(percent, `${String(hour).padStart(2, '0')}:00`);
    });
  }

  calculateTimeRange(todayData) {
    const dayStart = Utils.getDayStart(Utils.getTodayString());
    let earliestTime = Date.now();
    let latestTime = Date.now();
    
    todayData.forEach(session => {
      earliestTime = Math.min(earliestTime, session.start);
      latestTime = Math.max(latestTime, session.end);
    });
    
    if (this.timer.isRunning()) {
      earliestTime = Math.min(earliestTime, this.timer.startTime);
      latestTime = Math.max(latestTime, Date.now());
    }
    
    const earliestHour = Math.floor((earliestTime - dayStart) / (60 * 60 * 1000));
    const latestHour = Math.ceil((latestTime - dayStart) / (60 * 60 * 1000));
    
    const startHour = Math.max(0, earliestHour - 1);
    const endHour = Math.min(24, latestHour + 1);
    
    const timelineStart = dayStart + (startHour * 60 * 60 * 1000);
    const timelineEnd = dayStart + (endHour * 60 * 60 * 1000);
    const timelineDuration = timelineEnd - timelineStart;
    
    return {
      dayStart,
      startHour,
      endHour,
      timelineStart,
      timelineEnd,
      timelineDuration
    };
  }

  renderTimelineLabels(timeRange) {
    const { dayStart, startHour, endHour, timelineStart, timelineDuration } = timeRange;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const hourTime = dayStart + (hour * 60 * 60 * 1000);
      const percent = ((hourTime - timelineStart) / timelineDuration) * 100;
      this.createTimelineLabel(percent, `${String(hour).padStart(2, '0')}:00`);
    }
  }

  renderTimelineTicks(timeRange) {
    const { dayStart, startHour, endHour, timelineStart, timelineDuration } = timeRange;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const hourTime = dayStart + (hour * 60 * 60 * 1000);
      const percent = ((hourTime - timelineStart) / timelineDuration) * 100;
      this.createTimelineTick(percent);
    }
  }

  renderCompletedSessions(todayData, timeRange) {
    const { timelineStart, timelineEnd, timelineDuration } = timeRange;
    
    todayData.forEach(session => {
      if (session.end <= timelineStart || session.start >= timelineEnd) return;
      
      const sessionStart = Math.max(session.start, timelineStart);
      const sessionEnd = Math.min(session.end, timelineEnd);
      
      if (sessionStart < sessionEnd) {
        const leftPercent = ((sessionStart - timelineStart) / timelineDuration) * 100;
        const widthPercent = ((sessionEnd - sessionStart) / timelineDuration) * 100;
        
        this.createTimelineSegment({
          leftPercent,
          widthPercent,
          color: '#28a745',
          tooltip: this.createSessionTooltip(session),
          isCurrent: false
        });
      }
    });
  }

  renderCurrentSession(timeRange) {
    if (!this.timer.isRunning()) return;
    
    const { timelineStart, timelineEnd, timelineDuration } = timeRange;
    const currentStart = Math.max(this.timer.startTime, timelineStart);
    const currentEnd = Math.min(Date.now(), timelineEnd);
    
    if (currentStart < timelineEnd && currentEnd > timelineStart && currentStart < currentEnd) {
      const leftPercent = ((currentStart - timelineStart) / timelineDuration) * 100;
      const widthPercent = ((currentEnd - currentStart) / timelineDuration) * 100;
      
      this.createTimelineSegment({
        leftPercent,
        widthPercent,
        color: '#28a745',
        tooltip: this.createCurrentSessionTooltip(currentStart, currentEnd),
        isCurrent: true
      });
    }
  }

  createTimelineLabel(percent, text) {
    const label = document.createElement('span');
    label.className = 'timeline-label';
    label.style.left = percent + '%';
    label.textContent = text;
    this.timelineLabels.appendChild(label);
  }

  createTimelineTick(percent) {
    const tick = document.createElement('div');
    tick.className = 'timeline-tick';
    tick.style.left = percent + '%';
    this.timelineBar.appendChild(tick);
  }

  createTimelineSegment(options) {
    const { leftPercent, widthPercent, color, tooltip, isCurrent } = options;
    
    const segment = document.createElement('div');
    segment.className = `timeline-segment ${isCurrent ? 'timeline-current' : ''}`;
    segment.style.left = leftPercent + '%';
    segment.style.width = widthPercent + '%';
    segment.style.backgroundColor = color;
    segment.title = tooltip;
    segment.style.cursor = 'help';
    
    this.timelineBar.appendChild(segment);
  }

  createSessionTooltip(session) {
    const startTimeStr = Utils.formatDisplayTime(session.start);
    const endTimeStr = Utils.formatDisplayTime(session.end);
    const duration = Utils.getDurationInMinutes(session.start, session.end);
    return `${startTimeStr} - ${endTimeStr} (${duration} min.)`;
  }

  createCurrentSessionTooltip(start, end) {
    const startTimeStr = Utils.formatDisplayTime(start);
    const currentTimeStr = Utils.formatDisplayTime(end);
    const duration = Utils.getDurationInMinutes(start, end);
    return `${startTimeStr} - ${currentTimeStr} (${duration} min.) - In progress`;
  }

  onTimerPause() {
    this.saveCurrentSession();
  }

  onTimerReset() {
    StorageManager.clearTodayTimeline();
    this.updateTimeline();
  }

}

// History Class
class History {
  constructor() {
    this.historyList = document.getElementById('historyList');
    this.setupEventListeners();
    this.showHistory();
  }

  showHistory() {
    this.historyList.innerHTML = '';
    const workTimes = StorageManager.getWorkTimes();
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const time = workTimes[key] || 0;
      
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <span>${this.formatDateDisplay(date)}</span>
        <span class="badge bg-primary rounded-pill">${Utils.formatTime(time)}</span>
      `;
      this.historyList.appendChild(li);
    }
  }

  formatDateDisplay(date) {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }

  setupEventListeners() {
    const historyCollapse = document.getElementById('historyCollapse');
    const historyToggleText = document.getElementById('historyToggleText');
    const historyToggleIcon = document.getElementById('historyToggleIcon');

    historyCollapse.addEventListener('show.bs.collapse', () => {
      historyToggleText.textContent = 'Hide History';
      historyToggleIcon.textContent = '▲';
      this.showHistory();
    });

    historyCollapse.addEventListener('hide.bs.collapse', () => {
      historyToggleText.textContent = 'Show History';
      historyToggleIcon.textContent = '▼';
    });
  }

  refresh() {
    const historyCollapse = document.getElementById('historyCollapse');
    if (historyCollapse.classList.contains('show')) {
      this.showHistory();
    }
  }
}

// UI Manager Class
class UIManager {
  constructor(timer) {
    this.timer = timer;
    
    this.netAdjustmentsDisplay = document.getElementById('netAdjustments');
    this.updateDisplays();
  }

  updateDisplays() {
    this.updateNetAdjustmentsDisplay();
  }

  updateNetAdjustmentsDisplay() {
    const adjustmentsInfo = this.timer.getNetAdjustmentsInfo();
    this.netAdjustmentsDisplay.textContent = adjustmentsInfo.timeStr;
    this.netAdjustmentsDisplay.className = `net-time ${adjustmentsInfo.isPositive ? 'positive' : 'negative'}`;
  }

}

// Main Application Class
class WorkTimeTracker {
  constructor() {
    this.initializeModules();
    this.setupInterModuleCommunication();
    
    console.log('Work Time Tracker initialized successfully');
  }

  initializeModules() {
    this.timer = new Timer();
    this.timeline = new Timeline(this.timer);
    this.history = new History();
    this.uiManager = new UIManager(this.timer);
  }

  setupInterModuleCommunication() {
    this.timer.onUpdate(() => {
      this.uiManager.updateDisplays();
    });

    this.setupTimerEventHandlers();
  }

  setupTimerEventHandlers() {
    const originalStart = this.timer.start.bind(this.timer);
    this.timer.start = () => {
      originalStart();
      this.timeline.updateTimeline();
      this.uiManager.updateDisplays();
    };

    const originalPause = this.timer.pause.bind(this.timer);
    this.timer.pause = () => {
      this.timeline.onTimerPause();
      originalPause();
      this.timeline.updateTimeline();
      this.uiManager.updateDisplays();
    };

    const originalReset = this.timer.reset.bind(this.timer);
    this.timer.reset = () => {
      if (!originalReset()) return;
      this.timeline.onTimerReset();
      this.history.refresh();
      this.uiManager.updateDisplays();
    };

    const originalAdjustTime = this.timer.adjustTime.bind(this.timer);
    this.timer.adjustTime = (seconds) => {
      originalAdjustTime(seconds);
      this.history.refresh();
      this.uiManager.updateDisplays();
    };
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.workTimeTracker = new WorkTimeTracker();
});
