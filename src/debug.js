// Get DOM references
const refreshButton = document.getElementById('refreshButton');
const clearButton = document.getElementById('clearButton');
const exportButton = document.getElementById('exportButton');
const statusElement = document.getElementById('status');
const logTableBody = document.getElementById('logTableBody');

// Refresh logs from storage
async function refreshLogs() {
  setStatus('Loading logs...');
  
  try {
    // Get logs from storage
    const result = await chrome.storage.local.get('debugLogs');
    const logs = result.debugLogs || [];
    
    // Clear table
    logTableBody.innerHTML = '';
    
    if (logs.length === 0) {
      showEmptyMessage();
    } else {
      // Add log entries to table
      logs.forEach(entry => {
        addLogRow(entry);
      });
    }
    
    setStatus(`Loaded ${logs.length} log entries`);
  } catch (error) {
    setStatus(`Error: ${error.message}`);
    console.error('Failed to load logs:', error);
  }
}

// Show message when no logs are available
function showEmptyMessage() {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 4;
  cell.textContent = 'No logs found';
  cell.style.textAlign = 'center';
  cell.style.padding = '20px';
  cell.style.fontStyle = 'italic';
  cell.style.color = '#999';
  
  row.appendChild(cell);
  logTableBody.appendChild(row);
}

// Add a log entry row to the table
function addLogRow(logEntry) {
  const row = document.createElement('tr');
  row.className = logEntry.type; // 'info', 'warn', 'error'
  
  // Timestamp cell
  const timestampCell = document.createElement('td');
  timestampCell.className = 'timestamp';
  const date = new Date(logEntry.timestamp);
  timestampCell.textContent = date.toLocaleTimeString() + '.' + 
    date.getMilliseconds().toString().padStart(3, '0');
  timestampCell.title = logEntry.timestamp;
  
  // Component cell
  const componentCell = document.createElement('td');
  componentCell.className = 'component';
  componentCell.textContent = logEntry.component;
  
  // Message cell
  const messageCell = document.createElement('td');
  messageCell.textContent = logEntry.message;
  
  // Data cell
  const dataCell = document.createElement('td');
  dataCell.className = 'data-cell';
  
  if (logEntry.data !== undefined) {
    const dataContent = document.createElement('div');
    dataContent.className = 'data-content';
    
    try {
      // Format the data nicely with 2-space indentation
      const formattedData = JSON.stringify(logEntry.data, null, 2);
      dataContent.textContent = formattedData;
    } catch (e) {
      dataContent.textContent = '[Error displaying data]';
    }
    
    dataCell.appendChild(dataContent);
  }
  
  // Add cells to row
  row.appendChild(timestampCell);
  row.appendChild(componentCell);
  row.appendChild(messageCell);
  row.appendChild(dataCell);
  
  // Add row to table
  logTableBody.appendChild(row);
}

// Clear all logs
async function clearLogs() {
  if (!confirm('Are you sure you want to clear all logs?')) {
    return;
  }
  
  setStatus('Clearing logs...');
  
  try {
    await chrome.storage.local.set({ debugLogs: [] });
    logTableBody.innerHTML = '';
    showEmptyMessage();
    setStatus('Logs cleared');
  } catch (error) {
    setStatus(`Error: ${error.message}`);
    console.error('Failed to clear logs:', error);
  }
}

// Export logs as JSON file
function exportLogs() {
  setStatus('Exporting logs...');
  
  chrome.storage.local.get('debugLogs', result => {
    const logs = result.debugLogs || [];
    
    if (logs.length === 0) {
      setStatus('No logs to export');
      return;
    }
    
    // Create blob with log data
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json'
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webcore-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    setStatus(`Exported ${logs.length} log entries`);
  });
}

// Set status message
function setStatus(message) {
  statusElement.textContent = message;
  
  // Clear status after 3 seconds
  setTimeout(() => {
    if (statusElement.textContent === message) {
      statusElement.textContent = '';
    }
  }, 3000);
}

// Add event listeners
refreshButton.addEventListener('click', refreshLogs);
clearButton.addEventListener('click', clearLogs);
exportButton.addEventListener('click', exportLogs);

// Load logs when page opens
document.addEventListener('DOMContentLoaded', refreshLogs); 