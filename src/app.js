const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require("path");

const apiRoutes = require('./routes');
const quotationRoutes = require("./routes/quotation.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const reviewRoutes = require("./routes/review.routes");

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình static folder để xem được ảnh upload
app.use("/uploads", express.static("public/uploads"));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Đăng ký các route mới của Thư
app.use("/api/quotations", quotationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reviews", reviewRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Web bán xe backend is running'
  });
});

// Route tổng hợp cũ
app.use('/api', apiRoutes);

module.exports = app;