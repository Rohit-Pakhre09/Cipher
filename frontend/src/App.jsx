import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";

import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initChatListeners } from "./store/chatSlice";
import { checkAuth } from "./store/authSlice";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, isCheckingAuth, socket } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch])

  useEffect(() => {
    if (socket) {
      dispatch(initChatListeners());
    }
  }, [socket, dispatch])

  if (isCheckingAuth && !authUser) return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="size-10 animate-spin" />
    </div>
  );

  return (
    <section data-theme={theme}>
      <Navbar />

      <main className="pt-16">
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!authUser ? <ForgotPassword /> : <Navigate to="/" />} />
          <Route path="/reset-password/:token" element={!authUser ? <ResetPassword /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>
      </main>

      <Toaster />

    </section>
  )
}

export default App