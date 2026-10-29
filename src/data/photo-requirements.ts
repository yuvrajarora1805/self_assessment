export const defaultPhotoRequirements: { id: number; key: string; label: string }[] = [
  { id: 0, key: 'ro_full', label: '1. FULL RO PHOTO' },
  { id: 1, key: 'sales_room', label: '2. SALES ROOM OUTSIDE' },
  { id: 2, key: 'hoarding', label: '3. HOARDING PHOTO' },
  { id: 3, key: 'air_facility', label: '4. AIR FACILITY (MANNED)' },
  { id: 4, key: 'water_cooler', label: '5. WATER COOLER (GREY MAT)' },
  { id: 5, key: 'toilet_male', label: '6. MALE TOILET' },
  { id: 6, key: 'toilet_female', label: '7. FEMALE TOILET' },
  { id: 7, key: 'all_fsms', label: '8. ALL FSMs AVAILABLE IN SHIFT' },
  { id: 8, key: 'peso_license', label: '9. PESO LICENSE' },
  { id: 9, key: 'wm_certificate', label: '10. W&M CERTIFICATE' },
  { id: 10, key: 'decantation_sheet', label: '11. DECANTATION CHECK LIST FOR LAST LOAD' },
  { id: 11, key: 'decantation_point', label: '12. DECANTATION POINT WITH PRODUCT NAME (MS/HSD)' }
];

export const photoRequirementsDict: Record<string, Record<string, string>> = {
  "1. FULL RO PHOTO": { hi: "पूरा आरओ फोटो", mr: "पूर्ण RO फोटो", gu: "સંપૂર્ણ RO ફોટો", te: "పూర్తి RO ఫోటో", ta: "முழு RO புகைப்படம்" },
  "2. SALES ROOM OUTSIDE": { hi: "सेल्स रूम के बाहर", mr: "सेल्स रूमच्या बाहेर", gu: "સેલ્સ રૂમની બહાર", te: "సేల్స్ రూమ్ బయట", ta: "விற்பனை அறை வெளியே" },
  "3. HOARDING PHOTO": { hi: "होर्डिंग फोटो", mr: "होर्डिंग फोटो", gu: "હોર્ડિંગ ફોટો", te: "హోర్డింగ్ ఫోటో", ta: "ஹோர்டிங் புகைப்படம்" },
  "4. AIR FACILITY (MANNED)": { hi: "वायु सुविधा (मानवयुक्त)", mr: "हवा सुविधा (मानवयुक्त)", gu: "એર સુવિધા (માનવસહિત)", te: "గాలి సదుపాయం (మనిషితో)", ta: "காற்று வசதி" },
  "5. WATER COOLER (GREY MAT)": { hi: "वाटर कूलर (ग्रे मैट)", mr: "वॉटर कुलर (ग्रे मॅट)", gu: "વોટર કુલર (ગ્રે મેટ)", te: "వాటర్ కూలర్ (గ్రే మ్యాట్)", ta: "வாட்டர் கூலர்" },
  "6. MALE TOILET": { hi: "पुरुष शौचालय", mr: "पुरुष शौचालय", gu: "પુરુષ શૌચાલય", te: "పురుషుల మరుగుదొడ్డి", ta: "ஆண்கள் கழிப்பறை" },
  "7. FEMALE TOILET": { hi: "महिला शौचालय", mr: "महिला शौचालय", gu: "મહિલા શૌચાલય", te: "స్త్రీల మరుగుదొడ్డి", ta: "பெண்கள் கழிப்பறை" },
  "8. ALL FSMs AVAILABLE IN SHIFT": { hi: "शिफ्ट में सभी एफएसएम उपलब्ध हैं", mr: "शिफ्टमध्ये सर्व FSM उपलब्ध आहेत", gu: "શિફ્ટમાં તમામ FSM ઉપલબ્ધ છે", te: "అన్ని FSMలు", ta: "அனைத்து FSMகளும்" },
  "9. PESO LICENSE": { hi: "पेसो लाइसेंस", mr: "PESO परवाना", gu: "PESO લાઇસન્સ", te: "PESO లైసెన్స్", ta: "PESO உரிமம்" },
  "10. W&M CERTIFICATE": { hi: "W&M प्रमाणपत्र", mr: "W&M प्रमाणपत्र", gu: "W&M પ્રમાણપત્ર", te: "W&M సర్టిఫికేట్", ta: "W&M சான்றிதழ்" },
  "11. DECANTATION CHECK LIST FOR LAST LOAD": { hi: "अंतिम लोड के लिए डिकेंटेशन चेक सूची", mr: "डिकँटेशन तपासणी यादी", gu: "ડિકેન્ટેશન ચેકલિસ્ટ", te: "డికాంటేషన్ చెక్ లిస్ట్", ta: "சரிபார்ப்பு பட்டியல்" },
  "12. DECANTATION POINT WITH PRODUCT NAME (MS/HSD)": { hi: "उत्पाद के नाम (MS/HSD) के साथ डिकेंटेशन पॉइंट", mr: "डिकँटेशन पॉईंट (MS/HSD)", gu: "ડિકેન્ટેશન પોઇન્ટ", te: "డికాంటేషన్ పాయింట్", ta: "டிகாண்டேஷன் பாயிண்ட்" }
};
