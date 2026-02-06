import '@repo/common/style.css'
import toast from 'react-hot-toast';
import { useState } from 'react'
import { Button } from '@repo/components/button'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'motion/react';

const LoginWithName = ({ credentials, setCredentials }) => {
  return (
    <div className="space-y-4 flex flex-col items-center text-center">
      <h1 className='title'>Welcome back</h1>
      <p className='subtitle'>Input exactly your username, then click <strong>Login</strong> down below.</p>
      <div className="space-y-4">
        <input
          type="text"
          value={credentials.username}
          onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
          placeholder="Enter your username"
          className="input w-full"
          required
        />
      </div>
    </div>
  )
}

const LoginWithFile = ({ credentials, setCredentials }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // 1. Read the file content
    if(!file || typeof file === 'undefined') {
      toast.error("Please select a file to login.");
      return;
    }

    const loginFlow = async () => {
      let privateKey = '';
      let publicKey = '';
      let username = '';

      let expeditedOnDomain = '';
      const currentDomain = window.location.hostname;

      file.text().then(content => {
        try {
          const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          for (const l of lines) {
          }
        } catch (err) {
          toast.error("Failed to read the file. Please ensure it's a valid private key file...");
          return;
        }
      })

      // 3. Start login
      const { login } = useAuth();
      const success = await login(username, privateKey);

      if (!success) {
        toast.error('Login failed. Please check your credentials and try again.');
        return;
      }

      toast.success('Welcome back!');
      window.location.href = '/chat/TODO';
    }

    loginFlow();
  };

  return (
    <div className="space-y-4 flex flex-col items-center text-center">
      <p className='subtitle'>Select your private key file, then click <strong>Login</strong> down below.</p>
      <form onSubmit={handleLogin} className="space-y-4">
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
      <div className='flex flex-col gap-4 text-center'>
        <h1 className='title'>Select a login method</h1>
        <p className='subtitle'>You may prefer using <strong>one of the following methods:</strong></p>
        <div className='flex flex-col gap-4 justify-center items-center'>
          <Button className='w-full' variant='secondary' size='large' onClick={() => setMethod('username')}>Login with Username</Button>
          <Button className='flex flex-col gap-4 ' variant='secondary' size='small' onClick={() => setMethod('file')}>Login with File</Button>
        </div>
      </div>
    </>
  )
}

function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', pk: '' }); // Username | Private Key
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('none'); // 'username' | 'file'
  const { login } = useAuth()

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
        try {
          const success = await login(credentials.username)
          if (success) {
            toast.success('Login successful!')
            window.location.href = '/chat/0-general'
          } else {
            toast.error('Login failed. Please check your credentials.')
          }
        } finally {
          setLoading(false)
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      <div className='page-content flex flex-col items-center'>
        <div className='button-group stack-horizontal' style={{ marginBottom: '24px' }}>
          <Button variant="ghost" size="small" onClick={() => setMethod('none')}><a href='/'>Back</a></Button>
        </div>
        <div className={'container shadow'} data-container-pref='auth_login'>
          {methods[method].element}
          {methods[method].finishButton && (
            <div className='button-group stack-horizontal w-full justify-center flex'>
              {methods[method].finishButton}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default LoginPage
