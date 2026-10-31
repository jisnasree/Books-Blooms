import Home from "./features/catalog/Home"
import Login from "./features/authentication/Login"
import Register from "./features/authentication/Register"
import EmailVerificationCode from "./features/authentication/EmailVerificationCode"
import ForgotPassword from "./features/authentication/ForgotPassword"
import SetNewPassword from "./features/authentication/SetNewPassword"
import PasswordUpdateSuccess from "./features/authentication/PasswordUpdateSuccess"
import { Routes, Route } from "react-router-dom"
import ForgotPasswordVerifyCode from "./features/authentication/ForgotPasswordVerifyCode"
import AdminLayout from "./features/admin/AdminLayout"
import AdminDashboard from "./features/admin/AdminDashboard"
import OrdersManagement from "./features/admin/OrdersManagement"
import AuthorsManagement from "./features/admin/AuthorsManagement"
import CategoriesManagement from "./features/admin/CategoriesManagement"
import CustomersManagement from "./features/admin/CustomersManagement"
import BooksManagement from "./features/admin/BooksManagement"
import { UserProvider } from "./context/UserContext"
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./features/account/Profile"
import Account from "./features/account/Account"
import Addresses from "./features/account/Addresses"
import BookDetails from "./features/catalog/BookDetails"
import BookCatalog from "./features/catalog/BookCatalog"
import ContactUs from "./features/ContactUs"
import Cart from "./features/cart/Cart"
import Wishlist from "./features/wishlist/WishList"
import Checkout from "./features/orders/Checkout"
import OrderDetails from "./features/orders/OrderDetails"
import Orders from "./features/orders/Orders"
import OrderSuccess from "./features/orders/OrderSuccess"

function App() {
  return (

    <main className="min-h-screen bg-gray-50 bg-[#FBFAF7]">
      <Routes>

        {/* Home */}
        <Route path="/" element={<Home />}></Route>
        <Route path="/books" element={<BookCatalog />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/books/:id" element={<BookDetails />} />

        {/* Wishlist */}
        <Route path="/wishlist" element={<Wishlist />} />

        {/* Cart */}
        <Route path="/cart" element={<Cart />} />

        {/* Checkout */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Orders */}
        <Route path="/orders" element={<Orders />}></Route>
        <Route path="/orders/:id" element={<OrderDetails />}></Route>
        <Route path="/order-success" element={<OrderSuccess />}></Route>




        {/* Account */}
        <Route path="/account" element={<Account />}></Route>

        {/* Profile */}
        <Route path="/profile" element={<Profile />}></Route>

        {/* Address */}
        <Route path="/addresses" element={<Addresses />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />}> </Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/verify-email" element={<EmailVerificationCode />}> </Route>
        <Route path="/set-new-password" element={<SetNewPassword />}></Route>
        <Route path="/forgot-password" element={<ForgotPassword />}> </Route>
        <Route path="/verify-reset-code" element={<ForgotPasswordVerifyCode />}> </Route>
        <Route path="/password-update-success" element={<PasswordUpdateSuccess />}></Route>

        {/* Admin section */}
        {/* <Route element={<ProtectedRoute />}> */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="books" element={<BooksManagement />} />
          <Route path="orders" element={<OrdersManagement />} />
          <Route path="authors" element={<AuthorsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="customers" element={<CustomersManagement />} />
        </Route>
        {/* </Route> */}

        {/* Catalogs */}


      </Routes>
    </main>

  )
}
export default App
