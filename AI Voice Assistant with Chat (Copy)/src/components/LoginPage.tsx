import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { BackgroundMarquee } from './BackgroundMarquee';
import { Scale } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        navigate('/dashboard');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-[#1a1a1a]">
      <BackgroundMarquee />
      <Card className="relative z-10 w-[771px] h-[827px] bg-[#333] border-none rounded-[20px] shadow-lg p-8 flex flex-col items-center justify-center">
        <div className="mb-8">
          <Scale className="w-16 h-16 text-[#4269e2]" />
        </div>
        <h1 className="text-4xl font-bold text-[#eee] mb-8 font-['Poppins',sans-serif]">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div>
            <Input
              type="email"
              placeholder="you@yourmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-16 text-2xl bg-transparent border-2 border-white rounded-full text-white placeholder:text-[#aaa] px-6"
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-16 text-2xl bg-transparent border-2 border-white rounded-full text-white placeholder:text-[#aaa] px-6"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-16 bg-[#4269e2] hover:bg-[#3658c7] text-white text-2xl font-semibold rounded-full"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => setIsLogin(true)}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
              isLogin
                ? 'bg-[#4269e2] text-white'
                : 'bg-[#111] text-[#abc0ff] hover:bg-[#222]'
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-colors ${
              !isLogin
                ? 'bg-[#4269e2] text-white'
                : 'bg-[#111] text-[#abc0ff] hover:bg-[#222]'
            }`}
          >
            SIGNUP
          </button>
        </div>

        {isLogin && (
          <a href="#" className="mt-4 text-white underline text-lg">
            Forgot Password?
          </a>
        )}
      </Card>
    </div>
  );
}