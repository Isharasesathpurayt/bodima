# බෝඩිම (Bodima.lk) — Boarding House Expense Management System

> **Created by Ishara Sesathpura** ❤️

බෝඩිමේ සාමාජිකයින් අතර වියදම්, කෑම මුදල්, කුලිය සහ පොදු බඩු විනිවිදභාවයෙන් කළමනාකරණය කරගැනීමට නිර්මාණය කළ වෙබ් යෙදුමකි.

---

## 🌟 ප්‍රධාන විශේෂාංග (Key Features)

- **100% ද්විභාෂා සහාය (Bilingual)**: සිංහල සහ ඉංග්‍රීසි අතර ක්ෂණික මාරුවීම.
- **Dark / Light Mode**: ඇසට පහසු තේමා මාරුකිරීම.
- **ජංගම දුරකථන හිතකාමී මෙනුව (Mobile Drawer)**: වම් පස ඉහළ ඉරි තුනේ මෙනුව.
- **පියවර 2 ක සත්‍යාපනය**:
  1. පරිශීලක පිවිසුම (User Login / Sign Up).
  2. බෝඩිමේ නම සහ මුරපදය මගින් බෝඩිමට සම්බන්ධ වීම (Bodima Connect).
- **මුදල් එකතුකිරීම් සහ භාරකරුවන් (Collections Pools)**:
  - බෝඩිම් කුලිය, සතියේ කෑම මුදල්, සබන්/පොදු බඩු සඳහා වෙන වෙනම භාරකරුවන්.
  - ගෙවූ/නොගෙවූ අය ලකුණු කිරීම.
  - ගෙවීම් පමා වූ අයට ක්ෂණික **WhatsApp Payment Reminder** පණිවිඩ.
- **ඊළඟ සතියේ බඩු ලැයිස්තුව (Shopping List)**:
  - නිතර ගන්නා බඩු මිල දර්ශකයෙන් (Price Catalog) ස්වයංක්‍රීයව මිල පිරීම.
  - බෝඩිමෙන් කෑම කන අය අතර පමණක් වියදම බෙදී එක් අයෙකුට වැටෙන මිල ගණනය වීම (කෑම නොකන අයට රු. 0).
  - එක ක්ලික් එකකින් බඩු ලැයිස්තුව වියදමක් ලෙස සටහන් කිරීම (Convert to Expense).
- **බිල්පත් විනිවිදභාවය (Receipt Photos)**: ගෙනා බඩු වල බිල්පත් ඡායාරූප සැමටම බැලිය හැකි වීම.
- **සම්පූර්ණ මූල්‍ය ශේෂය (Financial Summary)**: එකතු වූ මුදල, වියදම් වූ මුදල සහ ඉතිරි මුදල (Net Balance).
- **භාරකරුගේ බැංකු ගිණුම් විස්තර**: Online Banking හරහා සල්ලි යැවීමට ගිණුම් අංක copy කරගැනීමේ පහසුකම.

---

## 🚀 Render.com හි නොමිලේ Host කරන ආකාරය (Step-by-Step)

### පියවර 1: GitHub වෙත Code එක Push කිරීම

1. ඔබේ පරිගණකයේ Terminal එකක් (PowerShell / Command Prompt) විවෘත කරන්න.
2. පහත විධාන ක්‍රියාත්මක කරන්න:
   ```bash
   git add .
   git commit -m "Complete Bodima.lk app by Ishara Sesathpura"
   ```
3. [GitHub.com](https://github.com) වෙත ගොස් අලුත් Repository එකක් සාදන්න (උදා: `bodima.lk`).
4. GitHub හි පෙන්වන Remote Link එක සම්බන්ධ කර push කරන්න:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/bodima.lk.git
   git push -u origin main
   ```

---

### පියවර 2: Render.com හි Web Service එකක් සෑදීම

1. [Render.com](https://render.com) වෙත ගොස් ඔබගේ GitHub ගිණුමෙන් නොමිලේ Log in / Sign up වන්න.
2. Dashboard එකේ දකුණු පස උඩ ඇති **New +** බොත්තම ඔබා **Web Service** තෝරන්න.
3. ඔබ GitHub වෙත push කළ **bodima.lk** repository එක තෝරා **Connect** කරන්න.
4. පහත විස්තර ලබා දෙන්න:
   - **Name**: `bodima` (හෝ කැමති නමක්)
   - **Region**: `Singapore` (ශ්‍රී ලංකාවට ආසන්නතම වේගවත් සර්වර් කලාපය)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. පිටුවේ පහළින් ඇති **Deploy Web Service** (හෝ Create Web Service) බොත්තම ඔබන්න.

---

### පියවර 3: Live Link එක ලබාගැනීම!

මිනිත්තු 1-2 කින් Render මගින් Build එක සම්පූර්ණ කර ඔබට නොමිලේ Live URL එකක් ලබා දෙනු ඇත:
👉 `https://bodima-xxxx.onrender.com`

---

## 💻 Local Development (පරිගණකයේ ධාවනය කිරීම)

```bash
# Dependencies ස්ථාපනය කිරීම
npm install

# Development mode (Frontend + SQLite Backend එකවර ක්‍රියාත්මක වේ)
npm run dev

# Production build සාදා සර්වර් එකෙන් ධාවනය කිරීම
npm run build
npm start
```
