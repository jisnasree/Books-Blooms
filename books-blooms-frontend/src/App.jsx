import Home from "./features/catalog/pages/Home"
import Login from "./features/authentication/Login"
import Register from "./features/authentication/Register"
import VerifyEmail from "./features/authentication/VerifyEmail"
import ForgotPassword from "./features/authentication/ForgotPassword"
import SetNewPassword from "./features/authentication/SetNewPassword"
import PasswordUpdateSuccess from "./features/authentication/PasswordUpdateSuccess"
import { Routes, Route } from "react-router-dom"
import VerifyCode from "./features/authentication/VerifyCode"
import AdminLayout from "./features/admin/AdminLayout"
import AdminDashboard from "./features/admin/AdminDashboard"
import Books from "./features/admin/Books"
import Orders from "./features/admin/Orders"
import Authors from "./features/admin/Authors"
import Categories from "./features/admin/Categories"
import Customers from "./features/admin/Customers"


function App() {

  return (
    <main className="min-h-screen bg-gray-50 bg-[#FBFAF7]">
      <Routes>
          {/* Home */}
        <Route path="/" element={<Home />}></Route>
        <Route path="/books" element = {<Login />}> </Route>

        {/* Authentication */}
        <Route path="/login" element = {<Login />}> </Route>
        <Route path="/register" element ={<Register />}></Route>
        <Route path="/verify-email" element = {<VerifyEmail />}> </Route>
        <Route path="/set-new-password" element ={<SetNewPassword />}></Route>
        <Route path="/forgot-password" element = {<ForgotPassword />}> </Route>
        <Route path="/verify-reset-code" element = {<VerifyCode />}> </Route>
        <Route path="/password-update-success" element ={<PasswordUpdateSuccess />}></Route>

         {/* Admin section */}
         <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="books" element={<Books />} />
          <Route path="orders" element={<Orders />} />
          <Route path="authors" element={<Authors />} />
          <Route path="categories" element={<Categories />} />
          <Route path="customers" element={<Customers />} />
        </Route>


         {/* Catalogs */}
        

      </Routes>
    </main>

  )
}
export default App
