import '@repo/common/style.css'
import toast from 'react-hot-toast';
import { useState } from 'react'
import { Button } from '@repo/components/button'
import { apiFetch } from '@repo/connection/utils/api';
import { decompress, solveChallenge, getFromStorage } from '@repo/connection/utils/userAuthentication';

const LoginWithName = ({ credentials, setCredentials }) => {
  return (
    <div className="space-y-4">
      <h1 className='title'>Welcome back</h1>
      <p className='subtitle'>Input exactly your username, then click <strong>Login</strong> down below.</p>
      <div className="form-group space-y-4">
        <input
          type="text"
          value={credentials.username}
          onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          placeholder="Enter your username"
          className="input"
          required
        />
      </div>
    </div>
  )
}

const LoginWithFile = ({ credentials, setCredentials }) => {
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
    </div>
  )
}

const SelectMethod = ({ setMethod }) => {
  return (
    <>
      <h1 className='title'>Select a login method</h1>
      <p className='subtitle'>You may prefer using <strong>one of the following methods:</strong></p>
      <div className='flex flex-col gap-4 justify-center items-center'>
        <Button className='w-full' variant='secondary' size='large' onClick={() => setMethod('username')}>Login with Username</Button>
        <Button className='flex flex-col gap-4 ' variant='secondary' size='small' onClick={() => setMethod('file')}>Login with File</Button>
      </div>
    </>
  )
}

function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', pk: '' }); // Username | Private Key
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('none'); // 'username' | 'file'

  const methods = {
    none: {
      element: <SelectMethod setMethod={setMethod} />,
      button: null,
      checkFn: () => true,
    },
    username: {
      element: <LoginWithName credentials={credentials} setCredentials={setCredentials} />,
      button: <Button onClick={() => setMethod('username')}>Login with Username</Button>,
      submitFn: async () => {
        if (!credentials.username) {
          toast.error('Please enter your username.');
          return;
        }
        if (credentials.username.length < 3) {
          toast.error('Username must be at least 3 characters long.');
          return;
        }

        setLoading(true);

        const plainPrivate = getFromStorage(credentials.username);

        const challengeResponse = await apiFetch('/auth/challenge', {
          method: 'POST',
          body: JSON.stringify({ username: credentials.username }),
        });

        if (!challengeResponse.challengeId || !challengeResponse.challenge) {
          toast.error('Failed to get challenge from server.');
          setLoading(false);
          return;
        }

        const solvedChallenge = await solveChallenge(challengeResponse.challenge, plainPrivate);

        const solutionResponse = await apiFetch('/auth/challenge/verify', {
          method: 'POST',
          body: JSON.stringify({ challengeId: challengeResponse.challengeId, solution: solvedChallenge, })
        });

        if (solutionResponse.message && solutionResponse.data.session) {
          toast.success('Login successful!');
          cookieStore.set('i2session', solutionResponse.data.session, { path: '/' });

          setLoading(false);
          window.location.href = '/chat/0-general';
        } else {
          toast.error('Login failed. Please check your credentials.');
        }
      },
      finishButton: (
        <Button variant="accent" width="full" onClick={() => methods[method].submitFn()} disabled={loading}>
          {loading ? 'Signing in...' : 'Login with Username'}
        </Button>
      )
    },
    file: {
      element: <LoginWithFile />,
      button: <Button onClick={() => setMethod('file')}>Login with File</Button>,
      checkFn: () => true,
    },
  }

  const Method = method === 'username' ? LoginWithName : LoginWithFile;

  return (
    <div className='page-content flex flex-col items-center'>
      <div className='button-group stack-horizontal' style={{ marginBottom: '24px' }}>
        <Button variant="ghost" size="small" onClick={() => setMethod('none')}><a href='/'>Back</a></Button>
      </div>
      <div className={'container'} data-container-pref='auth_login'>
        {methods[method].element}
        {methods[method].finishButton && (
          <div className='button-group stack-horizontal w-90' style={{ marginTop: '24px' }}>
            {methods[method].finishButton}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage