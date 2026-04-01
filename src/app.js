const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const path = require("path");
const app = express();
const quotationRoutes = require("./routes/quotation.routes");
const appointmentRoutes = require("./routes/appointment.routes");

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("public/uploads"));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use("/api/quotations", quotationRoutes);
app.use("/api/appointments", appointmentRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Web bán xe backend is running'
  });
});

app.use('/api', apiRoutes);

module.exports = app;
