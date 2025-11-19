import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser } from "./store/userSlice";

import Layout from "./components/layout/Layout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import MyPage from "./pages/MyPage.jsx";
import RecordingPage from "./pages/RecordingPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import ConversionPage from "./pages/ConversionPage.jsx";
import MatchingPage from "./pages/MatchingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import TrendingPage from "./pages/TrendingPage.jsx";
import AuthRoute from "./components/routes/AuthRoute.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";

function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route element={<AuthRoute />}>
          <Route element={<Layout />}>
            <Route path="home" element={<HomePage />} />
            <Route path="record" element={<RecordingPage />} />
            <Route path="match" element={<MatchingPage />} />
            <Route path="mypage" element={<MyPage />} />
            <Route path="conversion" element={<ConversionPage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="result" element={<ResultPage />} />
            <Route path="trending" element={<TrendingPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
