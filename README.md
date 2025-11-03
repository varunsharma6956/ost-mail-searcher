# OST Email Explorer

# A powerful desktop application for searching and analyzing emails from Outlook OST files with advanced date filtering capabilities.


Overview------
-------------------------------

OST Email Explorer is a full-stack application designed to help users search, filter, and analyze emails stored in Outlook Offline Storage Table (.ost) file. The application provides an intuitive interface for browsing email archives with powerful date-based filtering capabilities.

### Key Features

✅ **Dual File Loading Options**
- Upload OST file directly through the web interface
- Browse and load files from local filesystem (Windows compatible)

✅ **Advanced Email Search**
- Filter emails by date range (start date and end date)
- Predefined quick filters (Last 7 days, 30 days, 90 days, This year)
- Custom date range selection with calendar picker

✅ **Rich Email Display**
- View complete email metadata (Subject, From, To, Date)
- Read full email body content
- Expandable email viewer with detailed information

✅ **Beautiful Modern UI**
- Dark theme with gradient backgrounds
- Responsive design for all screen sizes
- Smooth animations and transitions
- Intuitive navigation and user experience

---

## 🏗️ Architecture

### Backend Architecture

```
/backend/
├── server.py           # FastAPI application with email parsing logic
├── requirements.txt    # Python dependencies
```

**Key Components:**

1. **Email Parser**: Uses `libpff-python` library to parse OST files
2. **RESTful API**: FastAPI endpoints for file operations and search
3. **Date Filtering**: Server-side date range filtering logic
4. **Sample Data**: Fallback sample emails for testing without real OST files

**API Endpoints:**

- `GET /api/` - Health check endpoint
- `POST /api/upload-ost` - Upload and parse OST file
- `POST /api/browse-file` - Load file from local path
- `POST /api/search-emails` - Search with date filters
- `GET /api/load-sample-data` - Load demo email data

### Frontend Architecture

```
/frontend/
├── .env                        # Environment variables
├── src/
│   ├── App.js                  # Main application component
│   ├── App.css                 # Global styles and animations
│   └── components/
│       ├── OSTExplorer.jsx    # Main email explorer interface
│       ├── DateRangePicker.jsx # Date range selection component
│       └── EmailViewer.jsx    # Full email display component
└── components/ui/              # Shadcn UI components
```

**Technology Stack:**

- **React 19**: Modern UI library with hooks
- **Axios**: HTTP client for API communication
- **Shadcn UI**: Beautiful, accessible component library
- **Lucide React**: Modern icon library
- **date-fns**: Date manipulation and formatting
- **Sonner**: Toast notifications

---

## 🚀 Getting Started

### ⚡ Quick Start (Easiest Way)

**Windows users:** Simply double-click `START_APP.bat` to launch the application!

This automated script will:
- ✅ Check and install Python dependencies
- ✅ Check and install Node.js dependencies  
- ✅ Start both backend and frontend servers
- ✅ Open the app in your browser

**Alternative:** Run from command line: `.\START_APP.bat`

---

##### Installation (Manual Setup)
-----------------------------

#### 1. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Note: libpff-python installation may require additional steps (see below)
```

**Important Note on libpff-python:**

The `libpff-python` library is used for parsing OST files but can be challenging to install on Windows. If installation fails:

1. The application will automatically fall back to sample data mode
2. You can still test all features with the "Load Sample Data" button
3. For production use, consider:
   - Using pre-built Windows wheels (if available)
   - Running on Linux where pypff is easier to install
   - Using WSL (Windows Subsystem for Linux)

----------------------------------------------------------------------
#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install --legacy-peer-deps
```
-------------------------------------------------------------------

#### 4. Environment Configuration

The application comes pre-configured with environment files:

**Frontend** (`/frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

------------------------------------------------------------------------------
## Running the Application

### Start Backend
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Start Frontend
```bash
cd frontend
npm start
```
------------------------------------------------------------------------
Access the application at: `http://localhost:3000`

------------------------------------------------------------------------------

## How to Get OST Files

### Finding OST Files on Windows

**Method 1: Default Location**
1. Press `Win + R`
2. Type: `%LOCALAPPDATA%\Microsoft\Outlook`
3. Look for files ending in `.ost`

**Method 2: Through Outlook**
1. Open Outlook → `File` → `Account Settings`
2. Select your account → `Change` → `More Settings` → `Advanced`
3. Check "Outlook Data File Settings" for the path

### Converting OST to PST (if needed)

If OST files are locked, convert them to PST:
1. Open Outlook → `File` → `Open & Export` → `Import/Export`
2. Select "Export to a file" → "Outlook Data File (.pst)"
3. Choose folders to export and save location

---

## Usage

### Load Email Data
- **Upload**: Drag and drop OST files
- **Browse**: Enter local file path
- **Sample Data**: Use built-in sample emails for testing

### Filter and Search
- Use preset filters (Last 7/30/90 days, This Year)
- Set custom date ranges
- Click "Search" to apply filters

### View Emails
- Click any email to view full details
- See subject, sender, recipients, date, body, and attachments
- Use "Back to List" to return to results

---

## Troubleshooting

### Common Issues

**libpff-python Installation Fails**: Use sample data mode or try WSL/Linux
**File Not Found**: Use forward slashes in paths: `C:/Users/Name/file.ost`
**OST Won't Parse**: Convert to PST using Outlook export
**CORS Errors**: Check backend is running on port 8000
**Frontend Won't Start**: Clear node_modules and reinstall

---
