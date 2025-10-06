import { useEffect, useState } from 'react'
import { generateUserKey } from '@repo/connection/utils/userRegistration'
import { Button } from '@repo/components/button'
import { Card } from '@repo/components/card'
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
  useEffect(() => {
    setLoading(false);
  }, []);

  const setProtectedUsername = (unsafeUsername) => {
    // only allow a-z A-Z 0-9 _ - .
    const regex = /^[a-zA-Z0-9_.]*$/;
    if (regex.test(unsafeUsername)) {
      const randomNumSuffix = Math.floor(Math.random() * (999 - 1 + 1)) + 1; // We generate a random number between 001 and 999 (1 as identifier for the random suffix)
      return unsafeUsername + '-' + randomNumSuffix;
    }

    throw new Error('Invalid username. Only a-z A-Z 0-9 _ - . are allowed.');
  }

  const processUserRegistration = async (e) => {
    e.preventDefault();
    const secureUsername = setProtectedUsername(username);
    const { privateKey, publicKey } = await generateUserKey(secureUsername);
    console.log({ privateKey, publicKey, username: secureUsername });
    if (window.localStorage) {
      const oldKeys = window.localStorage.getItem(`upk`); // json { 'username': 'privateKey' } base64 encoded
      let keys = {};
      if (oldKeys) {
        const parsedOldKeys = JSON.parse(atob(oldKeys));
        keys = { ...parsedOldKeys };
      }
      keys[secureUsername] = privateKey;
      window.localStorage.setItem(`upk`, btoa(JSON.stringify(keys)));

      // TODO: Send data to server.
    }
  }

  return (
    <div className="container">
      <h1 className="title">Choose Username</h1>
      <p className="subtitle">Enter your desired username</p>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={processUserRegistration} className="form-group">
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="input"
            required
          />
          <Button variant="accent" width="full" type="submit">Register</Button>
        </form>
      )}
    </div>
  )
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