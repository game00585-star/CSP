# CSP Warehouse Management System

ระบบจัดการคลังสินค้าสำหรับ **CSP Foods Supply Co., Ltd.** ครอบคลุม Dashboard, Stock คงเหลือ, รับสินค้า, จ่ายสินค้า, โอนระหว่างคลัง, Stock Card, ข้อมูลสินค้า, รายงาน และตั้งค่า

## เทคโนโลยี

React, Vite, JavaScript, Tailwind CSS, React Router, Lucide React, Recharts, XLSX และ localStorage

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
npm run build
npm run preview
```

บัญชีทดสอบ: Username `admin` / Password `1234`

## เมนูและกลุ่มคลัง

เมนูประกอบด้วย Dashboard, คลังสินค้า, รับเข้า, จ่ายออก, โอน, Stock Card, ข้อมูลสินค้า, รายงาน และตั้งค่า รองรับคลัง PK, IN, RM, FG (ชำแหละ) และ FG (แพ็ค)

## Stock Card และ Mock Data

ข้อมูลสินค้าและความเคลื่อนไหวใช้แหล่งข้อมูลกลางผ่าน Context เมื่อรับสินค้ายอดเพิ่ม เมื่อจ่ายยอดลด และเมื่อโอนจะสร้างรายการโอนออก/โอนเข้าด้วยเลขเอกสารเดียวกัน ข้อมูลถูกเก็บใน localStorage และส่งออกเป็น Excel ได้ ระบบนี้ยังเป็น Mock System และยังไม่เชื่อมฐานข้อมูลจริง, Firebase หรือ API ภายนอก

## นำขึ้น GitHub

```bash
git init
git add .
git commit -m "Initial CSP Warehouse Management System"
git branch -M main
git remote add origin URL_REPOSITORY
git push -u origin main
```

การพัฒนาต่อควรเพิ่ม backend authentication, ฐานข้อมูล, transaction แบบ atomic, สิทธิ์ผู้ใช้, audit log และ automated tests ก่อนใช้งานจริง
