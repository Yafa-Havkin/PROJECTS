const FOLLOW_UPS: Array<{ path: RegExp; questions: string[] }> = [
  {
    path: /\/health-insurance\//i,
    questions: [
      "אילו כיסויים נוספים קיימים בביטוח בריאות?",
      "איפה אפשר לקרוא עוד על ביטוח הבריאות?",
    ],
  },
  {
    path: /\/apartment-insurance\//i,
    questions: [
      "מה ההבדל בין ביטוח מבנה לביטוח תכולה?",
      "איפה אפשר לקרוא עוד על ביטוח דירה?",
    ],
  },
  {
    path: /\/car-insurance\//i,
    questions: [
      "מה ההבדל בין ביטוח חובה לביטוח מקיף?",
      "איפה אפשר לקרוא עוד על ביטוח הרכב?",
    ],
  },
  {
    path: /\/travel-insurance\//i,
    questions: [
      "מה עושים במקרה של ביטול נסיעה?",
      "איפה אפשר לקרוא עוד על ביטוח נסיעות?",
    ],
  },
  {
    path: /\/(?:pension-savings|pension|gemel|savings)\//i,
    questions: [
      "אילו מסלולי חיסכון נוספים קיימים?",
      "איפה אפשר לקרוא עוד על חיסכון ופנסיה?",
    ],
  },
];

export function getFollowUpQuestions(sources: string[]): string[] {
  for (const source of sources) {
    let pathname: string;
    try {
      pathname = new URL(source).pathname;
    } catch {
      continue;
    }

    const match = FOLLOW_UPS.find(({ path }) => path.test(pathname));
    if (match) return match.questions;
  }
  return [];
}
