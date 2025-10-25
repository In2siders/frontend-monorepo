import React, { useState } from 'react'
import { Button } from '@repo/components/button'
import '@repo/common/style.css'
import { apiFetch } from '@repo/connection/utils/api';
import { decompress, solveChallenge } from '@repo/connection/utils/userAuthentication';

const LoginWithName = ({ credentials, setCredentials, loading, clearMethod, setLoading }) => {
  const [username, setUsername] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1 - POST /auth/challenge - { username }
      const challengeResponse = await apiFetch('/auth/challenge', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });

      // 2 - Receive challenge from server
      const { challengeId, challenge } = challengeResponse;

      console.log('Received challenge:', { challengeId, challenge });

      // 3 - Search for private key with username in localStorage
      const compressUpk = localStorage.getItem('upk');
      if (!compressUpk) {
        throw new Error('Private key not found in local storage.');
      }

      const upkJson = JSON.parse(decompress(compressUpk));

      const privateKey = upkJson[username];
      if (!privateKey) {
        throw new Error('Private key for the given username not found.');
      }

      console.log('Private key found:', privateKey);

      // 4 - Resolve challenge with private key
      const solution = await solveChallenge(challenge, privateKey);

      console.log('Challenge solution:', solution);
      // 5 - POST /auth/challenge/verify - { challengeId, solution }
      const verifyResponse = await apiFetch('/auth/challenge/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeId, solution }),
      });

      // 6 - Receive session token
      const { session } = verifyResponse.data;

      localStorage.setItem('in2-session', session);
    }
    catch (error) {
      console.error('Login error:', error);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="form-group space-y-4">
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
      <Button variant="ghost" width="full" onClick={clearMethod}>
        Back
      </Button>
    </div>
  )
}

const LoginWithFile = ({ credentials, setCredentials, loading, clearMethod, setLoading }) => {
  const [file, setFile] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login attempt with file:', file);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="form-group space-y-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="input"
          required
        />
        <Button variant="accent" width="full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </Button>
      </form>
      <Button variant="ghost" width="full" onClick={clearMethod}>
        Back
      </Button>
    </div>
  )
}

function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', pk: '' }); // Username | Private Key
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState(''); // 'username' | 'file'

  const [ready, setReady] = useState(false);

  const clearMethod = () => setMethod('');

  const Method = method === 'username' ? LoginWithName : LoginWithFile;

  return (
    <div className="container space-y-4">
      <h1 className="title">Welcome Back!</h1> {/* TODO: Mateo, no seria mejor disminuir el tamaño de la fuente? */}
      <div className="content-section">
        <p className="subtitle">
          {method === '' && 'Please choose a login method to continue.'}
          {method === 'username' && 'Login with your username.'}
          {method === 'file' && 'Login with your authentication file.'}
        </p>
      </div>
      
      {method === '' ? (
        <div className='flex flex-row divide-x divide-black space-x-4'>
          <Button onClick={() => setMethod('username')}>
            Login with Username
          </Button>
          <Button onClick={() => setMethod('file')}>
            Login with File
          </Button>
        </div>
      ) : (
        <Method 
          credentials={credentials}
          setCredentials={setCredentials}
          loading={loading}
          clearMethod={clearMethod}
          setLoading={setLoading}
        />
      )}

      <a href="/auth/register" className="help-link">Don't have an account? Register</a>
    </div>
  )
}

export default LoginPage