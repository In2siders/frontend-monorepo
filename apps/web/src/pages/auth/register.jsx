import '@repo/common/style.css'
import { useEffect, useState } from 'react'
import { apiFetch, healthCheck } from '@repo/connection/utils/api'
import { generateUserKey, compress, decompress } from '@repo/connection/utils/userAuthentication'
import { Button } from '@repo/components/button'
import { motion } from 'motion/react'
import toast from 'react-hot-toast'

/* Save user key to localStorage */
const fnSaveKeyToLocalStorage = (u, key) => {
  const compressedStorage = localStorage.getItem('upk');
  let upkJson = {};
  if (compressedStorage) {
    try {
      upkJson = JSON.parse(decompress(compressedStorage));
    } catch (e) {
      // Si falla, inicializa como objeto vacío
      upkJson = {};
    }
  }

  if (upkJson[u]) {
    console.warn(`Warning: Overwriting existing key for user ${u} in localStorage.`);
  }

  upkJson[u] = key;

  // Guarda como string comprimido
  const compressed = compress(JSON.stringify(upkJson));
  localStorage.setItem('upk', compressed);
}

const FirstStep = ({ signalReady }) => (
  <div className="h-full flex flex-col gap-4 text-center">
    <h1 className="title" >Create Account</h1>
    <p className="subtitle text-red-500 ">This application uses PGP keys for authentication.</p>

    <div className="flex flex-col gap-4">
      <p>Both keys, public and private are generated in your browser and the private key is stored in your browser's local storage. The public key is sent to the server with your username to create your account.</p>
    </div>

    <div className="warning flex flex-col gap-4">
      <h2>Important</h2>
      <strong>If you clear your browser's local storage or use a different browser or device, you will lose access to your account.</strong>
      <p>Make sure to back up your private key if you want to access your account from another device or after clearing your browser data.</p>
    </div>

    <div className="flex flex-col gap-4">
      <p>You can download your private key after completing the registration process.</p>

      <p>By clicking "Select username", you acknowledge that you understand the implications of using PGP keys for authentication and the importance of safeguarding your private key.</p>
    </div>

    <div className='understand mt-5 mb-4'>
      <label className='risk-checkbox-required flex flex-row items-center gap-2'>
        <input type="checkbox" onChange={(e) => {
          if (e.target.checked) {
            signalReady();
          } else {
            signalReady(false);
          }
        }} /> I understand my private key must be kept safe and that losing it means losing access to my account.
      </label>
    </div>
  </div>
)

const SecondStep = ({ data, setData, signalReady }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(null);

  const setAvailableUsername = (itIs) => {
    setIsAvailable(itIs);
    if (itIs) {
      setData({ ...data, username });
    }
    signalReady(!!itIs);
  }

  useEffect(() => {
    setLoading(false);
  }, []);

  const isUsernameAvailable = async (toCheck) => {
    const apiData = await apiFetch(`/auth/check?username=${toCheck}`, {
      method: 'GET',
    });
    return apiData.available;
  }

  const debounceRef = useState(null);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\s/g, '').replace(/[^a-zA-Z_-]/g, ''); // Remove spaces and disallowed characters
    setUsername(value);
    setAvailableUsername(null);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    if (value.length >= 3) {
      debounceRef[1](setTimeout(async () => {
        const available = await isUsernameAvailable(value);
        setAvailableUsername(available);
      }, 500));
    }
  };

  const handleBlur = async () => {
    if (username.length >= 3) {
      const available = await isUsernameAvailable(username);
      setAvailableUsername(available);
    }
  };

  return (
    <>
      <h1 className="title absolute top-60">Choose Username</h1>
      <p className="subtitle">Enter your desired username</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className='flex flex-col gap-5 w-full text-center'>
          <input
            type="text"
            value={username}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter username"
            className={`input text-center p-5 ${isAvailable === null ? '' : isAvailable ? 'input-success' : 'input-error'} ${username.length > 0 && username.length < 3 ? 'input-incorrect' : ''}`}
            required
            pattern='^[a-zA-Z_-]{3,20}$'
          />
          <span>Keys will be generated in the next step.</span>
        </div>
      )}
    </>
  )
}

function ThirdStep({ onBack, data, setData, signalReady }) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState([false, null]);

  useEffect(() => {
    let currentProgress = 0;

    const int = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 4) + 1; // Incrementa entre 1 y 4
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(int);
      }
      setProgress(currentProgress);
    }, 145);

    (async () => {
      const { publicKey, privateKey } = await generateUserKey(data.username);
      setData({ ...data, publicKey, privateKey });
      fnSaveKeyToLocalStorage(data.username, privateKey);
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: data.username, pk: publicKey })
      });
    })().catch(err => {
      console.error('Error during key generation:', err);
      setError([true, err.message || 'Unknown error']);
      clearInterval(int);
    });

    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (progress !== 100) return;
    if (error[0]) return;

    // Signal ready after short delay
    const timeout = setTimeout(() => {
      signalReady();
    }, 350);

    return () => clearTimeout(timeout);
  }, [error, progress]);

  return (
    <>
      <h1 className="title">Almost done!</h1>
      <p>
        {
          error[0]
            ? 'An error occurred during registration.'
            : progress === 100
              ? 'Registration complete!'
              : 'Generating your keys and registering your account...'
        }
      </p>
      {error[0] ? (
        <div>
          {error[0] && <p style={{ color: 'red' }}>Error: {error[1]}</p>}
        </div>
      ) : (
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '100%', height: '12px', background: '#eee', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: progress < 100 ? '#0e1fa1ff' : '#2ecc40' }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}
    </>
  )
}

function FinalStep({ data, setData, signalReady }) {
  const [canLogin, setCanLogin] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setCanLogin(true);
    }, 10_000);
  }, []);

  /* Download key */
  const handleDownloadKey = () => {
    const text_content = `\n# IN2SIDERS PRIVATE KEY DOWNLOAD\n# ===========================\n# PROTECT THIS FILE AS IT CONTAINS YOUR PRIVATE KEY.\n# IF YOU LOSE IT, YOU WILL LOSE ACCESS TO YOUR ACCOUNT.\n; u=${data.username}\n; pub=${compress(data.publicKey)}\n; priv=${compress(data.privateKey)}\n; exported_at=${new Date().toISOString()}\n; instance_id=${crypto.randomUUID()}\n# ===========================\n# You should never share this file with anyone.\n# ===========================\n# To import this key back into your browser, go to the login page and use the "Login with file" option.\n# Ensure you are uploading this file to a trusted instance of the application.\n# For your safety, you exported this key from ${window.location.origin}\n# And therefore, you should only import it back into the same origin.\n# ===========================`.trim();

    const blob = new Blob([text_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `in2siders_${data.username}_export_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCanLogin(true);
  }

  /* Login redirect handle */
  const handleProceedToLogin = () => {
    if (!canLogin) return;
    window.location.href = '/auth/login';
  }

  return (
    <>
      <h1 className="title">Registration Successful!</h1>
      <p className="subtitle">Your account has been created successfully.</p>

      <div className="content-section">
        <p>Your private key has been saved to your browser's local storage. For security reasons, it is highly recommended to download a backup of your private key.</p>
        <p>If you lose access to your browser's local storage (e.g., clearing browser data, using a different device), you will not be able to access your account without the private key.</p>
      </div>

      <div>
        <Button onClick={handleDownloadKey} className="mx-auto mb-4">
          Download Private Key
        </Button>
        <br />
        <span className="text-sm text-gray-400">Make sure to store it in a safe place.</span>
      </div>
      <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {canLogin ? (
          <Button onClick={handleProceedToLogin} className="mx-auto mb-4" variant='ghost' disabled={!canLogin}>
            Proceed to Login
          </Button>
        ) : (
          <>
            <Button disabled className="mx-auto mb-4" variant='ghost'>
              Proceed to Login
            </Button>
            <p>You should download your private key before proceeding. If you don't want, the button will become available after 10 seconds.</p>
          </>
        )}
      </div>
    </>
  )
}

function RegisterPage() {
  const [step, setStep] = useState(0);
  const [registerData, setRegisterData] = useState({ username: '', publicKey: '', privateKey: '' });
  const [canContinue, setCanContinue] = useState(false);
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      toast.promise(() => healthCheck(), {
        loading: 'Checking server status...',
        success: (serverOnline) => {
          setServerReady(serverOnline);
          if (!serverOnline) {
            return 'Server is offline. Please try again later.';
          }
          return 'Server check successful!';
        },
        error: 'Cannot connect to the server. Please try again later.',
      });
    }
    checkServer();
  }, []);

  const proceedToNextStep = () => {
    if (!canContinue) return;
    if (!serverReady) {
      toast.error('We are experiencing connectivity issues. Please try again later.');
      return;
    }

    if (stepAssignment[step].checkFn) {
      stepAssignment[step].checkFn().then((result) => {
        setCanContinue(false);
        if (result) setStep(step + 1);
      });
      return;
    } else {
      setCanContinue(false);
      setStep(step + 1);
    }
  }

  const stepAssignment = [
    {
      element: <FirstStep signalReady={(v = true) => setCanContinue(v)} />,
      outside: null,
      button: <Button variant="ghost" size="small" asChild><a href="/">Back</a></Button>,
      continueText: 'Select username',
    },
    {
      element: <SecondStep data={registerData} setData={setRegisterData} signalReady={(v = true) => setCanContinue(v)} />,
      outside: null,
      button: <Button variant="ghost" size="small" onClick={() => setStep(0)}>Previous</Button>,
      continueText: 'Select username and generate keys',
      checkFn: async () => {
        if (registerData.username.length < 3) {
          toast.error('Username must be at least 3 characters long.');
          return false;
        }

        const available = await apiFetch(`/auth/check?username=${registerData.username}`, {
          method: 'GET',
        });
        if (!available) {
          toast.error('Username is already taken.');
          return false;
        }

        return true;
      }
    },
    {
      element: <ThirdStep data={registerData} setData={setRegisterData} signalReady={(v = true) => setCanContinue(v)} />,
      outside: null,
      button: <Button variant="ghost" size="small" onClick={() => setStep(1)}>Previous</Button>,
      continueText: 'Continue to Final Step',
    },
    {
      element: <FinalStep data={registerData} setData={setRegisterData} signalReady={(_any) => { setCanContinue(false) }} />,
      outside: null,
      button: <Button variant="ghost" size="small" onClick={() => toast.info("You can't go back from here.")}>Previous</Button>,
      continueText: 'No more steps',
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >

      <div className='flex flex-col items-center'>
        <div className='mb-4'>
          {stepAssignment[step].button}
        </div>
        <div className={'container shadow h-full' + (stepAssignment[step].scrollNeeded ? ' scroll-needed' : '')} data-container-pref='auth_register'>
          {stepAssignment[step].element}
          {stepAssignment[step].scrollNeeded && (
            <p className='scroll-indicator'>Scroll to bottom to continue</p>
          )}
        </div>
        <Button onClick={proceedToNextStep} disabled={!canContinue} variant='ghost' className="mt-4">
          {stepAssignment[step].continueText}
        </Button>
      </div>
    </motion.div >
  )
}

export default RegisterPage;
