import { useState } from "react";
import axios from "axios";

export default function Register() {

  const [formData,setFormData]=useState({
    fullName:"",
    email:"",
    password:"",
    phone:""
  });

  const handleChange=(e)=>{
    setFormData({
      ...formData,
      [e.target.name]:e.target.value
    })
  }

  const handleSubmit=async(e)=>{
    e.preventDefault();

    try{
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );

      alert("Đăng ký thành công");

    }catch(err){
      alert(err.response?.data?.message)
    }
  }

  return(
    <form onSubmit={handleSubmit}>
      <h1>Đăng ký</h1>

      <input name="fullName" placeholder="Họ tên" onChange={handleChange}/>
      <input name="email" placeholder="Email" onChange={handleChange}/>
      <input name="password" type="password" placeholder="Mật khẩu" onChange={handleChange}/>
      <input name="phone" placeholder="SĐT" onChange={handleChange}/>

      <button type="submit">Đăng ký</button>
    </form>
  )
}
