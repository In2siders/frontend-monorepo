import { useEffect, useState } from 'react'
import { generateUserKey } from '@repo/connection/utils/userRegistration'
import { Button } from '@repo/components/button'

const FirstStep = ({ onNext }) => (
  <div>
    <h2>Read before continue</h2>
    <p>
      This application uses PGP keys for authentication.

      Both keys, public and private are generated in your browser and the private key is stored in your browser's local storage.
      The public key is sent to the server with your username to create your account.

      <strong>Important:</strong> If you clear your browser's local storage or use a different browser or device, you will lose access to your account.
      Make sure to back up your private key if you want to access your account from another device or after clearing your browser data.
      <br />
      We are working on a feature to allow you to export your private key for backup purposes.
      <br />
      By clicking "Next", you acknowledge that you understand the implications of using PGP keys for authentication and the importance of safeguarding your private key.
    </p>
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
    const regex = /^[a-zA-Z0-9_.-]*$/;
    if (regex.test(unsafeUsername)) {
      const randomNumSuffix = Math.floor(Math.random() * (199999 - 111111 + 1)) + 111111; // We generate a random number between 111111 and 199999 (1 as identifier for the random suffix)
      return unsafeUsername + '-' + randomNumSuffix;
    }

    throw new Error('Invalid username. Only a-z A-Z 0-9 _ - . are allowed.');
  }

  const processUserRegistration = async (e) => {
    e.preventDefault();
    const { privateKey, publicKey } = await generateUserKey(setProtectedUsername(username));
    console.log({ privateKey, publicKey, username });
    if (window.localStorage) {
      const oldKeys = window.localStorage.getItem(`upk`); // json { 'username': 'privateKey' } base64 encoded
      let keys = {};
      if (oldKeys) {
        const parsedOldKeys = JSON.parse(atob(oldKeys));
        keys = { ...parsedOldKeys };
      }
      keys[username] = privateKey;
      window.localStorage.setItem(`upk`, btoa(JSON.stringify(keys)));

      // TODO: Send data to server.
    }
  }

  return (
    <div>
      <h2>Create your account</h2>
      {loading ? (<p>Loading...</p>) : (
        <form onSubmit={processUserRegistration}>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button type="submit">Register</button>
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
      {stepAssignment[step]}
    </div>
  )
}

export default RegisterPage;