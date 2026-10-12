
import Login from "./features/authentication/Login"
import Register from "./features/authentication/Register"
import VerifyEmail from "./features/authentication/VerifyEmail"
import ForgotPassword from "./features/authentication/ForgotPassword"
import SetNewPassword from "./features/authentication/SetNewPassword"
import PasswordUpdateSuccess from "./features/authentication/PasswordUpdateSuccess"
import { Routes, Route } from "react-router-dom"
import VerifyCode from "./features/authentication/VerifyCode"
function App() {

  return (
    <main className="min-h-screen bg-gray-50 bg-[#FBFAF7]">
      <Routes>
        <Route path="/login" element = {<Login />}> </Route>
        <Route path="/register" element ={<Register />}></Route>
        <Route path="/verify-email" element = {<VerifyEmail />}> </Route>
        <Route path="/set-new-password" element ={<SetNewPassword />}></Route>
        <Route path="/forgot-password" element = {<ForgotPassword />}> </Route>
        <Route path="/verify-reset-code" element = {<VerifyCode />}> </Route>
        <Route path="/password-update-success" element ={<PasswordUpdateSuccess />}></Route>
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