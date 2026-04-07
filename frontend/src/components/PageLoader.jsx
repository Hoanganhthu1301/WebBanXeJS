import "../components/PageLoader.css";

import logo from "../assets/logo-white.png"; // sửa đúng tên file logo

export default function PageLoader() {
  return (
    <div className="page-loader">
      <img src={logo} alt="logo" className="page-loader-logo" />
    </div>
  );
}