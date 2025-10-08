import { useEffect, useState } from 'react'
import { apiFetch } from '@repo/connection/utils/api'
import { generateUserKey } from '@repo/connection/utils/userRegistration'
import { Button } from '@repo/components/button'
import '@repo/common/style.css'

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
      <p>We are working on a feature to allow you to export your private key for backup purposes.</p>
      
      <p>By clicking "Next", you acknowledge that you understand the implications of using PGP keys for authentication and the importance of safeguarding your private key.</p>
    </div>
    
    <Button variant="accent" width="full" onClick={onNext}>Next</Button>
  </div>
)

const SecondStep = ({ onNext, onBack }) => {
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

  // Debounced check
  const handleChange = (e) => {
    const value = e.target.value;
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

  // Manual check on blur
  const handleBlur = async () => {
    if (username.length >= 3) {
      const available = await isUsernameAvailable(username);
      setIsAvailable(available);
    }
  };

  // Manual check on submit
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
          />
          <Button variant="accent" width="full" type="submit">Register</Button>
        </form>
      )}
    </div>
  )
}

function ThirdStep({ onBack }) {
  const [generating, setGenerating] = useState(true);
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    generateUserKey()

    const timer = setTimeout(() => {
      setGenerating(false);
      // Simulate fetching private key from localStorage
      const key = localStorage.getItem('privateKey') || 'MIIBVwIBADANBgkqh...';
      setPrivateKey(key);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    const blob = new Blob([privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'in2sider-private-key.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='container'>
      <h1 className="title">Finalizando registro...</h1>
      <p className="subtitle">Por favor espera mientras generamos tus claves.</p>
      <div style={{ marginTop: '32px' }}>
        {generating ? (
          <span>🔑 Generando claves...</span>
        ) : (
          <>
            <span style={{ fontWeight: 'bold', color: '#2ecc40' }}>✔️ Claves generadas</span>
            <div style={{ margin: '16px 0' }}>
              <Button variant="accent" width="auto" onClick={handleDownload}>Descargar llave privada</Button>
            </div>
            <small style={{ color: '#888' }}>
              La llave privada está guardada en tu navegador (localStorage).
            </small>
          </>
        )}
      </div>
    </div>
  );
}

function RegisterPage() {
  const [step, setStep] = useState(0);

  const stepAssignment = [
    <FirstStep onNext={() => setStep(1)} />,
    <SecondStep onNext={() => setStep(2)} onBack={() => setStep(0)} />
  ]

  return (
    <div>
      <div className='button-group-horizontal' style={{ marginBottom: '24px' }}>
        <Button variant="ghost" size="small" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          ← Previous
        </Button>
        <Button variant="ghost" size="small" onClick={() => setStep(Math.min(step + 1, stepAssignment.length - 1))} disabled={step === stepAssignment.length - 1}>
          Next →
        </Button>
      </div>
      {stepAssignment[step]}
    </div>
  )
}

export default RegisterPage;