# AI-EXAM — ระบบสร้างใบงานและข้อสอบอัจฉริยะ (React + Gemini)

แอปพลิเคชันเว็บสร้างใบงาน แบบฝึกหัด ข้อสอบ และแผนการจัดการเรียนรู้เชิงรุก (Active Learning) ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน (ฉบับปรับปรุง พ.ศ. 2560) พัฒนาด้วย **React + Vite + TypeScript + Tailwind CSS** และเชื่อมต่อกับ **Google Gemini AI SDK (@google/genai)** โดยตรง

> **รองรับ Google AI Studio (Build Mode)** และ **Google Project IDX** สามารถ Import คลังนี้จาก GitHub เข้าสู่ Google AI Studio เพื่อรัน Live Preview และพัฒนาต่อด้วย AI Prompt ได้ทันที

---

## ฟีเจอร์หลัก (Key Features)

1. **📝 สร้างใบงานแบบฝึกหัด (Worksheet Generator)**
   - เลือกระดับชั้น (ป.1 - ม.6) และกลุ่มสาระวิชา (ไทย, คณิต, วิทย์, อังกฤษ, สังคม ฯลฯ)
   - แนะนำหัวข้อตามหลักสูตรแกนกลางฯ อัตโนมัติ
   - รูปแบบข้อสอบ: ปรนัย 4 ตัวเลือก, เติมคำในช่องว่าง, ถูก-ผิด, อัตนัย/เขียนตอบสั้น
   - ระดับความยาก: ง่าย, ปานกลาง, ท้าทาย, คิดวิเคราะห์
   - สลับดูได้ทั้ง **ใบงานสำหรับนักเรียน** และ **ใบเฉลยสำหรับครู** (พร้อมคำอธิบายละเอียด)
   - รองรับการพิมพ์และบันทึกเป็น PDF ขนาด A4 มาตรฐาน

2. **📋 สร้างข้อสอบและทดสอบออนไลน์ (AI Exam & Quiz)**
   - สร้างชุดข้อสอบมาตรฐาน 5, 10, 15 หรือ 20 ข้อ
   - **โหมดทำข้อสอบออนไลน์ (Interactive Quiz)**: นักเรียนคลิกเลือกคำตอบ ตรวจคะแนนทันที แสดงข้อที่ถูก/ผิด และเฉลยละเอียด
   - **โหมดเอกสารพิมพ์ A4**: สำหรับพิมพ์ชุดข้อสอบพร้อมแผ่นเฉลย

3. **📖 แผนการจัดการเรียนรู้ (Active Learning Lesson Plan)**
   - สร้างแผนการสอนตามโครงสร้าง สพฐ.
   - ระบุมาตรฐานตัวชี้วัด, สาระสำคัญ, จุดประสงค์การเรียนรู้ (K-P-A)
   - กิจกรรมการเรียนรู้ 3 ขั้นตอน: ขั้นนำ, ขั้นสอน, ขั้นสรุป
   - ระบุสื่อการสอนและการวัดผลประเมินผล

4. **🗄️ คลังของฉัน (Saved Archive & Local Storage)**
   - บันทึกผลงานเก็บไว้ในเครื่องอัตโนมัติ
   - ค้นหา กรอง และเรียกดูย้อนหลัง
   - สำรองข้อมูล (Export JSON) และนำเข้า (Import JSON)

---

## การนำเข้า Google AI Studio (Build Mode)

1. ไปที่ [Google AI Studio](https://aistudio.google.com/)
2. เข้าสู่โหมด **Build** (App Builder)
3. กดปุ่ม `+` ที่มุมซ้ายล่างของ Prompt box แล้วเลือก **Import from GitHub**
4. วาง URL ของคลัง: `https://github.com/nutbbgna1/AI-EXAM.git` หรือเลือก Repository `nutbbgna1/AI-EXAM`
5. AI Studio จะตรวจพบโครงสร้าง React + Vite และรัน Live Preview ทันที!

---

## การรันบนเครื่องของคุณ (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันโหมด Development Server
npm run dev

# 3. เปิดเบราว์เซอร์ที่ http://localhost:3000
```

ใส่ Gemini API Key ของคุณที่เมนู **ตั้งค่า (Settings)** มุมขวาบน (ขอรับคีย์ฟรีได้ที่ [Google AI Studio](https://aistudio.google.com/apikey))

---

## เวอร์ชัน PHP เดิม
โค้ดระบบเวอร์ชัน PHP + Apache (เดิม) ถูกสำรองไว้อย่างสมบูรณ์ใน branch `php-version` และ tag `v1.0.0-php`
```bash
git checkout php-version
```

# AI-EXAM
