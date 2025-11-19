import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../store/authSlice.jsx";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/home";

  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      navigate(from, { replace: true });
    } else {
      alert("Login failed: " + result.payload);
    }
  };

  return (
    <Overlay>
      <StyledWrapper>
        <form className="form" onSubmit={handleLogin}>
          <h1 className="form-title">Sign in to your account</h1>

          <div className="input-container">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autofocus
            />
          </div>

          <div className="input-container">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="submit" type="submit">
            Sign in
          </button>

          <p className="signup-link">
            No account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </StyledWrapper>
    </Overlay>
  );
};

export default LoginPage;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledWrapper = styled.div`
  background-color: #fff;
  border-radius: 0.5rem;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    color: #111827;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    label {
      font-size: 0.875rem;
      color: #4b5563;
    }

    input {
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      outline: none;
      transition: border-color 0.2s;

      &:focus {
        border-color: #6366f1;
      }
    }
  }

  .submit {
    background-color: #6366f1;
    color: #fff;
    font-size: 1rem;
    font-weight: 500;
    padding: 0.75rem;
    border: none;
    border-radius: 0.5rem;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #4f46e5;
    }
  }

  .signup-link {
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280;

    a {
      color: #6366f1;
      text-decoration: underline;
    }
  }
`;
