# Work Time Tracker

A simple work time tracker for recording daily hours.

## Features

- ⏱️ **Timer Management**: Start, pause, and reset work timers
- 📈 **Timeline Visualization**: See today's work sessions at a glance
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
- **Manual Adjustments**: Use +/- buttons to adjust time manually

### Timeline Features
- **Visual Sessions**: See when you worked
- **Hover Details**: Hover over timeline segments for session information
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
