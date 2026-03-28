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
import AdminBrands from "./pages/Admin/AdminBrands";
import CarsPage from "./pages/user/CarsPage";
import AdminContacts from "./pages/Admin/AdminContacts";
import ContactPage from "./pages/user/ContactPage";
import DepositPage from "./pages/user/DepositPage";
import DepositSuccess from "./pages/user/DepositSuccess";
import DepositCancel from "./pages/user/DepositCancel";
import MyDepositsPage from "./pages/user/MyDepositsPage";
import UserDepositDetail from "./pages/user/UserDepositDetail";
import AdminDeposits from "./pages/Admin/AdminDeposits";
import AdminDepositDetail from "./pages/Admin/AdminDepositDetail";
import AdminUsers from "./pages/Admin/AdminUsers";
import Favorites from "./pages/user/Favorites";

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
        <Route path="/admin/brands" element={<AdminBrands />} />
        <Route path="/admin/contacts" element={<AdminContacts />} />
        <Route path="/admin/deposits" element={<AdminDeposits />} />
        <Route path="/admin/deposits/:id" element={<AdminDepositDetail />} />

        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:id" element={<CarDetail />} />
        <Route path="/cars/:id/contact" element={<ContactPage />} />
        <Route path="/cars/:id/deposit" element={<DepositPage />} />

        <Route path="/deposit/success" element={<DepositSuccess />} />
        <Route path="/deposit/cancel" element={<DepositCancel />} />

        <Route path="/my-deposits" element={<MyDepositsPage />} />
        <Route path="/my-deposits/:id" element={<UserDepositDetail />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/favorites" element={<Favorites />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;