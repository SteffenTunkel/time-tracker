# Work Time Tracker

A simple work time tracker for recording daily hours.

## Features

- ⏱️ **Timer Management**: Start, pause, and reset work timers
- 📈 **Timeline Visualization**: See today's work sessions at a glance
- 🕒 **Day Estimate**: View the first start time and estimated finish against an adjustable daily target
- ✚ **Timeline Adjustments**: Add or remove time at a selected point in the day
- 💾 **Local Storage**: All data is stored locally in your browser
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 📅 **History**: View work time history for the last 7 days

## Quick Start

1. Open `index.html` in a browser, or serve this folder locally for an integrated browser preview.
2. Start tracking work time.

## Files

```
work-time-tracker/
├── index.html              # Main application HTML
├── README.md               # This documentation
└── src/
    ├── styles.css          # Application styles
  └── app.js              # Application logic
```

## Usage

### Basic Operations
- **Start/Pause**: Click the main timer button
- **Reset**: Reset today's time (with confirmation)
- **Day Target**: Choose a target duration; the estimated finish updates with today's total

### Timeline Features
- **Session Times**: Current-day start and estimated finish appear above the timeline
- **Point Adjustments**: Click the timeline or enter a time, then add time in an open interval or remove time from a session
- **Past Days**: History shows each recorded day's first start, last finish, and total; days without interval data show "Not recorded"
- **History Editing**: Click a past day to edit its timeline and total; Save commits the draft, while Discard or clicking outside closes it without saving
- **Auto-scaling**: Timeline adjusts to show your work pattern
- **Real-time Updates**: Current session updates every 20 seconds

### Data Persistence
All data is automatically saved to your browser's localStorage:
- Work times by date
- Timeline session data
- Timer state for session recovery
- Manual time adjustments

## Browser Compatibility

Works in all modern browsers that support:
- ES6 Classes
- Arrow Functions
- LocalStorage
- No external dependencies except Bootstrap CSS/JS

## License

This project is open source and available under the MIT License.
