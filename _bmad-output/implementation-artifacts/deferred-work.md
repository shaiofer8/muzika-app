- source_spec: `_bmad-output/specs/spec-song-shuffle/SPEC.md`
  summary: אין זיהוי/הודעה אקטיבית כשסרטון YouTube נכשל לחלוטין (embedding disabled, חסימת אזור, וכו') מעבר לרמז הכללי "לחצו על הפעלה"
  evidence: זיהוי כשלים חוצי-מקור (cross-origin iframe) דורש polling/YouTube IFrame API מלא, שהוא מעבר להיקף אתר סטטי ללא build step; לא חוסם את סימן ההצלחה שהוגדר ב-SPEC

- source_spec: `_bmad-output/specs/spec-song-shuffle/SPEC.md`
  summary: אין קובץ LICENSE ברפו הציבורי
  evidence: פרויקט לשימוש אישי, לא מיועד להפצה/קוד פתוח פורמלי — לא נדרש ע"י ה-SPEC; אם ישתנה היעד (למשל שיתוף הקוד) כדאי להוסיף
