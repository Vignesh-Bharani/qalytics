# QAlytics - Quality Analytics Platform

A comprehensive quality analytics platform for tracking testing metrics across hierarchical PnL (Profit and Loss) structures.

## 🚀 How to Run This App Locally

### Prerequisites
- **Docker & Docker Compose** (Recommended) OR
- **Python 3.11+** and **Node.js 18+** for manual setup

### Option 1: Docker Compose (Recommended - One Command Setup)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qalytics
   ```

2. **Start all services**
   ```bash
   docker-compose up --build -d
   ```
   
   This will start:
   - PostgreSQL database on port 5432
   - FastAPI backend on port 8000
   - React frontend on port 3000

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Option 2: Manual Setup (Development Mode)

#### First Time Setup (Complete Process)

**Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
python create_sample_data.py
python app.py
```

**Frontend Setup (In a new terminal)**
```bash
cd frontend
npm install
npm run dev
```

#### Quick Run (If Already Set Up)

If you've already done the initial setup above, you can start with just these two commands:

**Terminal 1 - Backend:**
```bash
cd backend && source venv/bin/activate && python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

> **Note**: The "Quick Run" commands only work if you've already:
> - Created the virtual environment and installed Python dependencies
> - Initialized the database and created sample data
> - Installed Node.js dependencies

### 🔑 Login Credentials
- **Email**: `test@qalytics.com`
- **Password**: `password123`
- **Role**: `admin`

### 🛑 Stopping the Application
```bash
# For Docker Compose
docker-compose down

# For manual setup
# Press Ctrl+C in both terminal windows
```

## 🏗️ Architecture

### Hierarchical Structure
```
Dashboard → Main PnL List
     ↓
Main PnL → Sub-PnL List  
     ↓
Sub-PnL → Detailed Metrics Page
```

### Database Schema
- **Main PnLs**: Top-level business units (e.g., ePharmacy, eDiagnostics)
- **Sub PnLs**: Sub-systems under Main PnLs (e.g., Logistics, Warehouse, Audit App)
- **Metrics**: Different KPIs at each level with editing capabilities

## 🎯 Features

### Dashboard Level (Main PnL Overview)
- ✅ Total Test Cases
- ✅ Test Coverage %
- ✅ Automation %
- ✅ Lower Env Bugs
- ✅ Prod Bugs

### Sub-PnL Level
- ✅ Features Shipped
- ✅ Total Testcases Executed
- ✅ Total Bugs Logged
- ✅ Regression Bugs Found
- ✅ Sanity Time Avg (hrs)
- ✅ Automation Coverage %
- ✅ Escaped Bugs (in Prod)

### Sub-PnL Detail Level
- ✅ Features Shipped
- ✅ Total Testcases Executed
- ✅ Total Bugs Logged
- ✅ Testcase Peer Review (count)
- ✅ Regression Bugs Found
- ✅ Sanity Time Avg (hrs)
- ✅ API Test Time Avg (hrs)
- ✅ Automation Coverage %
- ✅ Escaped Bugs (in Prod)

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize database**
   ```bash
   python init_db.py
   ```

5. **Create sample data**
   ```bash
   python create_sample_data.py
   ```

6. **Start the backend server**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

### Test the API (Optional)

```bash
cd backend
python test_api.py
```

## 🔑 Test Credentials

After running the sample data script, use these credentials to login:

- **Email**: `test@qalytics.com`
- **Password**: `password123`
- **Role**: `admin`

## 📊 Sample Data

The application includes sample data with:

- **3 Main PnLs**: ePharmacy, eDiagnostics, Telemedicine
- **Multiple Sub-PnLs** under each Main PnL
- **Complete metrics** at all levels
- **Realistic values** for testing and demonstration

### Main PnLs:
1. **ePharmacy**: Online pharmacy platform
   - Logistics, Warehouse, Audit App, Finance
2. **eDiagnostics**: Digital diagnostics platform  
   - Lab Management, Report Generation, Patient Portal
3. **Telemedicine**: Video consultation platform
   - Video Platform, Appointment System, Prescription Module

## 🛣️ Navigation Flow

1. **Dashboard**: Shows all Main PnLs with their KPIs
2. **Click Main PnL**: Navigate to Sub-PnL list page
3. **Click Sub-PnL**: Navigate to detailed metrics page
4. **Edit Metrics**: Click "Edit Metrics" button to modify values
5. **Save Changes**: Save updated metrics to database

## 🎨 Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **SQLite**: Database (easily replaceable with PostgreSQL)
- **Pydantic**: Data validation
- **JWT**: Authentication

### Frontend  
- **React**: UI framework
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Axios**: HTTP client

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration

### Main PnLs
- `GET /dashboard` - Dashboard with Main PnL list and metrics
- `GET /main-pnls` - List all Main PnLs
- `POST /main-pnls` - Create new Main PnL
- `GET /main-pnls/{id}` - Get Main PnL details
- `PUT /main-pnls/{id}/metrics` - Update Main PnL metrics

### Sub PnLs
- `GET /main-pnls/{main_pnl_id}/sub-pnls` - List Sub-PnLs under Main PnL
- `POST /main-pnls/{main_pnl_id}/sub-pnls` - Create new Sub-PnL
- `GET /sub-pnls/{id}` - Get Sub-PnL with detailed metrics
- `PUT /sub-pnls/{id}/metrics` - Update Sub-PnL metrics
- `PUT /sub-pnls/{id}/detail-metrics` - Update Sub-PnL detailed metrics

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=sqlite:///./qalytics.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Frontend environment (`.env.local`):

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🎭 Development

### Adding New Metrics

1. **Update Models**: Add new fields to the appropriate model in `backend/models.py`
2. **Update Schemas**: Add fields to Pydantic schemas in `backend/schemas.py`
3. **Update API**: Modify endpoints in `backend/app.py` if needed
4. **Update Frontend**: Add new metric cards in the appropriate page components
5. **Migrate Database**: Recreate database or use migrations

### Database Migration

For schema changes:

```bash
cd backend
rm qalytics.db  # Remove existing database
python init_db.py  # Recreate tables
python create_sample_data.py  # Add sample data
```

## 🎯 Future Enhancements

- **Data Export**: Export metrics to Excel/PDF
- **Integrations**: Jira, TestRail, CI/CD integration
- **Role-based Access**: Different permissions for different roles
- **Historical Tracking**: Track metrics changes over time
- **Dashboard Charts**: Visual charts and graphs
- **Notifications**: Alerts for metric thresholds
- **Bulk Import**: CSV/Excel import for metrics

## 📞 Support

For issues and questions:

1. Check the console logs for errors
2. Verify API server is running on port 8000
3. Verify frontend server is running on port 5173
4. Check network connectivity between frontend and backend
5. Ensure sample data has been created successfully

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.