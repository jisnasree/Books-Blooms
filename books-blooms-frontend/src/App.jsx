
import Login from "./features/authentication/Login"
import Register from "./features/authentication/Register"
import VerifyEmail from "./features/authentication/VerifyEmail"
import ForgotPassword from "./features/authentication/ForgotPassword"
import ResetPassword from "./features/authentication/ResetPassword"
import PasswordUpdateSuccess from "./features/authentication/PasswordUpdateSuccess"
import { Routes, Route } from "react-router-dom"
function App() {

  return (
    <main className="min-h-screen bg-gray-50 bg-[#FBFAF7]">
      <Routes>
        <Route path="/login" element = {<Login />}> </Route>
        <Route path="/register" element ={<Register />}></Route>
        <Route path="/verify-email" element = {<VerifyEmail />}> </Route>
        <Route path="reset-password" element ={<ResetPassword />}></Route>
        <Route path="/forgotPassword" element = {<ForgotPassword />}> </Route>
        <Route path="/PasswordUpdateSuccess" element ={<PasswordUpdateSuccess />}></Route>
      </Routes>
    </main>

  )
}
export default App



 {/* <Register /> */}
      {/* <Login /> */}
      {/* <ResetCode /> */}
      {/* <ForgotPassword /> */}
      {/* <ResetPassword /> */}
      {/* <PasswordUpdateSuccess /> */}