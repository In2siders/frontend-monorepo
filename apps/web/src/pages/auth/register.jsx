import { useEffect, useState } from 'react'
import { generateUserKey } from '@repo/connection/utils/userRegistration'
import { Button } from '@repo/components/button'
import { Card } from '@repo/components/card'

const FirstStep = ({ onNext }) => (
  <div className='max-w-lg mx-auto border border-white bg-slate-800 p-8 rounded-md text-gray-300'>
    <h2>Read before continue</h2>
    <div className='mb-4 text-sm space-y-2'>
      <p>This application uses PGP keys for authentication.</p>
      
      <p>
      Both keys, public and private are generated in your browser and the private key is stored in your browser's local storage.
      The public key is sent to the server with your username to create your account.
      </p>
      
      <p className='bg-red-600/60 text-white p-2 rounded border border-black my-6'>
      <strong>Important:</strong> If you clear your browser's local storage or use a different browser or device, you will lose access to your account.
      Make sure to back up your private key if you want to access your account from another device or after clearing your browser data.
      </p>
      <p>
      We are working on a feature to allow you to export your private key for backup purposes.
      </p>
      <p>
      By clicking "Next", you acknowledge that you understand the implications of using PGP keys for authentication and the importance of safeguarding your private key.
      </p>
    </div>
    <Button onClick={onNext}>Next</Button>
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
    <Card className='max-w-lg mx-auto bg-white/80 border border-white p-8 rounded-md text-gray-300'>
      <h2>Create your account</h2>
      {loading ? (<p>Loading...</p>) : (
        <form onSubmit={processUserRegistration}>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button type="submit">Register</button>
        </form>
      )}
    </Card>
  )
}

function RegisterPage() {
  const [step, setStep] = useState(0);

  const stepAssignment = [
    <FirstStep onNext={() => setStep(1)} />,
    <SecondStep onNext={() => setStep(2)} onBack={() => setStep(0)} />
  ]

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <div className='flex justify-between mb-4 space-x-12'>
        <Button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} >
          {'<'}
        </Button>
        <Button onClick={() => setStep(Math.min(step + 1, stepAssignment.length - 1))} disabled={step === stepAssignment.length - 1}>
          {'>'}
        </Button>
      </div>
      {stepAssignment[step]}
    </div>
  )
}

export default RegisterPage;