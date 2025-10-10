import { useEffect, useState } from 'react'
import { apiFetch } from '@repo/connection/utils/api'
import { generateUserKey, compress, decompress } from '@repo/connection/utils/userRegistration'
import { Button } from '@repo/components/button'
import '@repo/common/style.css'

/* Storage keys on browser */
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

const FirstStep = ({ onNext }) => (
  <div className="container">
    <h1 className="title">Create Account</h1>
    <p className="subtitle">This application uses PGP keys for authentication.</p>
    
    <div className="content-section">
      <p>Both keys, public and private are generated in your browser and the private key is stored in your browser's local storage. The public key is sent to the server with your username to create your account.</p>
    </div>
    
    <div className="warning">
      <h2>Important</h2>
      <strong>If you clear your browser's local storage or use a different browser or device, you will lose access to your account.</strong>
      <br />
      Make sure to back up your private key if you want to access your account from another device or after clearing your browser data.
    </div>
    
    <div className="content-section">
      <p>You can download your private key after completing the registration process.</p>
      
      <p>By clicking "Next", you acknowledge that you understand the implications of using PGP keys for authentication and the importance of safeguarding your private key.</p>
    </div>
    
    <Button variant="accent" width="full" onClick={onNext}>Next</Button>
  </div>
)

const SecondStep = ({ onNext, onBack, data, setData }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(null);
  
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
    setIsAvailable(null);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    if (value.length >= 3) {
      debounceRef[1](setTimeout(async () => {
        const available = await isUsernameAvailable(value);
        setIsAvailable(available);
      }, 500)); // 500ms debounce
    }
  };

  const handleBlur = async () => {
    if (username.length >= 3) {
      const available = await isUsernameAvailable(username);
      setIsAvailable(available);
    }
  };

  // TODO: Fix alerts to use better UI feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.length < 3) {
      alert('Username must be at least 3 characters long.');
      return;
    }
    setLoading(true);
    const available = await isUsernameAvailable(username);
    setIsAvailable(available);
    if (!available) {
      alert('Username is already taken.');
      setLoading(false);
      return;
    }

    setData({...data, username});

    if (onNext) onNext();
  }

  return (
    <div className="container">
      <h1 className="title">Choose Username</h1>
      <p className="subtitle">Enter your desired username</p>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className='form-group'>
          <input 
            type="text" 
            value={username}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter username"
            className={`input ${isAvailable === null ? '' : isAvailable ? 'input-success' : 'input-error'} ${username.length > 0 && username.length < 3 ? 'input-incorrect' : ''}`}
            required
            pattern='^[a-zA-Z_-]{3,20}$'
          />
          <Button variant="accent" width="full" type="submit">Continue</Button>
          <span>Keys will be generated in the next step.</span>
        </form>
      )}
    </div>
  )
}

function ThirdStep({ onBack, data, setData }) {
  const [generating, setGenerating] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    setGenerating(true);

    if (!data.username) {
      alert('Username is missing. Please go back and enter a username.');
      if (onBack) onBack();
      return;
    }

    generateUserKey(data.username).then(({ publicKey, privateKey }) => {
      setData({ ...data, publicKey, privateKey });
      fnSaveKeyToLocalStorage(data.username, privateKey);
      setGenerating(false);
      apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: data.username, pk: publicKey })
      }).catch(err => {
        console.error('Error registering user:', err);
        alert('There was an error registering your account. Please try again.');
        if (onBack) onBack();
      });
    });

    // Show skip after 10 seconds
    const skipTimer = setTimeout(() => setShowSkip(true), 10000);
    return () => clearTimeout(skipTimer);
  }, []);

  const handleDownload = () => {
    const template = `# IN2SIDER PRIVATE KEY\n# DANGER! PLAIN TEXT FORMAT | PROTECT THIS FILE!!\n: ${data.username}\n${data.privateKey}\n# Keep this file safe and do not share it with anyone.\n`;
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'in2sider-key-' + data.username + '.txt';
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const goToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className='container'>
      <h1 className="title">Final step</h1>
      <p className="subtitle">Your account keys are being generated. Please wait...</p>
      <div style={{ marginTop: '32px' }}>
        {generating ? (
          <span>🔑 Generating keys...</span>
        ) : (
          <>
            <span style={{ fontWeight: 'bold', color: '#2ecc40' }}>✔️ Keys generated successfully!</span>
            <div style={{ margin: '16px 0' }}>
              <Button variant="accent" width="auto" onClick={handleDownload}>Download Private Key</Button>
            </div>
            <small style={{ color: '#888', display: 'block', marginBottom: '12px' }}>
              Your private key is stored securely in your browser (localStorage).<br />
              <span style={{ color: '#e67e22' }}>Warning: If you lose your private key, you will lose access to your account.</span>
            </small>
            {(downloaded || showSkip) && (
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', width: 'fit-content' }} className='mx-auto space-y-2'>
                <Button variant="ghost" width="auto" onClick={goToLogin}>
                  Go to Login
                </Button>
                <small style={{ color: '#888', marginLeft: '8px' }}>
                  {downloaded ? 'You can now log in.' : 'Skip and go to login (not recommended)'}
                </small>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RegisterPage() {
  const [step, setStep] = useState(0);
  const [registerData, setRegisterData] = useState({username: '', publicKey: '', privateKey: ''});

  const stepAssignment = [
    <FirstStep onNext={() => setStep(1)} />,
    <SecondStep onNext={() => setStep(2)} onBack={() => setStep(0)} data={registerData} setData={setRegisterData} />,
    <ThirdStep onBack={() => setStep(1)} data={registerData} setData={setRegisterData} />
  ]

  return (
    <div>
      <div className='button-group-horizontal' style={{ marginBottom: '24px' }}>
        <Button variant="ghost" size="small" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          ← Previous
        </Button>
      </div>
      {stepAssignment[step]}
    </div>
  )
}

export default RegisterPage;