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
import OrdersManagement from "./features/admin/OrdersManagement"
import AuthorsManagement from "./features/admin/AuthorsManagement"
import CategoriesManagement from "./features/admin/CategoriesManagement"
import CustomersManagement from "./features/admin/CustomersManagement"
import BooksManagement from "./features/admin/BooksManagement"


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
          <Route path="books" element={<BooksManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="authors" element={<AuthorsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="customers" element={<CustomersManagement />} />
        </Route>


         {/* Catalogs */}
        

      </Routes>
    </main>

  )
}
export default App
