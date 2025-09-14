import '../styles/AuthPage.css';

import { useNavigate } from 'react-router-dom'
import { useState } from 'react';

const AuthPage = ({ setToken }: { setToken: (token: string) => void }) => {

  const navigate = useNavigate();

  const [step, setStep] = useState<'signup' | 'verify' | 'login' >('login');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loginError, setError] = useState('');

  // const API_BASE = "http://127.0.0.1:8000";
  // const API_BASE = "https://dabackend-c8fcgxdhdyfff7am.canadacentral-01.azurewebsites.net";
  const API_BASE = import.meta.env.VITE_API_BASE;

  const createAccount = async () => {
    const res = await fetch(API_BASE + '/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name }),
    });

    const data = await res.json();

    if (data.status === 'code_sent') {
      setStep('verify');
    } else {
      setError("Unable to create account");
    }
  };

  const login = async () => {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    if (data.status === 'verify') {
      setStep('verify');
    } else {
      setError("Account does not exist. Kindly create account.");
    }
  };

  const verifyCode = async () => {
  const res = await fetch(API_BASE + '/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json();

  console.log("data", data);
  if (data.status === 'verified') {
      setToken(data.token);
      console.log("data.token", data.token);
      navigate('/dashboard'); // redirect
    }
  };

  return (
    <div className="auth-container">
      {step === 'signup' && (
        <div className="auth-box">
          <h2>Create Account</h2>
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="text" placeholder="Phone (e.g. 2547xxxxxxx)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button onClick={createAccount}>Send Verification Code</button>
        </div>
      )}

      {step === 'login' && (
        <div className="auth-box">
          <h2>Login</h2>
          <input type="text" placeholder="Phone (e.g. 2547xxxxxxx)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {loginError && <text>{loginError}</text>}
          <button onClick={login}>Login</button>
          <button onClick={() => setStep('signup')}>Create Account</button>
        </div>
      )}

      {step === 'verify' && (
        <div className="auth-box">
          <h2>Enter Verification Code</h2>
          <input type="text" placeholder="Code from WhatsApp" value={code} onChange={(e) => setCode(e.target.value)} />
          <button onClick={verifyCode}>Verify</button>
        </div>
      )}

      {/* {step === 'dashboard' && <Dashboard token={token} />} */}
    </div>
  );
};

export default AuthPage;
