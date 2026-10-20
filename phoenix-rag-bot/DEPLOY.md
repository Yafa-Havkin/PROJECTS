# 🚀 העלאה לענן — Phoenix RAG Bot (GitHub + Render)

מדריך קצר להעלאת הבוט לענן כך שיהיה נגיש מכל מקום (דרישת ההאקתון ☁️).
GitHub לקוד + Render להרצה (פשוט, free tier, בלי כרטיס אשראי).

הכול כבר מוכן: `render.yaml`, `.gitignore` מעודכן, ו-CORS שתומך בפריסה.

---

## שלב 1 — להעלות ל-GitHub

> ⚠️ ודאי ש-`.env` לא עולה — הוא כבר ב-`.gitignore`.

```bash
git init
git add .
git commit -m "Phoenix RAG Bot"
git branch -M main
git remote add origin https://github.com/Yafa-Havkin/PROJECTS.git
git push -u origin main
```
> ה-`git add .` כולל את `data/chroma_db/` (מאגר הידע) ולא כולל את `.env`.

---

## שלב 2 — לפרוס ב-Render

1. היכנסי ל-https://render.com והירשמי עם GitHub.
2. **New ▸ Blueprint** ▸ בחרי את ה-repo. Render יזהה את `render.yaml` ויציג
   את `phoenix-backend` ו-`phoenix-frontend`.
3. **Apply** — Render יבנה ויפרוס את שניהם.

---

## שלב 3 — להזין מפתחות (סודות)

ב-Render ▸ שירות **phoenix-backend** ▸ **Environment** ▸ הוסיפי:
`GEMINI_API_KEY`, `GEMINI_API_KEY_2` … `GEMINI_API_KEY_5` (אותם ערכים כמו ב-`.env`).
שמרי — Render יפעיל מחדש אוטומטית.

---

## שלב 4 — לבדוק

- בריאות: `https://phoenix-backend.onrender.com/api/health` → `{"status":"ok"}`
- מוכנות: `https://phoenix-backend.onrender.com/api/ready` → `200` כשהאינדקס ומפתח Gemini זמינים.
  אם מתקבל `503`, יש לבדוק את `issues` בתגובה: מאגר ריק או מפתח Gemini חסר.
- הבוט: `https://phoenix-frontend.onrender.com` — זה ה-URL לשופטים. 🎉

---

## הערות

- **Free tier נרדם** אחרי ~15 דק' חוסר שימוש; הבקשה הראשונה אחרי זה ~30–50 שניות.
  לפני ההדגמה — פתחי את הכתובת פעם אחת כדי "להעיר".
- **אבטחה:** אחרי האקתון מומלץ לבטל/להחליף את המפתחות (היו גלויים על המסך).
- אם שינית את שם הבקאנד ב-Render, עדכני את כתובת ה-rewrite ב-`render.yaml`.
