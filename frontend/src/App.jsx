import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import ForgotPassword from "./pages/user/ForgotPassword";
import ResetPassword from "./pages/user/ResetPassword";

import AdminHome from "./pages/Admin/AdminHome";
import AdminCars from "./pages/Admin/AdminCars";
import AdminCategories from "./pages/Admin/AdminCategories";
import CarDetail from "./pages/user/CarDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/cars" element={<AdminCars />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        
        <Route path="/cars/:id" element={<CarDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;