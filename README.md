# බෝඩිම (Bodima.lk) — Boarding House Expense Management System

> **Created by Ishara Sesathpura**

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

## 🚀 Render deployment

This repository includes a Render Blueprint in `render.yaml`. Connect the GitHub repository to Render and create the Blueprint service. It builds the React app and starts the Express API in one service, creates a random `JWT_SECRET`, and stores SQLite under `/var/data`.

The Blueprint uses a paid Starter web service and a 1 GB persistent disk. Render Free web services cannot attach persistent disks, so they are unsuitable for keeping SQLite data across restarts. Current listed pricing is $7/month for Starter compute plus $0.25/GB/month for the disk, before any applicable taxes or usage charges. The Blueprint disables automatic deploys; enable them only after the first deploy is reviewed.

After creating the service, Render assigns an `onrender.com` URL. Set `JWT_SECRET` only in Render's environment settings if you replace the generated value. Do not commit `.env` files or database files.

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

### Database storage

The Node server uses SQLite at `data/bodima.db` by default. To put the database on a persistent disk provided by your host, set `DATABASE_PATH` to a file on that disk (for example, `/var/data/bodima.db`) before starting the server. Without a persistent disk, some hosts erase SQLite data when the service restarts or redeploys.

In **Settings → Database**, use **Test Connection** to check the configured Supabase project or the SQLite API. A successful result confirms the server can open its database; it does not replace configuring a persistent disk on a hosted service.
