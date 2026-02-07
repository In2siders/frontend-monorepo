import '@repo/common/style.css'
import toast from 'react-hot-toast';
import { useState } from 'react'
import { Button } from '@repo/components/button'
import { useAuth } from '../../hooks/useAuth'
import { motion } from 'motion/react';
import { decompress } from '@repo/connection/utils/userAuthentication';

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

/**
 *
 * @param {File} file
 */
const obtainDataFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
        const data = { username: '', privateKey: '', expeditedOnDomain: '' };
        const content = event.target.result;
        const lines = content.split('\n');
        for (const l of lines) {
          if(!l.startsWith(';')) { continue; /* Only process lines with ; at the start, which indicates metadata */ }

          const [key, value] = l.substring("; ".length).split('=').map(part => part.trim());

          switch(key.toLowerCase()) {
            case 'u': data.username = value; break;
            case 'priv': data.privateKey = decompress(value); break;
            case 'd': data.expeditedOnDomain = value; break;
            default: break;
          }
        }

        resolve(data);
      };

    reader.onerror = () => reject(new Error("An error occurred while reading the file. Please try again."));
    reader.readAsText(file);
  })
}

const LoginWithFile = ({ credentials, setCredentials }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();
    // 1. Read the file content
    if(!file || typeof file === 'undefined') {
      toast.error("Please select a file to login.");
      return;
    }

    const loginFlow = async () => {
      const { username, privateKey, expeditedOnDomain } = await obtainDataFromFile(file)
      const currentDomain = window.location.origin;


      // 3. Start login
      if(!username || !privateKey) {
        toast.error("The selected file is missing required information. Please ensure you are uploading the correct file.");
        return;
      }

      if(expeditedOnDomain && expeditedOnDomain !== currentDomain) {
        toast.loading(`Loading key from a file with different domain...`, { duration: 4000 });
        await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for 4 seconds to let the user read the message
      }

      console.log({ username, privateKey, expeditedOnDomain, currentDomain })
      const { success, message } = await login(username, privateKey);

      if (!success) {
        toast.error(message);
        return;
      }

      toast.success(message);
      setTimeout(() => {
        window.location.href = '/chat/TODO';
      }, 1500);
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
