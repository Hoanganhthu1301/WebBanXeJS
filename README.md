# 🚗 Web Bán Xe Ô Tô (Car Sales Website)

## 📌 Giới thiệu

Đây là hệ thống web bán xe ô tô được xây dựng với kiến trúc **Fullstack (MERN Stack)**, hỗ trợ người dùng tìm kiếm, xem thông tin xe, đặt cọc và tương tác với hệ thống một cách hiện đại.

Hệ thống hướng tới mô hình thực tế của showroom ô tô với các chức năng như: đặt cọc online, quản lý xe, khuyến mãi, tư vấn khách hàng và thông báo realtime.

---

## 🛠️ Công nghệ sử dụng

### 🔹 Backend

* Node.js + Express
* MongoDB + Mongoose
* JWT Authentication
* Socket.IO (Realtime)
* Thanh toán qua PayOS

### 🔹 Frontend

* ReactJS (Vite)
* Axios
* React Router
* Leaflet (Map)

---

## 🚀 Chức năng chính

### 👤 Người dùng (User)

* Đăng ký / Đăng nhập (JWT, Google OAuth)
* Xem danh sách xe
* Xem chi tiết xe (hình ảnh, tính năng, mô tả)
* Tìm kiếm và lọc xe
* Thêm / bỏ yêu thích ❤️
* Gửi yêu cầu tư vấn
* Đặt cọc xe online
* Xem lịch sử đặt cọc
* Nhận thông báo realtime
* Chatbot hỗ trợ AI

---

### 🛠️ Quản trị viên (Admin)

* Quản lý xe (CRUD)
* Quản lý hãng xe (Brand)
* Quản lý danh mục (Category)
* Quản lý khuyến mãi / voucher
* Quản lý đơn đặt cọc
* Xác nhận / hủy / hoàn cọc
* Quản lý người dùng
* Xem báo cáo doanh thu

---

### 💰 Thanh toán & Đặt cọc

* Tính toán tiền đặt cọc (>= 5%)
* Tích hợp cổng thanh toán PayOS
* Xử lý trạng thái:

  * Chờ thanh toán
  * Đã thanh toán
  * Đã xác nhận
  * Hoàn cọc

---

### 🔔 Realtime & AI

* Thông báo realtime với Socket.IO
* Chatbot AI hỗ trợ người dùng

---

### 🗺️ Showroom & Map

* Hiển thị showroom trên bản đồ
* Xác định vị trí người dùng
* Gợi ý showroom gần nhất

---

## 📊 Báo cáo & thống kê

* Thống kê doanh thu theo ngày / tháng
* Lưu dữ liệu báo cáo vào hệ thống

---

## 📁 Cấu trúc thư mục

```
WebBanXe/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── config/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── styles/
│
└── README.md
```

---

## ⚙️ Cài đặt & chạy dự án

### 🔹 Backend

```bash
cd backend
npm install
npm run dev
```

### 🔹 Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Cấu hình môi trường (.env)

### Backend:

```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key

PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=

GOOGLE_CLIENT_ID=
```

---

## 📌 Hướng phát triển

* Quản lý đơn mua xe hoàn chỉnh
* Đặt lịch lái thử
* Đánh giá / bình luận xe
* Quản lý tồn kho
* Xuất báo cáo PDF / Excel

---

## 👨‍💻 Tác giả

* Sinh viên năm 4 ngành Công nghệ phần mềm
* Định hướng: Backend Developer (NodeJS / Java Spring Boot)

---

## ⭐ Ghi chú

Dự án mang tính học tập và mô phỏng hệ thống bán xe thực tế.

---
