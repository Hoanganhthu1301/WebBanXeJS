import { Link } from "react-router-dom";

export default function Navbar(){

  return(

    <div style={{
      display:"flex",
      justifyContent:"space-between",
      padding:"15px",
      background:"#1e3a8a",
      color:"white"
    }}>

      <h2>Web Bán Xe</h2>

      <div>

        <Link to="/" style={{color:"white",marginRight:"15px"}}>Trang chủ</Link>

        <Link to="/login" style={{color:"white",marginRight:"15px"}}>Đăng nhập</Link>

        <Link to="/register" style={{color:"white"}}>Đăng ký</Link>

      </div>

    </div>

  )
}