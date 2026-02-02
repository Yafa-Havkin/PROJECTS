# Task Management System 📋

A modern, full-stack task management application built with .NET Core Web API and Angular.

## 🚀 Features

- ✅ Create, read, and update tasks
- ✅ Mark tasks as completed/incomplete
- ✅ Real-time status updates
- ✅ Modern, responsive UI design
- ✅ RESTful API architecture
- ✅ SQLite database with Entity Framework Core

## 🛠️ Tech Stack

### Backend
- **Framework:** .NET Core 9.0 Web API
- **Database:** SQLite with Entity Framework Core
- **Architecture:** Code First approach
- **API Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** Angular 21
- **Language:** TypeScript
- **Styling:** CSS3 with modern design
- **HTTP Client:** Angular HttpClient

## 📁 Project Structure

```
TaskManagement/
├── Backend/
│   ├── TaskManagement.API/          # Web API Controllers
│   ├── TaskManagement.BLL/          # Business Logic Layer
│   ├── TaskManagement.DAL/          # Data Access Layer
│   └── TaskManagement.Models/       # Entity Models
├── Frontend/
│   └── task-management-app/         # Angular Application
└── README.md
```

## 🏗️ Architecture

### Backend Architecture
- **API Layer:** Controllers handling HTTP requests
- **Business Logic Layer:** Service layer for business rules
- **Data Access Layer:** Entity Framework DbContext and repositories
- **Models:** Entity definitions and DTOs

### Frontend Architecture
- **Components:** Angular components for UI
- **Services:** HTTP services for API communication
- **Models:** TypeScript interfaces matching backend entities

## 📊 Database Schema

### TaskItem Entity
```csharp
public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/{id}` | Update task status |

## 🚀 Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js (v18 or higher)
- Angular CLI (`npm install -g @angular/cli`)

### Backend Setup

1. **Navigate to API project:**
   ```bash
   cd Backend/TaskManagement.API/TaskManagement.API
   ```

2. **Restore packages:**
   ```bash
   dotnet restore
   ```

3. **Run database migrations:**
   ```bash
   dotnet ef database update --project ../../TaskManagement.DAL/TaskManagement.DAL
   ```

4. **Start the API server:**
   ```bash
   dotnet run
   ```
   
   The API will be available at `http://localhost:5206`

### Frontend Setup

1. **Navigate to Angular project:**
   ```bash
   cd Frontend/task-management-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   ng serve
   ```
   
   The application will be available at `http://localhost:4200`

## 🔧 Configuration

### Backend Configuration
- **Database:** Connection string in `appsettings.json`
- **CORS:** Configured to allow requests from `http://localhost:4200`
- **Swagger:** Available at `http://localhost:5206/swagger`

### Frontend Configuration
- **API URL:** Configured in `TaskService` (`http://localhost:5206/api/tasks`)

## 📱 Usage

1. **Add Tasks:** Enter a task title and click "Add Task"
2. **View Tasks:** All tasks are displayed in a clean, modern interface
3. **Complete Tasks:** Check the checkbox to mark tasks as completed
4. **Real-time Updates:** Changes are immediately reflected in the UI

## 🎨 UI Features

- **Modern Design:** Clean, professional interface with gradients and shadows
- **Responsive Layout:** Works on desktop, tablet, and mobile devices
- **Interactive Elements:** Hover effects and smooth transitions
- **Visual Feedback:** Completed tasks show with strikethrough text

## 🧪 Testing

### Backend Testing
```bash
# Run from API project directory
dotnet test
```

### Frontend Testing
```bash
# Run from Angular project directory
ng test
```

## 📦 Build for Production

### Backend
```bash
dotnet publish -c Release
```

### Frontend
```bash
ng build --prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Developer** - Initial work and implementation

## 🙏 Acknowledgments

- Built with modern web development best practices
- Responsive design principles
- RESTful API design patterns
- Clean architecture principles

---

**Happy Task Managing! 🎉**