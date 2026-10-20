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

1. היכנסי ל-https://render.com עם GitHub ובחרי **New ▸ Blueprint**.
2. בחרי את המאגר `PROJECTS` ובשדה **Blueprint Path** הזיני
   `phoenix-rag-bot/render.yaml`.
3. במסך האישור, הזיני את חמשת ערכי Gemini כש-Render מבקש את משתני הסוד:
   `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`,
   `GEMINI_API_KEY_4`, `GEMINI_API_KEY_5`. אין להכניס את הערכים לקובץ YAML
   או לצ'אט.
4. לחצי **Deploy Blueprint**. ה-Blueprint מגדיר את תיקיית השורש של שני
   השירותים, את כתובת ה-API של ה-Frontend, ובדיקת מוכנות שמונעת הצגת שירות
   ריק כתקין.

אם ה-Blueprint כבר נוצר ולא התבקשת להזין סודות, הוסיפי אותם ידנית ב-
**phoenix-backend ▸ Environment**. שמירת משתני סביבה תפעיל פריסה מחדש.

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
- אם Render הוסיף סיומת לשם השירות או אם שינית את שם הבקאנד, עדכני את
  `VITE_API_BASE_URL` ואת כתובת ה-rewrite ב-`render.yaml` בהתאם.
