# 📋 מדריך למבחן - בניית מערכת ב-C# + Angular

## ⏱️ סדר פעולות מהיר (60-90 דקות)

---

## שלב 1: תכנון (10 דקות) ⚠️ אל תדלגי!

### 1.1 תכנון טבלאות
```sql
-- רשמי על נייר:
Table1: Customers
- Id (PK, INT, AUTO_INCREMENT)
- Name (VARCHAR)
- Email (VARCHAR, UNIQUE)
- Phone (VARCHAR)

Table2: Orders
- OrderId (PK, INT, AUTO_INCREMENT)
- CustomerId (FK → Customers.Id)
- OrderDate (DATETIME)
- TotalAmount (DECIMAL)
```

**✅ חשוב:** תמיד תכנני Foreign Keys ו-Cascade Delete!

---

### 1.2 תכנון שכבות
```
Frontend (Angular)
    ↓
API Layer (Controllers)
    ↓
BLL (Business Logic) ← אל תשכחי!
    ↓
DAL (Data Access)
    ↓
Database
```

---

## שלב 2: Backend - מבנה פרויקט (5 דקות)

### 2.1 יצירת Solution
```bash
dotnet new sln -n MySystem
```

### 2.2 יצירת Projects
```bash
dotnet new webapi -n API
dotnet new classlib -n Models
dotnet new classlib -n DAL
dotnet new classlib -n BLL

dotnet sln add API/API.csproj
dotnet sln add Models/Models.csproj
dotnet sln add DAL/DAL.csproj
dotnet sln add BLL/BLL.csproj
```

### 2.3 הוספת References
```bash
cd API
dotnet add reference ../BLL/BLL.csproj
dotnet add reference ../Models/Models.csproj

cd ../BLL
dotnet add reference ../DAL/DAL.csproj
dotnet add reference ../Models/Models.csproj

cd ../DAL
dotnet add reference ../Models/Models.csproj
```

---

## שלב 3: Models (5 דקות)

```csharp
// Models/Customer.cs
public class Customer
{
    public int? Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string? Phone { get; set; }
}

// Models/Order.cs
public class Order
{
    public int? OrderId { get; set; }
    public int CustomerId { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
}
```

---

## שלב 4: DAL (15 דקות)

### 4.1 Interface
```csharp
// DAL/Interfaces/ICustomerRepository.cs
public interface ICustomerRepository
{
    Task<List<Customer>> GetAllCustomersAsync();
    Task<Customer> CreateCustomerAsync(Customer customer);
    Task<bool> UpdateCustomerAsync(int id, Customer customer);
    Task<bool> DeleteCustomerAsync(int id);
}
```

### 4.2 Repository עם Cascade Delete
```csharp
public async Task<bool> DeleteCustomerAsync(int id)
{
    using var connection = CreateConnection();
    await connection.OpenAsync();
    
    // ⚠️ חשוב! Cascade Delete
    using var deleteOrdersCmd = connection.CreateCommand();
    deleteOrdersCmd.CommandText = "DELETE FROM Orders WHERE CustomerId = @customerId";
    deleteOrdersCmd.Parameters.AddWithValue("@customerId", id);
    await deleteOrdersCmd.ExecuteNonQueryAsync();
    
    // מחיקת הלקוח
    using var deleteCustomerCmd = connection.CreateCommand();
    deleteCustomerCmd.CommandText = "DELETE FROM Customers WHERE Id = @id";
    deleteCustomerCmd.Parameters.AddWithValue("@id", id);
    
    return await deleteCustomerCmd.ExecuteNonQueryAsync() > 0;
}
```

**✅ תמיד השתמשי ב-Parameters למניעת SQL Injection!**

---

## שלב 5: BLL (10 דקות) ⚠️ אל תדלגי!

```csharp
// BLL/Interfaces/ICustomerService.cs
public interface ICustomerService
{
    Task<List<Customer>> GetAllCustomersAsync();
    Task<Customer> CreateCustomerAsync(Customer customer);
    Task<bool> UpdateCustomerAsync(int id, Customer customer);
    Task<bool> DeleteCustomerAsync(int id);
}

// BLL/Services/CustomerService.cs
public class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _repo;
    
    public CustomerService(ICustomerRepository repo)
    {
        _repo = repo;
    }
    
    public async Task<Customer> CreateCustomerAsync(Customer customer)
    {
        // כאן אפשר להוסיף לוגיקה עסקית
        return await _repo.CreateCustomerAsync(customer);
    }
    
    // ... שאר הפונקציות
}
```

---

## שלב 6: API Controllers (10 דקות)

```csharp
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _service;
    
    public CustomersController(ICustomerService service)
    {
        _service = service;
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var customers = await _service.GetAllCustomersAsync();
        return Ok(customers);
    }
    
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Customer customer)
    {
        var created = await _service.CreateCustomerAsync(customer);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }
    
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Customer customer)
    {
        var updated = await _service.UpdateCustomerAsync(id, customer);
        if (!updated) return NotFound();
        return NoContent();
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteCustomerAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
```

---

## שלב 7: Program.cs - Dependency Injection (5 דקות)

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ⚠️ סדר חשוב!
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IDbConnectionFactory, DbConnectionFactory>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## שלב 8: Angular Frontend (20 דקות)

### 8.1 יצירת פרויקט
```bash
ng new my-app --routing --style=css
cd my-app
```

### 8.2 מבנה תיקיות
```
src/app/
├── models/
│   ├── customer.model.ts
│   └── order.model.ts
├── services/
│   ├── customer.service.ts
│   └── order.service.ts
├── components/
│   ├── customers/
│   └── orders/
└── app.routes.ts
```

### 8.3 Models
```typescript
// models/customer.model.ts
export interface Customer {
  id?: number;
  name: string;
  email: string;
  phone?: string;
}
```

### 8.4 Service
```typescript
// services/customer.service.ts
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private apiUrl = 'http://localhost:5000/api/customers';
  
  constructor(private http: HttpClient) {}
  
  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }
  
  addCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer);
  }
  
  updateCustomer(id: number, customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer);
  }
  
  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### 8.5 Component
```typescript
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  customerForm: FormGroup;
  
  constructor(
    private service: CustomerService,
    private fb: FormBuilder
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });
  }
  
  ngOnInit() {
    this.loadCustomers();
  }
  
  loadCustomers() {
    this.service.getCustomers().subscribe(data => {
      this.customers = data;
    });
  }
  
  onSubmit() {
    if (this.customerForm.valid) {
      this.service.addCustomer(this.customerForm.value).subscribe(() => {
        this.loadCustomers();
        this.customerForm.reset();
      });
    }
  }
}
```

### 8.6 Routing
```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: '/customers', pathMatch: 'full' },
  { path: 'customers', component: CustomersComponent },
  { path: 'orders', component: OrdersComponent }
];
```

### 8.7 app.config.ts
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

---

## ✅ Checklist למבחן

### Backend:
- [ ] 4 שכבות: API, BLL, DAL, Models
- [ ] Interfaces לכל שכבה
- [ ] Dependency Injection ב-Program.cs
- [ ] Cascade Delete מיושם
- [ ] Parameters ב-SQL (לא string concatenation!)
- [ ] Async/Await בכל מקום
- [ ] CORS מוגדר
- [ ] HttpStatusCodes נכונים (200, 201, 204, 404, 400)

### Frontend:
- [ ] Models מוגדרים
- [ ] Services עם HttpClient
- [ ] Components עם FormGroup
- [ ] Routing מוגדר
- [ ] provideHttpClient ב-app.config.ts
- [ ] Validators על שדות חובה

---

## 🚨 טעויות נפוצות - אל תעשי!

### 1. ❌ Controller מדבר ישירות עם DAL
```csharp
// ❌ לא נכון!
public CustomersController(ICustomerRepository repo)

// ✅ נכון!
public CustomersController(ICustomerService service)
```

### 2. ❌ שכחת Cascade Delete
```csharp
// ❌ לא נכון - ישאר Orphan Records!
DELETE FROM Customers WHERE Id = @id

// ✅ נכון!
DELETE FROM Orders WHERE CustomerId = @id;  // קודם!
DELETE FROM Customers WHERE Id = @id;       // אחר כך!
```

### 3. ❌ SQL Injection
```csharp
// ❌ מסוכן!
command.CommandText = $"SELECT * FROM Customers WHERE Id = {id}";

// ✅ בטוח!
command.CommandText = "SELECT * FROM Customers WHERE Id = @id";
command.Parameters.AddWithValue("@id", id);
```

### 4. ❌ שכחת CORS
```csharp
// ❌ Angular לא יוכל לדבר עם השרת!

// ✅ חובה!
builder.Services.AddCors(...);
app.UseCors("AllowFrontend");
```

### 5. ❌ שכחת provideHttpClient
```typescript
// ❌ HttpClient לא יעבוד!
providers: [provideRouter(routes)]

// ✅ נכון!
providers: [provideRouter(routes), provideHttpClient()]
```

---

## 🎯 טיפים לזמן מהיר

1. **התחילי מ-Models** - הכי פשוט וקובע את המבנה
2. **העתיקי קוד מפרויקט קודם** - אל תכתבי מאפס
3. **השתמשי ב-Swagger** - לבדיקת API מהירה
4. **אל תבזבזי זמן על עיצוב** - CSS בסיסי מספיק
5. **בדקי כל שכבה בנפרד** - לפני שעוברים הלאה

---

## 📊 חלוקת זמן מומלצת (90 דקות)

- תכנון: 10 דק'
- Backend Setup: 5 דק'
- Models: 5 דק'
- DAL: 15 דק'
- BLL: 10 דק'
- Controllers: 10 דק'
- DI + CORS: 5 דק'
- Angular Setup: 5 דק'
- Angular Models + Services: 10 דק'
- Angular Components: 10 דק'
- בדיקות: 5 דק'

---

## 🔥 משפטים לראיון

**"בחרתי ב-ADO.NET כי הפרויקט פשוט ורציתי ביצועים מהירים."**

**"הוספתי BLL כי בעתיד אפשר להוסיף לוגיקה עסקית מורכבת."**

**"מימשתי Cascade Delete כדי למנוע Orphan Records."**

**"השתמשתי ב-Interfaces לצורך Testability ו-Loose Coupling."**

**"CORS נדרש כי Frontend ו-Backend רצים על פורטים שונים."**

**"Async/Await מאפשר לשרת לטפל בבקשות מרובות במקביל."**

---

## ✅ בהצלחה במבחן! 🚀
