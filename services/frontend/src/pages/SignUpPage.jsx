import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../store/authSlice";
import { validateRegisterInput } from "../../utils/auth";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [token, navigate]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    const validationError = validateRegisterInput(email, password, name);
    if (validationError) return alert(validationError);
    if (password !== password2) return alert("Passwords do not match");

    const result = await dispatch(registerUser({ email, password, name }));
    if (registerUser.fulfilled.match(result)) {
      navigate("/home");
    } else {
      alert("Sign up failed: " + result.payload);
    }
  };

  return (
    <Overlay>
      <StyledWrapper>
        <form className="form" onSubmit={handleSignUp}>
          <h1 className="form-title">Create a new account</h1>

          <div className="input-container">
            <label htmlFor="signup-name">Name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-container">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-container">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-container">
            <label htmlFor="signup-password2">Confirm Password</label>
            <input
              id="signup-password2"
              type="password"
              placeholder="••••••••"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </div>

          <button className="submit" type="submit">
            Sign up
          </button>
          <p className="signup-link">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </StyledWrapper>
    </Overlay>
  );
}

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
