/*
  ============================================================
  צורכי הדרכה 2027 · קובץ השאלות
  ============================================================
  כאן נמצא כל התוכן של השאלון. אפשר לערוך טקסטים, להוסיף או
  למחוק פריטים ולשנות סדר שלבים, בלי לגעת בקובץ app.js.

  איך זה בנוי:
  - themes: התחומים שמופיעים ב"מכ"ם הצרכים" בסיכום.
    לכל תחום יש id (באנגלית, בלי רווחים) ו-label (מה שהמנהל.ת רואה).
  - steps: שלבי האבחון, לפי הסדר. לכל שלב יש type:
      "tokens" – חלוקת נקודות בין קלפים (max = סך הנקודות, cap = מקסימום לקלף)
      "pick"   – בחירת קלפים (max = כמה אפשר לבחור)
      "swipe"  – משפטים שעונים עליהם "זה אני" / "קצת" / "לא ממש"
      "multi"  – כמה קבוצות בחירה באותו מסך (groups)
      "text"   – שדות טקסט חופשי (fields)
  - לכל פריט יש id ייחודי. אם משנים id, עמודה חדשה תיפתח בקובץ האקסל.
  - theme בפריט מחבר אותו לתחום במכ"ם. פריט בלי theme לא נספר בניתוח.

  משקלים בניתוח: נקודה אחת בשלב tokens = 1, קלף שנבחר ב-pick = 3,
  "זה אני" = 2, "קצת" = 1. אפשר לשנות ב-weights למטה.

  חשוב: אחרי שינוי שאלות, מעלים את version כדי שיהיה ברור באקסל
  איזו גרסה כל מנהל.ת מילא.ה.
*/

window.SURVEY = {
  version: "2027.2",
  minutes: 4,

  weights: { tokens: 1, pick: 3, swipeYes: 2, swipeSome: 1 },

  themes: [
    { id: "lead",    label: "הובלה והחלטות" },
    { id: "comm",    label: "תקשורת ושיחות" },
    { id: "change",  label: "שינוי וחוסן" },
    { id: "self",    label: "ניהול עצמי וזמן" },
    { id: "partner", label: "ממשקים ושותפויות" },
    { id: "develop", label: "פיתוח עובדים ומשוב" }
  ],

  steps: [
    {
      id: "team",
      type: "tokens",
      label: "הצוות שלי",
      title: "יש לך 10 נקודות פיתוח לצוות",
      prompt: "איפה הכי שווה להשקיע ב-2027? חלקו את הנקודות בין הקלפים. אפשר עד 4 נקודות לקלף.",
      max: 10,
      cap: 4,
      items: [
        { id: "t_complex",   label: "ניהול שיחות מורכבות",   theme: "comm" },
        { id: "t_time",      label: "ניהול זמן ומשימות",      theme: "self" },
        { id: "t_change",    label: "הובלת שינוי",            theme: "change" },
        { id: "t_collab",    label: "שיתוף פעולה",            theme: "partner" },
        { id: "t_engage",    label: "מחוברות ומוטיבציה",      theme: "develop" },
        { id: "t_pressure",  label: "עבודה בלחץ ובמשבר",      theme: "change" },
        { id: "t_ownership", label: "יוזמה ואחריות אישית",    theme: "lead" },
        { id: "t_burnout",   label: "חוסן ושחיקה",            theme: "change" }
      ]
    },
    {
      id: "me",
      type: "pick",
      label: "אני כמנהל.ת",
      title: "באילו תחומים הייתי רוצה להתחזק?",
      prompt: "בחרו עד 3 קלפים שהכי מדויקים לך השנה.",
      max: 3,
      items: [
        { id: "m_lead",      label: "הובלת צוות",                theme: "lead" },
        { id: "m_decide",    label: "קבלת החלטות",               theme: "lead" },
        { id: "m_resil",     label: "פיתוח חוסן",                theme: "change" },
        { id: "m_authority", label: "מיצוב תפקיד וסמכות",        theme: "lead" },
        { id: "m_partner",   label: "ניהול שותפויות וממשקים",    theme: "partner" },
        { id: "m_self",      label: "ניהול עצמי",                theme: "self" },
        { id: "m_comm",      label: "תקשורת",                    theme: "comm" },
        { id: "m_teamdev",   label: "פיתוח צוות",                theme: "develop" },
        { id: "m_feedback",  label: "משוב והערכה",               theme: "develop" }
      ]
    },
    {
      id: "reality",
      type: "swipe",
      label: "מהשטח",
      title: "זה אני?",
      prompt: "משפטים מהיומיום של מנהלים. סמנו מה מתאר אתכם, בלי לחשוב יותר מדי.",
      items: [
        { id: "s_delay",     text: "יש שיחה לא פשוטה עם עובד.ת שאני דוחה כבר זמן מה",         themes: ["comm", "develop"] },
        { id: "s_change",    text: "הצוות שלי צפוי לעבור שינוי משמעותי ב-2027",                themes: ["change"] },
        { id: "s_meetings",  text: "היום שלי מנוהל בעיקר על ידי ישיבות ומיילים",               themes: ["self"] },
        { id: "s_newbies",   text: "יש בצוות עובדים חדשים שצריך להכשיר",                       themes: ["develop"] },
        { id: "s_interface", text: "חלק מהעבודה נתקע בגלל ממשק עם יחידה אחרת",                 themes: ["partner"] },
        { id: "s_alone",     text: "אני מקבל.ת הרבה החלטות לבד, והצוות פחות לוקח אחריות",      themes: ["lead"] }
      ]
    },
    {
      id: "how",
      type: "multi",
      label: "איך ומתי",
      title: "איך ומתי נכון לכם ללמוד?",
      prompt: "שתי בחירות קצרות.",
      groups: [
        {
          id: "format",
          title: "פורמט מועדף (עד 2)",
          max: 2,
          items: [
            { id: "f_coach",   label: "ליווי אישי" },
            { id: "f_peers",   label: "למידת עמיתים" },
            { id: "f_short",   label: "הדרכות ממוקדות וקצרות" },
            { id: "f_expert",  label: "מפגש נקודתי עם מומחה" },
            { id: "f_deep",    label: "תהליך עומק" },
            { id: "f_digital", label: "למידה דיגיטלית בקצב שלי" }
          ]
        },
        {
          id: "time",
          title: "שעות נוחות לך ולצוות",
          max: 0, // 0 = ללא הגבלה
          items: [
            { id: "h_08", label: "08:00–10:00" },
            { id: "h_10", label: "10:00–12:00" },
            { id: "h_13", label: "13:00–15:00" },
            { id: "h_15", label: "15:00–17:00" },
            { id: "h_17", label: "17:00–19:00" }
          ]
        }
      ]
    },
    {
      id: "words",
      type: "text",
      label: "במילים שלך",
      title: "עוד משהו שחשוב שנדע?",
      prompt: "לא חובה, אבל כאן נמצאים הצרכים הכי מדויקים.",
      fields: [
        { id: "w_perfect", label: "אם הייתה הדרכה אחת מושלמת ב-2027, על מה היא הייתה?", placeholder: "למשל: איך לנהל צוות היברידי בלי לאבד קשר" },
        { id: "w_team",    label: "צורך ספציפי של הצוות שלא הופיע כאן?",                 placeholder: "למשל: הכשרה על המערכת החדשה" },
        { id: "w_clinical", label: "אילו הכשרות קליניות נדרשות לצוות שלך ב-2027?",        placeholder: "למשל: החייאה, טיפול בפצעים, הפעלת ציוד חדש" }
      ]
    }
  ]
};
