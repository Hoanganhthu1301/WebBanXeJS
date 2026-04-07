import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import socket from "./socket";

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
import AdminRevenue from "./pages/Admin/AdminRevenue";
import AdminPromotions from "./pages/Admin/AdminPromotions";
import UserConsultations from "./pages/user/ContactConsultations";
import QuotationPage from "./pages/user/QuotationPage";
import AppointmentPage from "./pages/user/AppointmentPage";
import ComparePage from "./pages/user/ComparePage";
import ShowroomsPage from "./pages/user/ShowroomsPage";
import AdminShowrooms from "./pages/Admin/AdminShowrooms";
import ChatbotWidget from "./components/ChatbotWidget";
import UserProfile from "./pages/user/UserProfile";

function App() {
  useEffect(() => {
    AOS.init({
      duration: 900,
      once: false,
      offset: 80,
      easing: "ease-in-out",
    });

    const registerSocket = () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) return;

        const userId = user._id || user.id;
        if (!userId) return;

        const role =
          String(user.role || "").toLowerCase() === "admin" ? "admin" : "user";

        socket.emit("register", {
          userId,
          role,
        });

        console.log("✅ Socket registered:", { userId, role });
      } catch (error) {
        console.log("Socket register error:", error);
      }
    };

    if (socket.connected) {
      registerSocket();
    }

    socket.on("connect", registerSocket);

    return () => {
      socket.off("connect", registerSocket);
    };
  }, []);

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
        <Route path="/admin/users" element={<AdminUsers />} />

        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:id" element={<CarDetail />} />
        <Route path="/cars/:id/contact" element={<ContactPage />} />
        <Route path="/cars/:id/deposit" element={<DepositPage />} />
        <Route path="/consultations" element={<UserConsultations />} />

        <Route path="/deposit/success" element={<DepositSuccess />} />
        <Route path="/deposit/cancel" element={<DepositCancel />} />

        <Route path="/my-deposits" element={<MyDepositsPage />} />
        <Route path="/my-deposits/:id" element={<UserDepositDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/admin/revenue" element={<AdminRevenue />} />
        <Route path="/admin/promotions" element={<AdminPromotions />} />
        <Route path="/cars/:id/quotation" element={<QuotationPage />} />
        <Route path="/cars/:id/appointment" element={<AppointmentPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/showrooms" element={<ShowroomsPage />} />
        <Route path="/admin/showrooms" element={<AdminShowrooms />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
      <ChatbotWidget />
    </BrowserRouter>
  );
}

export default App;