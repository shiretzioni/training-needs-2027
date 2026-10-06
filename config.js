/*
  הגדרות חיבור – ממלאים פעם אחת לפי "מדריך-הפעלה.md".
  כל עוד supabaseUrl ריק, השאלון עובד במצב תצוגה מקדימה:
  התשובות לא נשלחות, והמנהל.ת יכול.ה רק להוריד את הסיכום.
*/
window.CONFIG = {
  // מתוך Supabase: Project Settings → API
  supabaseUrl: "",      // לדוגמה: "https://abcdxyz.supabase.co"
  supabaseAnonKey: "",  // המפתח הציבורי (anon / publishable). לא את service_role!

  // מוצג למנהל.ת רק אם השליחה נכשלה, כדי לשלוח את הסיכום ידנית
  contactEmail: "",
  contactName: "מנהלת ההדרכה"
};
