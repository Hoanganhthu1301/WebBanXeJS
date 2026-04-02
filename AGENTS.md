# AGENTS.md

## 1. Mục tiêu project
Đây là project web bán xe sử dụng:
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose

Hệ thống gồm 2 phần chính:
- **User site:** xem xe, lọc xe, xem chi tiết xe, gửi yêu cầu tư vấn
- **Admin site:** quản lý xe, danh mục, hãng xe, yêu cầu tư vấn

---

## 2. Kiến trúc thư mục

### Root
- `frontend/`: source code giao diện người dùng và admin
- `src/` hoặc thư mục backend gốc: source code API Node.js/Express
- `uploads/`: nơi chứa file upload nếu dùng local upload
- `.env`: biến môi trường backend
- `AGENTS.md`: hướng dẫn cho AI agent/dev

---

## 3. Cấu trúc backend

### Thư mục chính
- `models/`: chứa mongoose model
- `controllers/`: xử lý logic API
- `routes/`: khai báo route API
- `config/`: cấu hình database hoặc config khác
- `middlewares/`: middleware auth, validate, upload...
- `app.js`: cấu hình express app
- `server.js`: khởi động server

### Model hiện có
- `Car`: xe
- `Category`: danh mục xe
- `Brand`: hãng xe
- `Contact`: yêu cầu tư vấn
- `User`: tài khoản đăng nhập

### API base
- `/api/auth`
- `/api/cars`
- `/api/categories`
- `/api/brands`
- `/api/contacts`

---

## 4. Cấu trúc frontend

### Thư mục chính
- `src/pages/user/`: trang phía user
- `src/pages/Admin/`: trang phía admin
- `src/components/`: component dùng chung
- `src/styles/user/`: css trang user
- `src/styles/admin/`: css trang admin
- `src/App.jsx`: khai báo route
- `src/main.jsx`: mount app

### Route user
- `/`: trang chủ / landing page
- `/cars`: danh sách xe
- `/cars/:id`: chi tiết xe
- `/cars/:id/contact`: form tư vấn
- `/login`
- `/register`

### Route admin
- `/admin`
- `/admin/cars`
- `/admin/categories`
- `/admin/brands`
- `/admin/contacts`

---

## 5. Quy ước code

### Naming
- File component React: PascalCase  
  Ví dụ: `AdminCars.jsx`, `ContactPage.jsx`
- File css: trùng tên component/page  
  Ví dụ: `AdminCars.css`, `ContactPage.css`
- Model/controller/route backend: lowercase + dot style  
  Ví dụ: `car.model.js`, `car.controller.js`, `car.routes.js`

### React
- Dùng function component
- Dùng `useState`, `useEffect`, `useMemo` khi cần
- API call dùng `axios`
- Route dùng `react-router-dom`
- Không hard-code dữ liệu khi đã có DB
- Với dữ liệu có thể null, luôn dùng optional chaining:
  - `car?.name`
  - `item?.carId?.brand`

### Backend
- Controller không viết logic linh tinh trong route
- Route chỉ gọi controller
- Mongoose schema phải có default hợp lý
- Validate input ở controller trước khi create/update
- Trả response JSON thống nhất:
  - `message`
  - `data` hoặc field cụ thể như `cars`, `car`, `contacts`

---

## 6. Quy tắc quan trọng

### Không phá dữ liệu cũ
- Không đổi tên field DB bừa bãi nếu frontend đang dùng
- Nếu thêm field mới, phải update:
  1. model
  2. controller create/update
  3. frontend form
  4. frontend page hiển thị

### Với ảnh xe
Project hiện hỗ trợ cả:
- `image`: ảnh đại diện dạng string
- `images`: mảng nhiều ảnh

Ưu tiên khi hiển thị:
1. `image`
2. `images[0]`
3. placeholder fallback

### Với trang chi tiết xe
- `highlights` là block nội dung nổi bật
- `features` là block trang bị nổi bật
- `features.image` phải được ưu tiên dùng riêng, không fallback lung tung nếu mục tiêu là hiển thị đúng ảnh từng trang bị

### Với form tư vấn
- Dữ liệu xe đang xem phải auto-fill từ `car`
- Không để user nhập lại tên xe nếu đã biết từ route `/cars/:id/contact`

### Với admin
- Các dropdown như category/brand nên lấy từ DB
- Không nhập text tay nếu đã có bảng quản lý riêng

---

## 7. Chuẩn xử lý giao diện

### Phong cách UI
Project đang theo hướng:
- nền tối / premium
- cảm hứng Mercedes / AMG
- ảnh lớn
- card rõ ràng
- text trắng/xám sáng trên nền đen

### Không nên
- nhồi quá nhiều xe vào landing page
- dùng card quá nhỏ
- lặp 1 ảnh cho mọi section
- để form tràn hoặc chữ quá nhỏ

### Nên
- tách landing page và cars page
- detail page có:
  - hero
  - highlights
  - features
  - specs
  - contact CTA

---

## 8. Build và chạy project

### Backend
Cài package:
```bash
npm install