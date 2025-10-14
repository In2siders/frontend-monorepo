import React, { useState } from 'react'
import { Button } from '@repo/components/button'
import '@repo/common/style.css'

function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement login logic
    console.log('Login attempt:', username);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="container space-y-4">
      <h1 className="title">Welcome Back</h1>
      <div className="content-section">
        <p className="subtitle">Sign in to your account</p>
      </div>
      
      <form onSubmit={handleLogin} className="form-group">
        <input 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="input"
          required
        />
        <Button variant="accent" width="full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </Button>
      </form>
      <Button variant="accent" width="full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </Button>

      <a href="/auth/register" className="help-link">Don't have an account? Register</a>
    </div>
  )
}

export default LoginPage