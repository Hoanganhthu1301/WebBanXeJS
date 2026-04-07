# 🚗 Web Bán Xe - WebBanXeJS

## 📌 Giới thiệu

WebBanXeJS là hệ thống website bán xe trực tuyến được xây dựng nhằm hỗ trợ người dùng tìm kiếm, xem chi tiết và đặt cọc mua xe một cách nhanh chóng và tiện lợi.

Hệ thống bao gồm:

* Người dùng (User)
* Quản trị viên (Admin)
* Thanh toán online (PayOS)
* Thông báo realtime (Socket.IO)

---

## 🛠️ Công nghệ sử dụng

### 🔹 Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT (Authentication)
* Socket.IO (Realtime)
* Nodemailer / Resend (Gửi email)
* PayOS (Thanh toán)

### 🔹 Frontend

* ReactJS (Vite)
* Axios
* React Router
* i18n (đa ngôn ngữ)
* TailwindCSS / CSS thuần

---

## ⚙️ Chức năng chính

### 👤 Người dùng

* Đăng ký / Đăng nhập (JWT + Google Login)
* Xem danh sách xe
* Xem chi tiết xe
* Tìm kiếm & lọc xe
* Thêm vào danh sách yêu thích ❤️
* Đặt cọc xe (PayOS)
* Xem lịch sử đặt cọc
* Nhận thông báo realtime 🔔
* Đánh giá / nhận xét xe

### 🛠️ Admin

* Quản lý xe (CRUD)
* Quản lý danh mục / hãng xe
* Quản lý người dùng
* Quản lý đơn đặt cọc
* Xác nhận thanh toán
* Quản lý khuyến mãi 🎁
* Xem báo cáo doanh thu 📊
* Gửi thông báo đến user

---

## 💰 Luồng đặt cọc (Payment Flow)

1. User chọn xe
2. Nhấn "Đặt cọc"
3. Hệ thống tính:

   * 5% giá xe
   * VAT, phí đăng ký, bảo hiểm
4. Tạo link thanh toán PayOS
5. User thanh toán
6. Webhook cập nhật trạng thái:

   * `pending → paid → confirmed → completed`

---

## 🔔 Realtime Notification

* Sử dụng Socket.IO
* User nhận thông báo khi:

  * Đặt cọc thành công
  * Admin xác nhận đơn
  * Có khuyến mãi mới

---

## 📁 Cấu trúc project

### Backend

```
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── middlewares/
 ├── services/
 ├── utils/
 └── server.js
```

### Frontend

```
src/
 ├── components/
 ├── pages/
 ├── services/
 ├── utils/
 ├── i18n/
 └── main.jsx
```

---

## 🔐 Authentication

* Sử dụng JWT (RS256)
* Lưu token ở frontend (localStorage)
* Middleware bảo vệ route:

  * `verifyToken`
  * `isAdmin`

---

## ⚡ Cài đặt & chạy project

### 1. Clone project

```bash
git clone https://github.com/Hoanganhthu1301/WebBanXeJS.git
```

---

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

### Tạo file `.env`

```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
MAIL_USER=your_email
MAIL_PASS=your_password
PAYOS_CLIENT_ID=...
PAYOS_API_KEY=...
```

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 API chính

| Method | Endpoint           | Mô tả            |
| ------ | ------------------ | ---------------- |
| GET    | /api/cars          | Lấy danh sách xe |
| GET    | /api/cars/:id      | Chi tiết xe      |
| POST   | /api/auth/login    | Đăng nhập        |
| POST   | /api/deposits      | Đặt cọc          |
| GET    | /api/notifications | Thông báo        |
---

## 📊 Database (MongoDB)

### Một số model chính:

* User
* Car
* Deposit
* Promotion
* Notification
* Showroom
---

## 🚀 Deploy

* Backend: Render
* Frontend: Vercel / Netlify
* Database: MongoDB Atlas
---

## 📌 Ghi chú

* Dự án phục vụ mục đích học tập
* Có thể mở rộng thêm:
---

## ⭐ Demo

👉 Link demo: `https://www.webbanxe.store/`

