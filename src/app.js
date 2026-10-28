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
    NET_ADJUSTMENTS: 'netAdjustments',
    WORKDAY_TARGET: 'workdayTarget'
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

  getISOWeekNumber(date) {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - (utcDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    return Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
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

  setTodayTimeline(sessions) {
    const timelineData = this.getTimelineData();
    timelineData[Utils.getTodayString()] = sessions;
    this.setTimelineData(timelineData);
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

  getWorkdayTarget() {
    return Number(localStorage.getItem(CONFIG.STORAGE_KEYS.WORKDAY_TARGET)) || 8;
  },

  setWorkdayTarget(hours) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.WORKDAY_TARGET, String(hours));
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
    const currentElapsed = this.getCurrentElapsed();
    const adjustedSeconds = Math.max(0, currentElapsed + seconds) - currentElapsed;
    this.elapsed += adjustedSeconds;
    this.netAdjustments += adjustedSeconds;
    
    this.updateDisplay();
    this.saveToStorage();
    this.triggerUpdate();
    
    console.log(`Timer adjusted by ${adjustedSeconds} seconds`);
    return adjustedSeconds;
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
    this.adjustmentTimeInput = document.getElementById('adjustmentTime');
    this.adjustmentMinutesInput = document.getElementById('manualMinutes');
    this.adjustmentMessage = document.getElementById('timelineAdjustmentMessage');
    this.selectedTimestamp = Date.now();
    this.currentTimeRange = null;
    
    this.adjustmentTimeInput.value = this.formatTimeInput(this.selectedTimestamp);
    this.setupEventListeners();
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
    this.timelineBar.innerHTML = '';
    this.timelineLabels.innerHTML = '';
    
    const todayData = StorageManager.getTodayTimeline();
    
    if (todayData.length === 0 && !this.timer.isRunning()) {
      this.renderDefaultView();
    } else {
      const timeRange = this.calculateTimeRange(todayData);
      this.currentTimeRange = timeRange;
      this.renderTimelineLabels(timeRange);
      this.renderTimelineTicks(timeRange);
      this.renderCompletedSessions(todayData, timeRange);
      this.renderCurrentSession(timeRange);
    }
    
    this.renderSelectionMarker();
  }

  renderDefaultView() {
    const dayStart = Utils.getDayStart(Utils.getTodayString());
    this.currentTimeRange = {
      dayStart,
      startHour: 0,
      endHour: 24,
      timelineStart: dayStart,
      timelineEnd: dayStart + 24 * 60 * 60 * 1000,
      timelineDuration: 24 * 60 * 60 * 1000
    };
    const defaultHours = [0, 6, 12, 18, 24];
    defaultHours.forEach((hour, index) => {
      const percent = (index / (defaultHours.length - 1)) * 100;
      this.createTimelineLabel(percent, `${String(hour).padStart(2, '0')}:00`);
    });
    this.renderTimelineTicks(this.currentTimeRange);
  }

  calculateTimeRange(todayData) {
    const dayStart = Utils.getDayStart(Utils.getTodayString());
    let earliestTime = Math.min(Date.now(), this.selectedTimestamp);
    let latestTime = Math.max(Date.now(), this.selectedTimestamp + this.getAdjustmentMinutes() * 60 * 1000);
    
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
          color: '#43a77e',
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
          color: '#43a77e',
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
    segment.tabIndex = 0;
    segment.setAttribute('aria-label', tooltip);
    segment.style.cursor = 'crosshair';
    
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

  setupEventListeners() {
    this.timelineBar.addEventListener('click', (event) => {
      const bounds = this.timelineBar.getBoundingClientRect();
      const position = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
      const timestamp = this.currentTimeRange.timelineStart + position * this.currentTimeRange.timelineDuration;
      this.selectAdjustmentTime(Math.round(timestamp / 60000) * 60000);
    });

    this.adjustmentTimeInput.addEventListener('input', () => {
      const [hours, minutes] = this.adjustmentTimeInput.value.split(':').map(Number);
      const selectedDate = new Date();
      selectedDate.setHours(hours || 0, minutes || 0, 0, 0);
      this.selectedTimestamp = selectedDate.getTime();
      this.adjustmentMessage.textContent = '';
      this.updateTimeline();
    });

    this.adjustmentMinutesInput.addEventListener('input', () => {
      this.updateTimeline();
    });

    document.getElementById('addBtn').addEventListener('click', () => {
      this.addTimeAtSelection();
    });

    document.getElementById('subtractBtn').addEventListener('click', () => {
      this.removeTimeAtSelection();
    });
  }

  selectAdjustmentTime(timestamp) {
    this.selectedTimestamp = timestamp;
    this.adjustmentTimeInput.value = this.formatTimeInput(timestamp);
    this.adjustmentMessage.textContent = '';
    this.updateTimeline();
  }

  formatTimeInput(timestamp) {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  renderSelectionMarker() {
    if (!this.currentTimeRange) return;
    const { timelineStart, timelineEnd, timelineDuration } = this.currentTimeRange;
    if (this.selectedTimestamp < timelineStart || this.selectedTimestamp > timelineEnd) return;

    const trackWidth = this.timelineBar.getBoundingClientRect().width;
    if (trackWidth <= 0) return;

    const requestedDuration = this.getAdjustmentMinutes() * 60 * 1000;
    const previewDuration = Math.min(requestedDuration, timelineDuration);
    const previewWidth = Math.min(trackWidth, Math.max(4, (previewDuration / timelineDuration) * trackWidth));
    const selectedOffset = ((this.selectedTimestamp - timelineStart) / timelineDuration) * trackWidth;
    const previewLeft = Math.max(0, Math.min(selectedOffset, trackWidth - previewWidth));
    const marker = document.createElement('div');
    marker.className = 'timeline-selection-marker';
    marker.style.left = `${previewLeft}px`;
    marker.style.width = `${previewWidth}px`;
    marker.title = `${this.getAdjustmentMinutes()} min. from ${Utils.formatDisplayTime(this.selectedTimestamp)}`;
    marker.setAttribute('aria-label', `Selected ${this.getAdjustmentMinutes()} minute adjustment window starting at ${Utils.formatDisplayTime(this.selectedTimestamp)}`);
    this.timelineBar.appendChild(marker);
  }

  getAdjustmentMinutes() {
    const minutes = Number.parseInt(this.adjustmentMinutesInput.value, 10);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
  }

  mergeSessions(sessions) {
    const orderedSessions = sessions
      .filter(session => Number.isFinite(session.start) && Number.isFinite(session.end) && session.end > session.start)
      .map(session => ({ ...session }))
      .sort((left, right) => left.start - right.start);
    const mergedSessions = [];

    orderedSessions.forEach(session => {
      const previousSession = mergedSessions[mergedSessions.length - 1];
      if (!previousSession || session.start > previousSession.end) {
        mergedSessions.push(session);
        return;
      }

      previousSession.end = Math.max(previousSession.end, session.end);
      previousSession.manual = Boolean(previousSession.manual && session.manual);
    });

    return mergedSessions;
  }

  getCoveredMilliseconds(sessions, start, end) {
    return this.mergeSessions(sessions).reduce((total, session) => {
      return total + Math.max(0, Math.min(session.end, end) - Math.max(session.start, start));
    }, 0);
  }

  addTimeAtSelection() {
    const minutes = this.getAdjustmentMinutes();
    const start = this.selectedTimestamp;
    const requestedEnd = start + minutes * 60 * 1000;
    const now = Date.now();
    const dayStart = Utils.getDayStart(Utils.getTodayString());
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const end = Math.min(requestedEnd, now, dayEnd);
    const cappedAtNow = requestedEnd > now;

    if (start >= now || end <= start) {
      this.adjustmentMessage.textContent = 'Select a start time before now.';
      return;
    }

    const wasRunning = this.timer.isRunning();
    const runningSession = wasRunning ? { start: this.timer.startTime, end: now } : null;
    const overlapsRunningSession = runningSession && start <= runningSession.end && end >= runningSession.start;
    if (overlapsRunningSession) this.timer.pause();

    const sessions = StorageManager.getTodayTimeline();
    const intervalsForCoverage = [...sessions];
    if (this.timer.isRunning()) {
      intervalsForCoverage.push({ start: this.timer.startTime, end: Date.now() });
    }

    const requestedMilliseconds = end - start;
    const coveredMilliseconds = this.getCoveredMilliseconds(intervalsForCoverage, start, end);
    const addedSeconds = Math.floor((requestedMilliseconds - coveredMilliseconds) / 1000);
    const updatedSessions = this.mergeSessions([...sessions, { start, end, manual: true }]);
    StorageManager.setTodayTimeline(updatedSessions);
    if (addedSeconds > 0) this.timer.adjustTime(addedSeconds);

    this.adjustmentMessage.textContent = addedSeconds > 0
      ? `Added ${Utils.formatTime(addedSeconds)} at ${Utils.formatDisplayTime(start)}${cappedAtNow ? ' through now' : ''}.`
      : 'Window already tracked; connected sessions merged.';
    this.updateTimeline();
    if (overlapsRunningSession && wasRunning) this.timer.start();
  }

  removeTimeAtSelection() {
    const minutes = this.getAdjustmentMinutes();
    const selectedTime = this.selectedTimestamp;
    const selectedEnd = selectedTime + minutes * 60 * 1000;
    const wasRunning = this.timer.isRunning();
    const runningSession = wasRunning ? { start: this.timer.startTime, end: Date.now() } : null;
    const savedSessions = StorageManager.getTodayTimeline();
    const intersectsSavedSession = savedSessions.some(session => selectedTime < session.end && selectedEnd > session.start);
    const intersectsRunningSession = runningSession && selectedTime < runningSession.end && selectedEnd > runningSession.start;

    if (!intersectsSavedSession && !intersectsRunningSession) {
      this.adjustmentMessage.textContent = 'Select a work session to remove time.';
      return;
    }

    if (intersectsRunningSession) this.timer.pause();

    const sessions = this.mergeSessions(StorageManager.getTodayTimeline());
    const totalOverlap = this.getCoveredMilliseconds(sessions, selectedTime, selectedEnd);
    const removalBudget = Math.floor(Math.min(totalOverlap, this.timer.getCurrentElapsed() * 1000) / 1000) * 1000;
    if (removalBudget <= 0) {
      this.adjustmentMessage.textContent = 'No tracked time in that window can be removed.';
      if (intersectsRunningSession && wasRunning) this.timer.start();
      return;
    }

    let remainingRemoval = removalBudget;
    const replacementSessions = [];
    sessions.forEach(session => {
      const overlapStart = Math.max(session.start, selectedTime);
      const overlapEnd = Math.min(session.end, selectedEnd);
      const removableDuration = Math.max(0, overlapEnd - overlapStart);
      const removedFromSession = Math.min(removableDuration, remainingRemoval);

      if (removedFromSession === 0) {
        replacementSessions.push(session);
        return;
      }

      const removedEnd = overlapStart + removedFromSession;
      if (session.start < overlapStart) {
        replacementSessions.push({ start: session.start, end: overlapStart, manual: session.manual });
      }
      if (removedEnd < session.end) {
        replacementSessions.push({ start: removedEnd, end: session.end, manual: session.manual });
      }
      remainingRemoval -= removedFromSession;
    });

    StorageManager.setTodayTimeline(replacementSessions);
    const removedSeconds = Math.floor(removalBudget / 1000);
    this.timer.adjustTime(-removedSeconds);

    this.adjustmentMessage.textContent = `Removed ${Utils.formatTime(removedSeconds)} across intersecting work sessions.`;
    this.updateTimeline();
    if (intersectsRunningSession && wasRunning) this.timer.start();
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
    const timelineData = StorageManager.getTimelineData();
    const today = new Date();
    const days = [];
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const time = workTimes[key] || 0;
      const sessions = (timelineData[key] || []).filter(session => Number.isFinite(session.start) && Number.isFinite(session.end));
      const firstStart = sessions.length ? Math.min(...sessions.map(session => session.start)) : null;
      const lastEnd = sessions.length ? Math.max(...sessions.map(session => session.end)) : null;
      days.push({ date, time, firstStart, lastEnd });
    }

    const maxTime = Math.max(1, ...days.map(day => day.time));
    days.forEach(({ date, time, firstStart, lastEnd }) => {
      const start = firstStart === null ? 'Not recorded' : Utils.formatDisplayTime(firstStart);
      const end = lastEnd === null ? 'Not recorded' : Utils.formatDisplayTime(lastEnd);
      const barWidth = time > 0 ? Math.max(2, (time / maxTime) * 100) : 0;
      
      const li = document.createElement('li');
      li.className = 'history-row';
      li.innerHTML = `
        <div class="history-day">${this.formatDateDisplay(date)}</div>
        <div class="history-session-times">
          <span><small>START</small><strong>${start}</strong></span>
          <span><small>END</small><strong>${end}</strong></span>
        </div>
        <div class="history-total">
          <div class="history-bar"><span style="width: ${barWidth}%"></span></div>
          <span class="history-duration">${Utils.formatTime(time)}</span>
        </div>
      `;
      this.historyList.appendChild(li);
    });
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
    this.todayDateDisplay = document.getElementById('todayDate');
    this.todayStartDisplay = document.getElementById('todayStart');
    this.estimatedEndDisplay = document.getElementById('estimatedEnd');
    this.workdayTarget = document.getElementById('workdayTarget');
    this.workdayTarget.value = String(StorageManager.getWorkdayTarget());
    this.workdayTarget.addEventListener('change', () => {
      StorageManager.setWorkdayTarget(Number(this.workdayTarget.value));
      this.updateDaySummary();
    });
    this.updateDisplays();
    setInterval(() => this.updateDaySummary(), 60000);
  }

  updateDisplays() {
    this.updateNetAdjustmentsDisplay();
    this.updateDaySummary();
  }

  updateNetAdjustmentsDisplay() {
    const adjustmentsInfo = this.timer.getNetAdjustmentsInfo();
    this.netAdjustmentsDisplay.textContent = adjustmentsInfo.timeStr;
    this.netAdjustmentsDisplay.className = `net-time ${adjustmentsInfo.isPositive ? 'positive' : 'negative'}`;
  }

  updateDaySummary() {
    const today = new Date();
    const dateLabel = today.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    this.todayDateDisplay.textContent = `${dateLabel} · KW ${Utils.getISOWeekNumber(today)}`;
    this.todayDateDisplay.dateTime = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-');

    const sessions = StorageManager.getTodayTimeline();
    const starts = sessions.map(session => session.start);
    if (this.timer.isRunning()) starts.push(this.timer.startTime);
    const firstStart = starts.length ? Math.min(...starts) : null;
    this.todayStartDisplay.textContent = firstStart === null ? '—' : Utils.formatDisplayTime(firstStart);

    const elapsed = this.timer.getCurrentElapsed();
    if (elapsed <= 0) {
      this.estimatedEndDisplay.textContent = '—';
      return;
    }

    const targetSeconds = Number(this.workdayTarget.value) * 3600;
    if (elapsed >= targetSeconds) {
      this.estimatedEndDisplay.textContent = 'Target met';
      return;
    }

    const estimatedEnd = new Date(Date.now() + (targetSeconds - elapsed) * 1000);
    const endTime = Utils.formatDisplayTime(estimatedEnd.getTime());
    const isTomorrow = estimatedEnd.toDateString() !== new Date().toDateString();
    this.estimatedEndDisplay.textContent = isTomorrow
      ? `${estimatedEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${endTime}`
      : endTime;
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
      const adjustedSeconds = originalAdjustTime(seconds);
      this.history.refresh();
      this.uiManager.updateDisplays();
      return adjustedSeconds;
    };
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.workTimeTracker = new WorkTimeTracker();
});
