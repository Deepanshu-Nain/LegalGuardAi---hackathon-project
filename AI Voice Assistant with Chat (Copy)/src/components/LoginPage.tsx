import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize background animation
    const legalText = `
      LEGAL DOCUMENTS OFTEN CONTAIN <span class="keyword">AFFIDAVIT</span> <span class="def">confirmed by oath</span> //
      <span class="keyword">PLAINTIFF</span> WHO INITIATES LAWSUIT //
      <span class="keyword">DEFENDANT</span> AGAINST WHOM FILED //
      <span class="keyword">CONTRACT</span> <span class="meta">LEGALLY BINDING</span> //
      <span class="keyword">STATUTE</span> PASSED BY LEGISLATIVE BODY //
      <span class="keyword">LIABILITY</span> RESPONSIBILITY FOR ACTIONS //
      <span class="keyword">INDEMNITY</span> OBLIGATION TO COMPENSATE //
      <span class="keyword">JURISDICTION</span> AUTHORITY TO ADMINISTER JUSTICE //
      <span class="keyword">TESTAMENT</span> PERSON'S WILL PROPERTY //
      <span class="keyword">TORT</span> WRONGFUL ACT LIABILITY //
    `;

    const tracks = document.querySelectorAll('.track');
    tracks.forEach(track => {
      let content = '';
      for (let i = 0; i < 6; i++) {
        content += `<span>${legalText}</span>`;
      }
      track.innerHTML = content;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const body = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', data.user?.name || name || email.split('@')[0]);
        navigate('/dashboard');
      } else {
        alert(data.error || data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
  };

  const showAuth = (type: 'login' | 'signup') => {
    setIsLogin(type === 'login');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Courier New', Courier, monospace;
            background-color: #ffffff;
            overflow: hidden;
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* --- BACKGROUND ANIMATION CONTAINER --- */
          .bg-animation {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            opacity: 0.15;
            pointer-events: none;
          }

          /* --- TEXT STYLING --- */
          .scroll-lane {
            display: flex;
            align-items: center;
            white-space: nowrap;
            overflow: hidden;
            font-size: 2rem;
            text-transform: uppercase;
            line-height: 1.1;
            color: #000;
            width: 100%;
          }

          .scroll-lane span {
            padding-right: 50px;
          }

          .keyword { font-weight: 900; text-decoration: underline; }
          .def { font-style: italic; font-weight: 300; }
          .meta { font-weight: bold; letter-spacing: 2px; }

          /* --- ANIMATIONS --- */
          .scroll-left .track {
            display: flex;
            animation: scroll-left 100s linear infinite;
          }
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .scroll-right .track {
            display: flex;
            animation: scroll-right 110s linear infinite;
          }
          @keyframes scroll-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }

          /* --- VERTICAL OVERLAY --- */
          .vertical-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
          }

          .vertical-lane {
            position: absolute;
            top: -50%;
            height: 200%;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            display: flex;
            align-items: center;
            opacity: 0.6;
          }

          .scroll-down .track {
            animation: scroll-down 80s linear infinite;
          }
          @keyframes scroll-down {
            0% { transform: translateY(-50%); }
            100% { transform: translateY(0); }
          }

          .scroll-up .track {
            animation: scroll-up 90s linear infinite;
          }
          @keyframes scroll-up {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }

          /* --- LOGIN/SIGNUP CARDS --- */
          .auth-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: rgba(255, 255, 255, 0.95);
            z-index: 10;
            position: relative;
          }

          .auth-card {
            background: rgba(255, 255, 255, 0.95);
            padding: 2.5rem;
            border: 2px solid #000;
            width: 350px;
            box-shadow: 12px 12px 0px #000;
          }

          .auth-card h1 {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 0.5rem;
          }

          .input-group { margin-bottom: 1rem; }
          .input-group label { display: block; font-weight: bold; margin-bottom: 0.5rem; font-size: 0.9rem; }
          .input-group input { width: 100%; padding: 0.8rem; border: 2px solid #000; font-family: 'Courier New', Courier, monospace; background: #fff; }

          button {
            width: 100%; padding: 1rem; background: #000; color: #fff; border: none;
            font-family: 'Courier New', Courier, monospace; font-weight: bold; font-size: 1rem;
            cursor: pointer; margin-top: 1rem; text-transform: uppercase;
          }
          button:hover { background: #333; }

          .auth-options {
            text-align: center;
            margin-bottom: 1rem;
          }
          .auth-options button {
            width: auto;
            margin: 0 0.5rem;
            padding: 0.5rem 1rem;
            background: #fff;
            color: #000;
            border: 2px solid #000;
          }
          .auth-options button:hover { background: #000; color: #fff; }

          .hidden { display: none !important; }

          /* Specific styles for variation */
          .tiny { font-size: 1rem; opacity: 0.7; }
          .huge { font-size: 4rem; opacity: 0.2; font-weight: bold; }
          .med { font-size: 2.2rem; }

          .v-1 { left: 15%; font-size: 1.5rem; }
          .v-2 { left: 85%; font-size: 1.5rem; }
          .v-3 { left: 5%; font-size: 1rem; opacity: 0.4; }
          .v-4 { left: 92%; font-size: 1rem; opacity: 0.4; }
        `
      }} />

      {/* Background Animation */}
      <div className="bg-animation">
        <div className="scroll-lane scroll-left tiny"><div className="track"></div></div>
        <div className="scroll-lane scroll-right med"><div className="track"></div></div>
        <div className="scroll-lane scroll-left"><div className="track"></div></div>
        <div className="scroll-lane scroll-right huge"><div className="track"></div></div>
        <div className="scroll-lane scroll-left tiny"><div className="track"></div></div>
        <div className="scroll-lane scroll-right"><div className="track"></div></div>
        <div className="scroll-lane scroll-left med"><div className="track"></div></div>
        <div className="scroll-lane scroll-right tiny"><div className="track"></div></div>
        <div className="scroll-lane scroll-left"><div className="track"></div></div>
        <div className="scroll-lane scroll-right huge"><div className="track"></div></div>
        <div className="scroll-lane scroll-left tiny"><div className="track"></div></div>
        <div className="scroll-lane scroll-right med"><div className="track"></div></div>
        <div className="scroll-lane scroll-left"><div className="track"></div></div>
        <div className="scroll-lane scroll-right tiny"><div className="track"></div></div>
        <div className="scroll-lane scroll-left med"><div className="track"></div></div>
      </div>

      <div className="vertical-container">
        <div className="scroll-lane vertical-lane scroll-down v-1"><div className="track"></div></div>
        <div className="scroll-lane vertical-lane scroll-up v-2"><div className="track"></div></div>
        <div className="scroll-lane vertical-lane scroll-down v-3"><div className="track"></div></div>
        <div className="scroll-lane vertical-lane scroll-up v-4"><div className="track"></div></div>
      </div>

      {/* Auth Container */}
      <div className="auth-container">
        <div className={`auth-card ${!isLogin ? 'hidden' : ''}`}>
          <h1>Legal Terminal</h1>
          <div className="auth-options">
            <button type="button" onClick={() => showAuth('login')}>Login</button>
            <button type="button" onClick={() => showAuth('signup')}>Sign Up</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>USER NAME</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Example@gmail.com"
                required
              />
            </div>
            <div className="input-group">
              <label>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit">Submit Evidence</button>
          </form>
        </div>

        <div className={`auth-card ${isLogin ? 'hidden' : ''}`}>
          <h1>Create Account</h1>
          <div className="auth-options">
            <button type="button" onClick={() => showAuth('login')}>Login</button>
            <button type="button" onClick={() => showAuth('signup')}>Sign Up</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>FULL NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Username"
                required
              />
            </div>
            <div className="input-group">
              <label>USER NAME</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Example@gmail.com"
                required
              />
            </div>
            <div className="input-group">
              <label>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit">Create Account</button>
          </form>
        </div>
      </div>
    </>
  );
}