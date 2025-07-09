# Work Time Tracker - Refactored

A modern, maintainable work time tracking application with improved code structure.

## Features

- ⏱️ **Timer Management**: Start, pause, and reset work timers
- 📊 **Project Tracking**: Track time across multiple projects with color coding
- 📈 **Timeline Visualization**: Visual timeline of your daily work activities
- 🔄 **Auto-Synchronization**: Automatic synchronization between main timer and project timers
- 💾 **Local Storage**: All data is stored locally in your browser
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 📅 **History**: View work time history for the last 7 days

## Quick Start

1. Simply open `index.html` in your web browser
2. No server setup required - works directly with file:// protocol
3. Start tracking your time immediately!

## Project Structure

```
work-time-tracker/
├── index.html              # Main application HTML
├── time_tracker.html       # Original single-file version (legacy)
├── README.md               # This documentation
└── src/
    ├── styles.css          # Application styles
    └── app.js              # Complete application logic (modular classes)
```

## Architecture Improvements

The refactored version maintains all original functionality while providing:

### **Modular Class Structure**
- **Timer**: Handles time tracking logic and state management
- **ProjectManager**: Manages multiple projects and time allocation
- **Timeline**: Visual timeline representation of work sessions
- **History**: Historical work time display
- **UIManager**: Coordinates UI updates and synchronization status
- **StorageManager**: Centralized localStorage operations with error handling
- **WorkTimeTracker**: Main application coordinator

### **Key Improvements**
- **Better Code Organization**: Each class has a single responsibility
- **Improved Error Handling**: Robust error handling for localStorage operations
- **Event-driven Architecture**: Classes communicate through callbacks
- **Configurable**: Centralized configuration object for easy customization
- **Maintainable**: Clear separation of concerns and documented code
- **No Build Process**: Works directly in browser without compilation

## Usage

### Basic Operations
- **Start/Pause**: Click the main timer button
- **Reset**: Reset today's time (with confirmation)
- **Manual Adjustments**: Use +/- buttons to adjust time manually
- **Sync**: Force synchronization between main timer and projects
- **Debug**: View timeline data in browser console

### Project Management
- **Switch Projects**: Click on any project to make it active
- **Add Projects**: Type in the input field and press Enter
- **Delete Projects**: Click the 🗑️ button (time transfers to "General Work")
- **Color Coding**: Each project gets a unique color for visual distinction

### Timeline Features
- **Visual Sessions**: See when you worked on different projects
- **Hover Details**: Hover over timeline segments for session information
- **Auto-scaling**: Timeline adjusts to show your work pattern
- **Real-time Updates**: Current session updates every 20 seconds

### Data Persistence
All data is automatically saved to your browser's localStorage:
- Work times by date
- Project definitions and daily times
- Timeline session data
- Timer state for session recovery
- Manual time adjustments

## Browser Compatibility

Works in all modern browsers that support:
- ES6 Classes
- Arrow Functions
- LocalStorage
- No external dependencies except Bootstrap CSS/JS

## Migration from Original

The refactored version preserves all functionality from `time_tracker.html` with these benefits:

- **Maintainable Code**: Easier to modify and extend
- **Better Performance**: More efficient event handling and updates
- **Improved Reliability**: Better error handling and state management
- **Cleaner Structure**: Logical separation of functionality
- **Documentation**: Well-commented code for future development

## Configuration

Edit the `CONFIG` object in `src/app.js` to customize:

```javascript
const CONFIG = {
  PROJECT_COLORS: [...],        // Available project colors
  SYNC: {
    TOLERANCE_SECONDS: 3,       // Sync tolerance
    CHECK_INTERVAL_SECONDS: 10, // How often to check sync
  },
  TIMELINE: {
    UPDATE_INTERVAL_MS: 20000,  // Timeline update frequency
  }
};
```

## Development

To extend the application:

1. **Add New Features**: Create new methods in existing classes or new classes
2. **Modify UI**: Update HTML structure and CSS styles
3. **Change Behavior**: Modify class methods or configuration
4. **Debug**: Use browser developer tools and the debug button

The modular structure makes it easy to understand and modify specific functionality without affecting other parts of the application.

## License

This project is open source and available under the MIT License.
