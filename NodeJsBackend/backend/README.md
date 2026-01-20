# Assignment Manager - Server Side

מערכת ניהול מטלות מבוססת Node.js עם TypeScript ו-MongoDB

## 🚀 טכנולוגיות

- **Node.js** - סביבת הרצה
- **TypeScript** - שפת התכנות
- **Express.js** - פריימוורק שרת
- **MongoDB** - מסד נתונים
- **Mongoose** - ODM למונגו
- **JWT** - אימות משתמשים
- **bcrypt** - הצפנת סיסמאות

## 📁 מבנה הפרויקט

```
src/
├── app.ts                      # הגדרת האפליקציה הראשית
├── server.ts                   # נקודת הכניסה לשרת
├── DB_Service/                 # שירותי מסד נתונים
│   ├── Assignments/
│   │   ├── AssignmentModel.ts  # מודל מטלות
│   │   └── AssignmentsService.ts # שירותי מטלות
│   ├── Submission/
│   │   ├── SubmissionModel.ts  # מודל הגשות
│   │   └── SubmissionService.ts # שירותי הגשות
│   └── Users/
│       ├── UserModel.ts        # מודל משתמשים
│       └── UserService.ts      # שירותי משתמשים
├── Middleware/                 # מידלוור
│   ├── AuthenticationMid.ts    # אימות JWT
│   ├── AuthorizationMid.ts     # הרשאות
│   ├── ErrorHandlerMid.ts      # טיפול בשגיאות
│   ├── LoggerMid.ts           # לוגים
│   ├── UserValidationMid.ts    # ולידציה
│   └── ValidateRegistrationMid.ts # ולידציית הרשמה
├── Routers/                    # נתיבים
│   ├── Authentication/
│   │   ├── AuthenticationRouter.ts # נתיבי אימות
│   │   └── JwtUtils.ts        # כלי JWT
│   ├── Student/
│   │   └── StudentRouter.ts   # נתיבי תלמידים
│   └── Teacher/
│       └── TeacherRouter.ts   # נתיבי מורים
└── Utils/                      # כלים
    ├── ConnectDB.ts           # חיבור למסד נתונים
    └── Logger.ts              # מערכת לוגים
```

## 🔧 התקנה והרצה

### דרישות מוקדמות
- Node.js (גרסה 16+)
- MongoDB
- npm או yarn

### התקנה
```bash
# התקנת תלויות
npm install

# הרצת השרת בפיתוח
npm run dev

# בניית הפרויקט
npm run build

# הרצת השרת בפרודקשן
npm start
```

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - הרשמת משתמש חדש
- `POST /auth/login` - התחברות משתמש

### Teacher Routes
- `GET /teacher/assignments` - קבלת כל המטלות
- `POST /teacher/assignments` - יצירת מטלה חדשה
- `GET /teacher/submissions` - קבלת כל ההגשות
- `PUT /teacher/:studentId/:assignmentId` - מתן ציון ומשוב

### Student Routes
- `GET /student/assignments` - קבלת מטלות פתוחות
- `POST /student/submissions` - הגשת מטלה
- `GET /student/submissions/me` - קבלת ההגשות שלי

## 📊 מודלים

### User Model
```typescript
interface IUser {
  userId: string;      // תעודת זהות
  name: string;        // שם מלא
  email: string;       // אימייל
  password: string;    // סיסמה מוצפנת
  role: Role;          // תפקיד (מורה/תלמיד)
}
```

### Assignment Model
```typescript
interface IAssignmentModel {
  title: string;       // כותרת המטלה
  description: string; // תיאור המטלה
  deadLine: Date;      // תאריך הגשה
  isOpen?: boolean;    // האם המטלה פתוחה (virtual)
}
```

### Submission Model
```typescript
interface ISubmissionModel {
  assignmentId: ObjectId; // מזהה המטלה
  studentId: string;      // תעודת זהות התלמיד
  githubLink: string;     // קישור GitHub
  partnerId?: string;     // תעודת זהות פרטנר (אופציונלי)
  grade?: number;         // ציון (0-100)
  feedback?: string;      // משוב מהמורה
}
```

## 🔐 אבטחה

- **JWT Authentication** - אימות מבוסס טוקנים
- **bcrypt** - הצפנת סיסמאות
- **Role-based Authorization** - הרשאות לפי תפקיד
- **Input Validation** - ולידציה של נתונים
- **CORS** - הגנה מפני בקשות חוצות מקור

## 🛡️ Middleware

- **Authentication** - בדיקת תוקף JWT
- **Authorization** - בדיקת הרשאות לפי תפקיד
- **Validation** - ולידציית נתונים
- **Error Handler** - טיפול מרכזי בשגיאות
- **Logger** - רישום פעילות

## 📝 Logging

המערכת כוללת מערכת לוגים מתקדמת:
- לוגי פעילות כלליים
- לוגי שגיאות
- שמירה בקבצים
- רמות לוג שונות

## 🔄 Features

### למורים
- יצירת מטלות חדשות
- צפייה בכל ההגשות
- מתן ציונים ומשוב
- סטטיסטיקות ממוצעים

### לתלמידים
- צפייה במטלות פתוחות
- הגשת מטלות עם קישור GitHub
- אפשרות להוסיף פרטנר
- צפייה בציונים ומשוב

## 🚀 פותח על ידי

לאה, ליאן ויפי

## 📄 רישיון

פרויקט לימודי