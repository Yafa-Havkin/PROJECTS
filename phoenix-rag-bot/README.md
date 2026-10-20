# 🔥 Phoenix RAG Bot — העוזר הדיגיטלי של הפניקס

בוט שאלות-ותשובות חכם שעונה על שאלות אודות מוצרי ושירותי **חברת הפניקס**,
אך ורק על בסיס התוכן שמופיע באתר הרשמי [fnx.co.il](https://fnx.co.il) — בלי ידע
חיצוני, בלי השערות, ועם ציטוט מקור לכל תשובה.

הבוט בנוי בשיטת **RAG** (Retrieval-Augmented Generation): הוא שולף את הקטעים
הרלוונטיים ביותר מתוך מאגר הידע ומזין אותם ל-Gemini כדי לנסח תשובה מבוססת-מקור
בעברית.

---

## 🎯 מה הבוט עושה

1. **סורק** את אתר הפניקס, מנקה את ה-HTML ומחלק את התוכן לקטעים (chunks) חופפים.
2. **מטמיע** (embedding) כל קטע לווקטור באמצעות Gemini ושומר ב-ChromaDB.
3. בזמן שיחה — **שולף** את הקטעים הרלוונטיים ביותר לשאלה (חיפוש היברידי) ו**מנסח**
   תשובה בעברית, בזרימה (streaming), עם רשימת מקורות.
4. תומך בשתי פרסונות: **מצב לקוח** (חם ונגיש) ו**מצב סוכן** (מקצועי ומפורט).

---

## 📜 הכללים שהבוט מחויב להם

הכללים מוזנים כ**הגדרות** (קבצי YAML תחת `config/`) — לא מקודדים בקוד:

| כלל | מימוש |
|------|--------|
| **מקור יחיד** | התשובות מבוססות אך ורק על התוכן שנשלף מאתר הפניקס. |
| **ציטוט** | כל תשובה מצרפת את כתובות העמודים שמהם נלקח המידע ("מקורות:"). |
| **אין מקור — אין תשובה** | אם לא נמצא מידע רלוונטי, הבוט אומר שאין לו מידע ומפנה לשירות הלקוחות. |
| **גבולות** | הבוט לא נותן ייעוץ אישי ולא ניגש לפרטי לקוח/פוליסה. |
| **עברית** | תשובות בעברית ברורה וקצרה, עם הזמנה לשאלת המשך. |

---

## 🏗️ ארכיטקטורה

שני צינורות נפרדים:

**Offline — בניית מאגר הידע:**
```
אתר הפניקס  →  Crawler  →  ניקוי HTML + Chunking  →  Embedding (Gemini)  →  ChromaDB
```

**Online — מענה לשאלות:**
```
משתמש → React UI → FastAPI → חיפוש היברידי (וקטורי + BM25 + RRF + Rerank)
                                     → ניסוח תשובה בעברית (Gemini) + מקורות → תשובה זורמת
```

### האם השתמשנו במיקרוסרוויסים?
לא, ובכוונה. המערכת היא **מונוליט מודולרי** — שירות FastAPI אחד עם מודולים
מופרדים (crawler, indexer, retriever, generator, session, llm, api). פשוט יותר
לפריסה, מהיר יותר (קריאות בזיכרון), ומתאים לגודל הפרויקט — ועדיין קל לחלץ מודול
לשירות עצמאי בעתיד אם יידרש.

---

## 🔁 רוצים לשכפל לחברה אחרת?

הפרויקט בנוי מראש להתאמה מהירה לכל ארגון — **ללא שינוי בקוד**.
כל ההתנהגות העסקית מוגדרת בקבצי YAML בלבד:

| מה לשנות | איפה |
|-----------|------|
| שם החברה, URL לסריקה, עומק הסריקה | `config/phoenix.yaml` |
| אופי הבוט ללקוח — טון, גבולות, הגבלות | `config/personas/customer.yaml` |
| אופי הבוט לסוכן — שפה מקצועית, ציטוטים | `config/personas/agent.yaml` |

מחליפים את הקבצים, מריצים את ה-Crawler פעם אחת — והבוט יודע הכל על הארגון החדש. 🚀

---


העדכון הוא **סריקה מתוזמנת אוטומטית** (לא בזמן אמת ולא על כל שינוי בודד).
ברירת מחדל: כל יום ראשון ב-02:00 (`recrawl_schedule` ב-`config/phoenix.yaml`).
בכל ריסריקה המערכת סורקת מחדש, מטמיעה ומסנכרנת (מוסיפה/מעדכנת/מוחקת עמודים).

הרצה ידנית:
```bash
python -m backend.crawler.cli --tenant config/phoenix.yaml          # אינדוקס טרי
python -m backend.crawler.cli --tenant config/phoenix.yaml --sync   # ריסריקה + סנכרון
```

---

## 🚀 הרצה מקומית

```bash
# 1. התקנת תלויות
pip install -r requirements.txt

# 2. מפתחות — להעתיק .env.example ל-.env ולמלא GEMINI_API_KEY
copy .env.example .env

# 3. בניית מאגר הידע (פעם אחת)
python -m backend.crawler.cli --tenant config/phoenix.yaml

# 4. הרצת הבקאנד
python -m backend.main               # http://localhost:8000

# 5. הרצת הפרונטאנד
cd frontend && npm install && npm run dev   # http://localhost:5173
```

---

## 🛡️ עמידות: מנגנון fallback

הלקוח `backend/llm/gemini_client.py` מספק:
- **Fallback בין מודלים** — על 503/timeout עוברים למודל הבא ברשימה.
- **Fallback בין מפתחות** — על 429 (מכסה) מתגלגלים למפתח הבא (עד 5 מפתחות).
- **טיימאאוט קשיח** + REST transport (תאימות לרשתות עם בדיקת SSL כמו NetFree).

---

## 🧰 טכנולוגיות

Python · FastAPI · Uvicorn · Google Gemini · ChromaDB · BM25 (rank-bm25) ·
Crawlee + BeautifulSoup · React · TypeScript · Vite · Tailwind CSS · SSE ·
pytest + Hypothesis.

---

## ☁️ פריסה לענן

הפרויקט פרוס ב-Railway כשירותי Frontend ו-Backend נפרדים:

- **קישור למשתמשים (Frontend):** https://projects-production-77a3.up.railway.app
- **Backend (בדיקת תקינות):** https://projects-production-5e07.up.railway.app/api/health
- **Backend (בדיקת מוכנות לבוט):** https://projects-production-5e07.up.railway.app/api/ready

בדיקת `/api/ready` מחזירה `200` רק כשמאגר הידע אינו ריק ומוגדר מפתח Gemini.
בתשובת `503` יש לבדוק את `issues`: `vector_store_empty` מצביע על מאגר שלא
נפרס, ו-`gemini_api_key_missing` מצביע על משתנה סביבה חסר בשירות הבקאנד.

ה-Frontend שולח בקשות API לכתובת ה-Backend שלמעלה. ב-Railway אפשר להגדיר
בשירות ה-Frontend משתנה `VITE_API_BASE_URL` עם הערך
`https://projects-production-5e07.up.railway.app`; אם המשתנה לא מוגדר, כתובת זו
משמשת כברירת מחדל בבניית production. לאחר שינוי משתנה, יש לפרוס מחדש את ה-Frontend
כדי ש-Vite יכלול אותו בבנייה.

ה-Backend מאפשר כברירת מחדל בקשות מה-Frontend המקומי ומדומיין ה-Railway שמעל.
אם משנים את דומיין ה-Frontend, יש לעדכן את `PHOENIX_CORS_ORIGINS` בשירות ה-Backend
כך שיכלול את כתובת ה-Frontend החדשה.

<div align="center">🔥 נבנה עבור חברת הפניקס 🔥</div>
