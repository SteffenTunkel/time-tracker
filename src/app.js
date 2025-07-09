/**
 * Work Time Tracker - Refactored Version
 * A modular, maintainable time tracking application
 */

// Configuration Constants
const CONFIG = {
  PROJECT_COLORS: [
    '#28a745', '#007bff', '#dc3545', '#ffc107', '#17a2b8',
    '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
  ],
  DEFAULT_PROJECT: {
    ID: 'general-work',
    NAME: 'General Work',
    COLOR: '#28a745'
  },
  SYNC: {
    TOLERANCE_SECONDS: 3,
    CHECK_INTERVAL_SECONDS: 10,
    AUTO_CORRECT_INTERVAL_SECONDS: 30
  },
  TIMELINE: {
    UPDATE_INTERVAL_MS: 20000,
    MIN_SESSION_DURATION_MS: 1000
  },
  STORAGE_KEYS: {
    WORK_TIMES: 'worktimes',
    TIMER_STATE: 'timerState',
    TIMELINE_DATA: 'timelineData',
    NET_ADJUSTMENTS: 'netAdjustments',
    PROJECTS: 'projects',
    PROJECT_TIMES: 'projectTimes',
    PROJECT_STATES: 'projectStates',
    ACTIVE_PROJECT: 'activeProject'
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

  getProjects() {
    return this.getJSON(CONFIG.STORAGE_KEYS.PROJECTS, []);
  },

  setProjects(projects) {
    this.setJSON(CONFIG.STORAGE_KEYS.PROJECTS, projects);
  },

  getProjectTimes() {
    return this.getJSON(CONFIG.STORAGE_KEYS.PROJECT_TIMES, {});
  },

  setProjectTimes(projectTimes) {
    this.setJSON(CONFIG.STORAGE_KEYS.PROJECT_TIMES, projectTimes);
  },

  getProjectStates() {
    return this.getJSON(CONFIG.STORAGE_KEYS.PROJECT_STATES, {});
  },

  setProjectStates(states) {
    this.setJSON(CONFIG.STORAGE_KEYS.PROJECT_STATES, states);
  },

  getActiveProjectId() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_PROJECT) || null;
  },

  setActiveProjectId(projectId) {
    if (projectId) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_PROJECT, projectId);
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ACTIVE_PROJECT);
    }
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
    if (this.startTime) return;
    
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.updateDisplay();
      this.triggerUpdate();
      
      const now = new Date();
      if (now.getSeconds() % CONFIG.SYNC.CHECK_INTERVAL_SECONDS === 0) {
        this.triggerUpdate();
      }
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
    if (!confirm("Reset today's time?")) return;
    
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

// Project Manager Class
class ProjectManager {
  constructor(timer) {
    this.timer = timer;
    this.projects = [];
    this.activeProject = null;
    this.updateCallbacks = [];
    
    this.projectsList = document.getElementById('projectsList');
    this.newProjectInput = document.getElementById('newProjectInput');
    
    this.loadProjects();
    this.setupEventListeners();
  }

  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  triggerUpdate() {
    this.updateCallbacks.forEach(callback => callback());
  }

  getTotalProjectTime() {
    return this.projects.reduce((total, project) => {
      const currentTime = project.timeToday + (project.startTime ? Math.floor((Date.now() - project.startTime) / 1000) : 0);
      return total + currentTime;
    }, 0);
  }

  verifySynchronization() {
    const totalProjectTime = this.getTotalProjectTime();
    const mainTimerTime = this.timer.getCurrentElapsed();
    const difference = Math.abs(totalProjectTime - mainTimerTime);
    
    if (difference > CONFIG.SYNC.TOLERANCE_SECONDS) {
      console.warn(`Timer synchronization issue: Main ${Utils.formatTime(mainTimerTime)}, Projects ${Utils.formatTime(totalProjectTime)}, Diff: ${difference}s`);
      return false;
    }
    
    return true;
  }

  syncToMainTimer() {
    const mainTimerTime = this.timer.getCurrentElapsed();
    const totalProjectTime = this.getTotalProjectTime();
    const difference = mainTimerTime - totalProjectTime;
    
    if (Math.abs(difference) > CONFIG.SYNC.TOLERANCE_SECONDS && this.activeProject) {
      const wasRunning = this.activeProject.startTime !== null;
      if (wasRunning && this.activeProject.startTime) {
        this.activeProject.timeToday += Math.floor((Date.now() - this.activeProject.startTime) / 1000);
        this.activeProject.startTime = null;
      }
      
      this.activeProject.timeToday += difference;
      if (this.activeProject.timeToday < 0) this.activeProject.timeToday = 0;
      
      if (wasRunning && this.timer.isRunning()) {
        this.activeProject.startTime = Date.now();
      }
      
      console.log(`Synchronized timers: Applied ${difference}s correction to ${this.activeProject.name}`);
      this.renderProjects();
      this.saveProjects();
    }
  }

  createDefaultProject() {
    return {
      id: CONFIG.DEFAULT_PROJECT.ID,
      name: CONFIG.DEFAULT_PROJECT.NAME,
      color: CONFIG.DEFAULT_PROJECT.COLOR,
      timeToday: 0,
      startTime: null
    };
  }

  loadProjects() {
    const today = Utils.getTodayString();
    const savedProjects = StorageManager.getProjects();
    const savedProjectTimes = StorageManager.getProjectTimes();
    const projectStates = StorageManager.getProjectStates();
    const isToday = projectStates.date === today;
    
    if (savedProjects.length === 0 || !savedProjects.find(p => p.name === CONFIG.DEFAULT_PROJECT.NAME)) {
      const defaultProject = {
        id: CONFIG.DEFAULT_PROJECT.ID,
        name: CONFIG.DEFAULT_PROJECT.NAME,
        color: CONFIG.DEFAULT_PROJECT.COLOR
      };
      savedProjects.unshift(defaultProject);
      StorageManager.setProjects(savedProjects);
    }
    
    this.projects = savedProjects.map(project => ({
      ...project,
      timeToday: savedProjectTimes[today]?.[project.id] || 0,
      startTime: null
    }));
    
    if (isToday && projectStates.projectTimerStates) {
      projectStates.projectTimerStates.forEach(state => {
        const project = this.projects.find(p => p.id === state.id);
        if (project) {
          project.timeToday = state.timeToday || 0;
          project.startTime = state.startTime;
        }
      });
    }
    
    this.loadActiveProject();
    this.renderProjects();
    console.log('Projects loaded from storage');
  }

  loadActiveProject() {
    const projectStates = StorageManager.getProjectStates();
    const today = Utils.getTodayString();
    const isToday = projectStates.date === today;
    
    let savedActiveProjectId = null;
    if (isToday && projectStates.activeProjectId) {
      savedActiveProjectId = projectStates.activeProjectId;
    } else {
      savedActiveProjectId = StorageManager.getActiveProjectId();
    }
    
    if (savedActiveProjectId) {
      const project = this.projects.find(p => p.id === savedActiveProjectId);
      if (project) {
        this.activeProject = project;
        if (this.timer.isRunning() && !project.startTime) {
          project.startTime = this.timer.startTime;
        }
      }
    }
    
    if (!this.activeProject && this.projects.length > 0) {
      const generalWork = this.projects.find(p => p.name === CONFIG.DEFAULT_PROJECT.NAME);
      if (generalWork) {
        this.activeProject = generalWork;
        if (this.timer.isRunning() && !generalWork.startTime) {
          generalWork.startTime = this.timer.startTime;
        }
      }
    }
  }

  saveProjects() {
    const today = Utils.getTodayString();
    
    const projectsToSave = this.projects.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color
    }));
    StorageManager.setProjects(projectsToSave);
    
    let projectTimes = StorageManager.getProjectTimes();
    if (!projectTimes[today]) projectTimes[today] = {};
    
    this.projects.forEach(project => {
      const currentTime = project.timeToday + (project.startTime ? Math.floor((Date.now() - project.startTime) / 1000) : 0);
      projectTimes[today][project.id] = currentTime;
    });
    
    StorageManager.setProjectTimes(projectTimes);
    
    const projectStates = {
      activeProjectId: this.activeProject ? this.activeProject.id : null,
      projectTimerStates: this.projects.map(p => ({
        id: p.id,
        timeToday: p.timeToday,
        startTime: p.startTime
      })),
      date: today
    };
    StorageManager.setProjectStates(projectStates);
    StorageManager.setActiveProjectId(this.activeProject ? this.activeProject.id : null);
  }

  renderProjects() {
    this.projectsList.innerHTML = '';
    
    this.projects.forEach(project => {
      const projectDiv = document.createElement('div');
      projectDiv.className = `project-item ${this.activeProject?.id === project.id ? 'active' : ''}`;
      projectDiv.style.backgroundColor = project.color + '20';
      projectDiv.style.borderColor = project.color;
      
      const currentTime = project.timeToday + (project.startTime ? Math.floor((Date.now() - project.startTime) / 1000) : 0);
      
      const projectContent = document.createElement('div');
      projectContent.style.display = 'flex';
      projectContent.style.alignItems = 'center';
      projectContent.style.justifyContent = 'space-between';
      projectContent.style.width = '100%';
      projectContent.onclick = () => this.selectProject(project.id);
      
      const projectName = document.createElement('span');
      projectName.className = 'project-name';
      projectName.style.color = project.color;
      projectName.textContent = project.name;
      
      const projectControls = document.createElement('div');
      projectControls.className = 'project-controls';
      
      if (project.name !== CONFIG.DEFAULT_PROJECT.NAME) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'project-delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete project';
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          this.deleteProject(project.id);
        };
        projectControls.appendChild(deleteBtn);
      }
      
      const projectTimer = document.createElement('span');
      projectTimer.className = 'project-timer';
      projectTimer.id = `project-timer-${project.id}`;
      projectTimer.textContent = Utils.formatTime(currentTime);
      projectControls.appendChild(projectTimer);
      
      projectContent.appendChild(projectName);
      projectContent.appendChild(projectControls);
      projectDiv.appendChild(projectContent);
      
      this.projectsList.appendChild(projectDiv);
    });
  }

  updateProjectTimers() {
    this.projects.forEach(project => {
      const timerElement = document.getElementById(`project-timer-${project.id}`);
      if (timerElement) {
        const currentTime = project.timeToday + (project.startTime ? Math.floor((Date.now() - project.startTime) / 1000) : 0);
        timerElement.textContent = Utils.formatTime(currentTime);
      }
    });
  }

  selectProject(projectId) {
    console.log(`Switching to project: ${projectId}`);
    
    if (!this.verifySynchronization()) {
      console.log('Correcting timer sync before project switch');
      this.syncToMainTimer();
    }
    
    if (this.activeProject && this.activeProject.startTime) {
      console.log(`Stopping current project: ${this.activeProject.name}`);
      this.activeProject.timeToday += Math.floor((Date.now() - this.activeProject.startTime) / 1000);
      this.activeProject.startTime = null;
    }
    
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      console.log(`Starting new project: ${project.name}`);
      this.activeProject = project;
      if (this.timer.isRunning()) {
        project.startTime = Date.now();
      }
      this.renderProjects();
      this.saveProjects();
      this.triggerUpdate();
      
      setTimeout(() => this.verifySynchronization(), 100);
    }
  }

  addProject(projectName) {
    if (!projectName.trim()) return;
    
    const newProject = {
      id: Date.now().toString(),
      name: projectName.trim(),
      color: CONFIG.PROJECT_COLORS[this.projects.length % CONFIG.PROJECT_COLORS.length],
      timeToday: 0,
      startTime: null
    };
    
    this.projects.push(newProject);
    this.renderProjects();
    this.saveProjects();
    console.log(`Added new project: ${projectName}`);
  }

  deleteProject(projectId) {
    const projectToDelete = this.projects.find(p => p.id === projectId);
    if (!projectToDelete || projectToDelete.name === CONFIG.DEFAULT_PROJECT.NAME) {
      return;
    }
    
    const projectName = projectToDelete.name;
    if (!confirm(`Delete project "${projectName}"? Its time will be transferred to "${CONFIG.DEFAULT_PROJECT.NAME}".`)) {
      return;
    }
    
    const defaultProject = this.projects.find(p => p.name === CONFIG.DEFAULT_PROJECT.NAME);
    if (defaultProject) {
      const timeToTransfer = projectToDelete.timeToday + 
        (projectToDelete.startTime ? Math.floor((Date.now() - projectToDelete.startTime) / 1000) : 0);
      defaultProject.timeToday += timeToTransfer;
    }
    
    if (this.activeProject && this.activeProject.id === projectId) {
      this.activeProject = defaultProject;
      if (this.timer.isRunning() && defaultProject) {
        defaultProject.startTime = projectToDelete.startTime || Date.now();
      }
    }
    
    const projectIndex = this.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      this.projects.splice(projectIndex, 1);
    }
    
    this.renderProjects();
    this.saveProjects();
    this.triggerUpdate();
    console.log(`Deleted project: ${projectName}`);
  }

  onTimerStart() {
    if (this.activeProject) {
      this.activeProject.startTime = this.timer.startTime;
    }
  }

  onTimerPause() {
    if (this.activeProject && this.activeProject.startTime) {
      this.activeProject.timeToday += Math.floor((Date.now() - this.activeProject.startTime) / 1000);
      this.activeProject.startTime = null;
    }
    this.saveProjects();
    this.renderProjects();
  }

  onTimerReset() {
    this.projects.forEach(project => {
      project.timeToday = 0;
      project.startTime = null;
    });
    
    const defaultProject = this.projects.find(p => p.name === CONFIG.DEFAULT_PROJECT.NAME);
    this.activeProject = defaultProject || null;
    
    this.saveProjects();
    this.renderProjects();
  }

  onTimeAdjustment(seconds) {
    if (this.activeProject) {
      this.activeProject.timeToday += seconds;
      if (this.activeProject.timeToday < 0) this.activeProject.timeToday = 0;
    }
    this.renderProjects();
    this.verifySynchronization();
  }

  setupEventListeners() {
    this.newProjectInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.addProject(event.target.value);
        event.target.value = '';
      }
    });
  }
}

// Timeline Class
class Timeline {
  constructor(timer, projectManager) {
    this.timer = timer;
    this.projectManager = projectManager;
    
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
    const activeProject = this.projectManager.activeProject;
    if (!this.timer.startTime || !activeProject || !activeProject.startTime) return;
    
    const sessionStart = activeProject.startTime;
    const sessionEnd = Date.now();
    
    if (sessionEnd - sessionStart > CONFIG.TIMELINE.MIN_SESSION_DURATION_MS) {
      const session = {
        start: sessionStart,
        end: sessionEnd,
        projectId: activeProject.id,
        projectName: activeProject.name,
        projectColor: activeProject.color
      };
      
      StorageManager.addTimelineSession(session);
      console.log(`Saved timeline session: ${activeProject.name} from ${Utils.formatDisplayTime(sessionStart)} to ${Utils.formatDisplayTime(sessionEnd)}`);
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
          color: session.projectColor || '#28a745',
          tooltip: this.createSessionTooltip(session),
          isCurrent: false
        });
      }
    });
  }

  renderCurrentSession(timeRange) {
    if (!this.timer.isRunning() || !this.projectManager.activeProject || !this.projectManager.activeProject.startTime) {
      return;
    }
    
    const { timelineStart, timelineEnd, timelineDuration } = timeRange;
    const currentProjectStart = this.projectManager.activeProject.startTime;
    const currentStart = Math.max(currentProjectStart, timelineStart);
    const currentEnd = Math.min(Date.now(), timelineEnd);
    
    if (currentStart < timelineEnd && currentEnd > timelineStart && currentStart < currentEnd) {
      const leftPercent = ((currentStart - timelineStart) / timelineDuration) * 100;
      const widthPercent = ((currentEnd - currentStart) / timelineDuration) * 100;
      
      this.createTimelineSegment({
        leftPercent,
        widthPercent,
        color: this.projectManager.activeProject.color,
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
    const projectName = session.projectName || 'Unknown project';
    
    return `${startTimeStr} - ${endTimeStr} (${duration} Min.) - ${projectName}`;
  }

  createCurrentSessionTooltip(start, end) {
    const startTimeStr = Utils.formatDisplayTime(start);
    const currentTimeStr = Utils.formatDisplayTime(end);
    const duration = Utils.getDurationInMinutes(start, end);
    const projectName = this.projectManager.activeProject.name;
    
    return `${startTimeStr} - ${currentTimeStr} (${duration} Min.) - ${projectName} - Läuft gerade`;
  }

  onTimerPause() {
    this.saveCurrentSession();
    this.updateTimeline();
  }

  onTimerReset() {
    StorageManager.clearTodayTimeline();
    this.updateTimeline();
  }

  onProjectSwitch() {
    this.saveCurrentSession();
    setTimeout(() => this.updateTimeline(), 50);
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
  constructor(timer, projectManager) {
    this.timer = timer;
    this.projectManager = projectManager;
    
    this.netAdjustmentsDisplay = document.getElementById('netAdjustments');
    this.projectSumDisplay = document.getElementById('projectSum');
    this.syncStatusDisplay = document.getElementById('syncStatus');
    
    this.setupEventListeners();
    this.updateDisplays();
  }

  updateDisplays() {
    this.updateNetAdjustmentsDisplay();
    this.updateProjectSumDisplay();
    this.updateSyncStatusDisplay();
    this.projectManager.updateProjectTimers();
  }

  updateNetAdjustmentsDisplay() {
    const adjustmentsInfo = this.timer.getNetAdjustmentsInfo();
    this.netAdjustmentsDisplay.textContent = adjustmentsInfo.timeStr;
    this.netAdjustmentsDisplay.className = `net-time ${adjustmentsInfo.isPositive ? 'positive' : 'negative'}`;
  }

  updateProjectSumDisplay() {
    const totalProjectTime = this.projectManager.getTotalProjectTime();
    this.projectSumDisplay.textContent = Utils.formatTime(totalProjectTime);
  }

  updateSyncStatusDisplay() {
    const currentElapsed = this.timer.getCurrentElapsed();
    const totalProjectTime = this.projectManager.getTotalProjectTime();
    const difference = Math.abs(currentElapsed - totalProjectTime);
    
    if (difference <= 3) {
      this.syncStatusDisplay.textContent = '✓ In Sync';
      this.syncStatusDisplay.className = 'text-success';
    } else {
      this.syncStatusDisplay.textContent = `⚠ Off by ${difference}s`;
      this.syncStatusDisplay.className = 'text-warning';
    }
  }

  forceSynchronization() {
    console.log('Manual synchronization requested');
    
    const mainTimerTime = this.timer.getCurrentElapsed();
    const totalProjectTime = this.projectManager.getTotalProjectTime();
    
    console.log(`Before sync - Main: ${Utils.formatTime(mainTimerTime)}, Projects: ${Utils.formatTime(totalProjectTime)}, Diff: ${Math.abs(mainTimerTime - totalProjectTime)}s`);
    
    this.projectManager.syncToMainTimer();
    this.updateDisplays();
    
    const newMainTimerTime = this.timer.getCurrentElapsed();
    const newTotalProjectTime = this.projectManager.getTotalProjectTime();
    
    console.log(`After sync - Main: ${Utils.formatTime(newMainTimerTime)}, Projects: ${Utils.formatTime(newTotalProjectTime)}, Diff: ${Math.abs(newMainTimerTime - newTotalProjectTime)}s`);
    
    this.timer.saveToStorage();
    this.projectManager.saveProjects();
  }

  debugTimelineData() {
    const today = Utils.getTodayString();
    const todayData = StorageManager.getTodayTimeline();
    
    console.log('=== Timeline Debug ===');
    console.log(`Date: ${today}`);
    console.log(`Saved sessions: ${todayData.length}`);
    todayData.forEach((session, index) => {
      const start = new Date(session.start).toLocaleTimeString();
      const end = new Date(session.end).toLocaleTimeString();
      const duration = Math.round((session.end - session.start) / 60000);
      console.log(`  ${index + 1}: ${session.projectName} - ${start} to ${end} (${duration} min)`);
    });
    
    const activeProject = this.projectManager.activeProject;
    if (this.timer.isRunning() && activeProject && activeProject.startTime) {
      const currentStart = new Date(activeProject.startTime).toLocaleTimeString();
      const currentNow = new Date().toLocaleTimeString();
      const currentDuration = Math.round((Date.now() - activeProject.startTime) / 60000);
      console.log(`Current: ${activeProject.name} - ${currentStart} to ${currentNow} (${currentDuration} min) - RUNNING`);
    }
    console.log('=====================');
  }

  setupEventListeners() {
    document.getElementById('syncBtn').addEventListener('click', () => {
      this.forceSynchronization();
    });

    document.getElementById('debugBtn').addEventListener('click', () => {
      this.debugTimelineData();
    });

    const projectsCollapse = document.getElementById('projectsCollapse');
    const projectsToggleText = document.getElementById('projectsToggleText');
    const projectsToggleIcon = document.getElementById('projectsToggleIcon');

    projectsCollapse.addEventListener('show.bs.collapse', () => {
      projectsToggleText.textContent = 'Hide Projects';
      projectsToggleIcon.textContent = '▲';
    });

    projectsCollapse.addEventListener('hide.bs.collapse', () => {
      projectsToggleText.textContent = 'Show Projects';
      projectsToggleIcon.textContent = '▼';
    });
  }
}

// Main Application Class
class WorkTimeTracker {
  constructor() {
    this.initializeModules();
    this.setupInterModuleCommunication();
    this.performInitialSync();
    
    console.log('Work Time Tracker initialized successfully');
  }

  initializeModules() {
    this.timer = new Timer();
    this.projectManager = new ProjectManager(this.timer);
    this.timeline = new Timeline(this.timer, this.projectManager);
    this.history = new History();
    this.uiManager = new UIManager(this.timer, this.projectManager);
  }

  setupInterModuleCommunication() {
    this.timer.onUpdate(() => {
      this.projectManager.updateProjectTimers();
      this.uiManager.updateDisplays();
      
      const now = new Date();
      if (now.getSeconds() % CONFIG.SYNC.AUTO_CORRECT_INTERVAL_SECONDS === 0) {
        if (!this.projectManager.verifySynchronization()) {
          console.log('Auto-correcting timer drift');
          this.projectManager.syncToMainTimer();
        }
      }
    });

    this.projectManager.onUpdate(() => {
      this.timeline.onProjectSwitch();
      this.uiManager.updateDisplays();
    });

    this.setupTimerEventHandlers();
  }

  setupTimerEventHandlers() {
    const originalStart = this.timer.start.bind(this.timer);
    this.timer.start = () => {
      originalStart();
      this.projectManager.onTimerStart();
      this.uiManager.updateDisplays();
    };

    const originalPause = this.timer.pause.bind(this.timer);
    this.timer.pause = () => {
      if (!this.projectManager.verifySynchronization()) {
        console.log('Correcting timer sync before pause');
        this.projectManager.syncToMainTimer();
      }
      
      this.timeline.onTimerPause();
      originalPause();
      this.projectManager.onTimerPause();
      this.uiManager.updateDisplays();
      
      this.projectManager.verifySynchronization();
    };

    const originalReset = this.timer.reset.bind(this.timer);
    this.timer.reset = () => {
      if (!confirm("Reset today's time?")) return;
      
      this.timeline.onTimerReset();
      originalReset();
      this.projectManager.onTimerReset();
      this.history.refresh();
      this.timeline.updateTimeline();
      this.uiManager.updateDisplays();
    };

    const originalAdjustTime = this.timer.adjustTime.bind(this.timer);
    this.timer.adjustTime = (seconds) => {
      originalAdjustTime(seconds);
      this.projectManager.onTimeAdjustment(seconds);
      this.history.refresh();
      this.uiManager.updateDisplays();
      
      this.projectManager.verifySynchronization();
    };
  }

  performInitialSync() {
    setTimeout(() => {
      if (!this.projectManager.verifySynchronization()) {
        console.log('Initial synchronization correction needed');
        this.projectManager.syncToMainTimer();
        this.projectManager.renderProjects();
      }
    }, 500);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.workTimeTracker = new WorkTimeTracker();
});
