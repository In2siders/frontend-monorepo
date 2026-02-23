import "@repo/common/style.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, healthCheck } from "@repo/connection/utils/api";
import {
  generateUserKey,
  compress,
  decompress,
  savePrivateKeyToIndexedDB,
} from "@repo/connection/utils/userAuthentication";
import { Button } from "@repo/components/button";
import { motion } from "motion/react";
import toast from "react-hot-toast";

/* Save user key to localStorage */
const fnSaveKeyToLocalStorage = (u, key) => {
  const compressedStorage = localStorage.getItem("upk");
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
    console.warn(
      `Warning: Overwriting existing key for user ${u} in localStorage.`,
    );
  }

  upkJson[u] = key;

  // Guarda como string comprimido
  const compressed = compress(JSON.stringify(upkJson));
  localStorage.setItem("upk", compressed);
};

const FirstStep = ({ signalReady }) => (
  <div className="flex flex-col items-center gap-2">
    <h1 className="title">Create Account</h1>
    <p className="subtitle text-red-500 ">
      {" "}
      This application uses PGP keys for authentication.
    </p>

    <div className="flex flex-col gap-2">
      <p>
        Both keys, public and private are generated in your browser and the
        private key is stored in your browser's local storage. The public key is
        sent to the server with your username to create your account.
      </p>
    </div>

    <div className="warning">
      <h2>Important</h2>
      <strong>
        If you clear your browser's local storage or use a different browser or
        device, you will lose access to your account.
      </strong>
      <p>
        Make sure to back up your private key if you want to access your account
        from another device or after clearing your browser data.
      </p>
    </div>

    <div className="flex flex-col gap-2">
      <p>
        You can download your private key after completing the registration
        process.
      </p>

      <p>
        By clicking "Select username", you acknowledge that you understand the
        implications of using PGP keys for authentication and the importance of
        safeguarding your private key.
      </p>
    </div>

    <div className="understand mt-4">
      <label className="risk-checkbox-required flex flex-row items-center gap-2">
        <input
          type="checkbox"
          onChange={(e) => {
            if (e.target.checked) {
              signalReady();
            } else {
              signalReady(false);
            }
          }}
        />{" "}
        I understand my private key must be kept safe and that losing it means
        losing access to my account.
      </label>
    </div>
  </div>
);

const SecondStep = ({ data, setData, signalReady }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(null);

  const setAvailableUsername = (itIs) => {
    setIsAvailable(itIs);
    if (itIs) {
      setData({ ...data, username });
    }
    signalReady(!!itIs);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const isUsernameAvailable = async (toCheck) => {
    const apiData = await apiFetch(`/auth/check?username=${toCheck}`, {
      method: "GET",
    });
    return apiData.available;
  };

  const debounceRef = useState(null);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\s/g, "").replace(/[^a-zA-Z_-]/g, ""); // Remove spaces and disallowed characters
    setUsername(value);
    setAvailableUsername(null);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    if (value.length >= 3) {
      debounceRef[1](
        setTimeout(async () => {
          const available = await isUsernameAvailable(value);
          setAvailableUsername(available);
        }, 500),
      );
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
      <h1 className="title">Choose Username</h1>
      <p className="subtitle">Enter your desired username</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col gap-5 w-full text-center">
          <input
            type="text"
            value={username}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter username"
            className={`input text-center p-5 ${isAvailable === null ? "" : isAvailable ? "input-success" : "input-error"} ${username.length > 0 && username.length < 3 ? "input-incorrect" : ""}`}
            required
            pattern="^[a-zA-Z_-]{3,20}$"
          />
          <span>Keys will be generated in the next step.</span>
        </div>
      )}
    </>
  );
};

const KEY_GENERATION_CONFIG = {
  minKeysRequired: 3,
  selectionThreshold: 25,
  progressInterval: 145,
  progressIncrement: { min: 1, max: 4 },
};

function useKeyPoolGeneration(username, onKeySelected, onError) {
  const keysPoolRef = useRef([]);
  const [keysGenerated, setKeysGenerated] = useState(0);
  const [selectedKey, setSelectedKey] = useState(null);
  const isCancelledRef = useRef(false);

  const selectRandomKey = useCallback(() => {
    const pool = keysPoolRef.current;
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const generateKeysInBackground = useCallback(async () => {
    isCancelledRef.current = false;
    keysPoolRef.current = [];
    setKeysGenerated(0);
    setSelectedKey(null);

    const generateSingleKey = async () => {
      if (isCancelledRef.current) return null;
      try {
        return await generateUserKey(username);
      } catch (err) {
        console.error("Key generation error:", err);
        return null;
      }
    };

    const maxAttempts = 10;
    let attempts = 0;

    while (!isCancelledRef.current && attempts < maxAttempts) {
      const keyPair = await generateSingleKey();
      if (keyPair && !isCancelledRef.current) {
        keysPoolRef.current.push(keyPair);
        setKeysGenerated(keysPoolRef.current.length);
      }
      attempts++;
    }
  }, [username]);

  const handleSelection = useCallback(
    (progress) => {
      if (selectedKey) return selectedKey;
      if (progress < KEY_GENERATION_CONFIG.selectionThreshold) return null;
      if (keysPoolRef.current.length === 0) return null;

      const chosen = selectRandomKey();
      if (chosen) {
        setSelectedKey(chosen);
        onKeySelected?.(chosen);
      }
      return chosen;
    },
    [selectedKey, selectRandomKey, onKeySelected],
  );

  const cancel = useCallback(() => {
    isCancelledRef.current = true;
  }, []);

  return {
    keysGenerated,
    selectedKey,
    generateKeysInBackground,
    handleSelection,
    cancel,
    getPoolSize: () => keysPoolRef.current.length,
  };
}

function KeyGenerationProgress({ progress, keysGenerated, error }) {
  const isComplete = progress === 100 && !error;
  const color = error ? "#f44336" : isComplete ? "#2ecc40" : "#6366f1";

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-full flex flex-col gap-2">
        <div
          className="w-full h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-sm text-white/60">
          <span>{progress}%</span>
          <span>{keysGenerated} keys generated</span>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ progress, error, keysGenerated }) {
  if (error) {
    return (
      <div className="text-center text-red-400">
        <p className="font-semibold">Registration failed</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (progress === 100) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-4xl mb-2"
        >
          &#10003;
        </motion.div>
        <p className="text-green-400 font-semibold">Registration complete!</p>
        <p className="text-sm text-white/60 mt-1">
          {keysGenerated} keys were generated, one was randomly selected
        </p>
      </div>
    );
  }

  const getPhase = () => {
    if (progress < 25)
      return {
        icon: "&#128273;",
        text: "Initializing secure key generation...",
      };
    if (progress < 50)
      return { icon: "&#128274;", text: "Generating cryptographic keys..." };
    if (progress < 75)
      return { icon: "&#128272;", text: "Selecting random key from pool..." };
    return { icon: "&#9989;", text: "Finalizing registration..." };
  };

  const phase = getPhase();

  return (
    <div className="text-center">
      <p
        className="text-white/80"
        dangerouslySetInnerHTML={{ __html: `${phase.icon} ${phase.text}` }}
      />
    </div>
  );
}

function ThirdStep({ onBack, data, setData, signalReady }) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const selectedKeyRef = useRef(null);

  const handleKeySelected = useCallback((keyPair) => {
    selectedKeyRef.current = keyPair;
  }, []);

  const { keysGenerated, generateKeysInBackground, handleSelection, cancel } =
    useKeyPoolGeneration(data.username, handleKeySelected);

  useEffect(() => {
    let currentProgress = 0;
    let progressInterval = null;

    progressInterval = setInterval(() => {
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
        return;
      }

      const increment =
        Math.floor(
          Math.random() *
            (KEY_GENERATION_CONFIG.progressIncrement.max -
              KEY_GENERATION_CONFIG.progressIncrement.min +
              1),
        ) + KEY_GENERATION_CONFIG.progressIncrement.min;

      currentProgress = Math.min(currentProgress + increment, 100);
      setProgress(currentProgress);

      handleSelection(currentProgress);
    }, KEY_GENERATION_CONFIG.progressInterval);

    generateKeysInBackground();

    const completeRegistration = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));

        let attempts = 0;
        while (!selectedKeyRef.current && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          handleSelection(Math.min(currentProgress + attempts * 2, 100));
          attempts++;
        }

        if (!selectedKeyRef.current) {
          const fallbackKey = await generateUserKey(data.username);
          selectedKeyRef.current = fallbackKey;
        }

        const { publicKey, privateKey } = selectedKeyRef.current;
        setData({ ...data, publicKey, privateKey });
        fnSaveKeyToLocalStorage(data.username, privateKey);
        await savePrivateKeyToIndexedDB(data.username, privateKey);

        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({ username: data.username, pk: publicKey }),
        });

        setRegistrationComplete(true);
      } catch (err) {
        console.error("Registration error:", err);
        setError(err.message || "Unknown error");
        cancel();
        if (progressInterval) clearInterval(progressInterval);
      }
    };

    completeRegistration();

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      cancel();
    };
  }, []);

  useEffect(() => {
    if (progress !== 100 || error || !registrationComplete) return;

    const timeout = setTimeout(() => {
      signalReady();
    }, 350);

    return () => clearTimeout(timeout);
  }, [error, progress, registrationComplete]);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center">
        <h1 className="title text-2xl mb-2">Almost done!</h1>
        <p className="text-white/60 text-sm">Creating your secure account</p>
      </div>

      <StatusMessage
        progress={progress}
        error={error}
        keysGenerated={keysGenerated}
      />

      <KeyGenerationProgress
        progress={progress}
        keysGenerated={keysGenerated}
        error={error}
      />

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 w-full">
          <p className="text-red-400 text-sm text-center">
            An error occurred: {error}
          </p>
        </div>
      )}
    </div>
  );
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
    const text_content =
      `\n# IN2SIDERS PRIVATE KEY DOWNLOAD\n# ===========================\n# PROTECT THIS FILE AS IT CONTAINS YOUR PRIVATE KEY.\n# IF YOU LOSE IT, YOU WILL LOSE ACCESS TO YOUR ACCOUNT.\n; u=${data.username}\n; pub=${compress(data.publicKey)}\n; priv=${compress(data.privateKey)}\n; exported_at=${new Date().toISOString()}\n; instance_id=${crypto.randomUUID()}\n# ===========================\n# You should never share this file with anyone.\n# ===========================\n# To import this key back into your browser, go to the login page and use the "Login with file" option.\n# Ensure you are uploading this file to a trusted instance of the application.\n# For your safety, you exported this key from ${window.location.origin}\n# And therefore, you should only import it back into the same origin.\n# ===========================`.trim();

    const blob = new Blob([text_content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `in2siders_${data.username}_export_${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCanLogin(true);
  };

  /* Login redirect handle */
  const handleProceedToLogin = () => {
    if (!canLogin) return;
    window.location.href = "/auth/login";
  };

  return (
    <>
      <div className="flex flex-col gap- w-full text-center">
        <h1 className="title">Registration Successful!</h1>
        <p className="subtitle">Your account has been created successfully.</p>

        <div className="content-section flex flex-col gap-4">
          <p>
            Your private key has been saved to your browser's local storage. For
            security reasons, it is highly recommended to download a backup of
            your private key.
          </p>
          <p>
            If you lose access to your browser's local storage (e.g., clearing
            browser data, using a different device), you will not be able to
            access your account without the private key.
          </p>
        </div>

        <div>
          <Button onClick={handleDownloadKey} className="mx-auto my-6">
            Download Private Key
          </Button>
          <br />
          <span className="text-sm text-gray-400">
            Make sure to store it in a safe place.
          </span>
        </div>
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {canLogin ? (
            <Button
              onClick={handleProceedToLogin}
              className="mx-auto mb-4"
              variant="ghost"
              disabled={!canLogin}
            >
              Proceed to Login
            </Button>
          ) : (
            <>
              <Button disabled className="mx-auto mb-4" variant="ghost">
                Proceed to Login
              </Button>
              <p>
                You should download your private key before proceeding. If you
                don't want, the button will become available after 10 seconds.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function RegisterPage() {
  const [step, setStep] = useState(0);
  const [registerData, setRegisterData] = useState({
    username: "",
    publicKey: "",
    privateKey: "",
  });
  const [canContinue, setCanContinue] = useState(false);
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      toast.promise(() => healthCheck(), {
        loading: "Checking server status...",
        success: (serverOnline) => {
          setServerReady(serverOnline);
          if (!serverOnline) {
            return "Server is offline. Please try again later.";
          }
          return "Server check successful!";
        },
        error: "Cannot connect to the server. Please try again later.",
      });
    };
    checkServer();
  }, []);

  const proceedToNextStep = () => {
    if (!canContinue) return;
    if (!serverReady) {
      toast.error(
        "We are experiencing connectivity issues. Please try again later.",
      );
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
  };

  const stepAssignment = [
    {
      element: <FirstStep signalReady={(v = true) => setCanContinue(v)} />,
      outside: null,
      button: (
        <Button variant="ghost" size="small" asChild>
          <a href="/">Back</a>
        </Button>
      ),
      continueText: "Select username",
      scrollNeeded: true,
    },
    {
      element: (
        <SecondStep
          data={registerData}
          setData={setRegisterData}
          signalReady={(v = true) => setCanContinue(v)}
        />
      ),
      outside: null,
      button: (
        <Button variant="ghost" size="small" onClick={() => setStep(0)}>
          Previous
        </Button>
      ),
      continueText: "Select username and generate keys",
      checkFn: async () => {
        if (registerData.username.length < 3) {
          toast.error("Username must be at least 3 characters long.");
          return false;
        }

        const available = await apiFetch(
          `/auth/check?username=${registerData.username}`,
          {
            method: "GET",
          },
        );
        if (!available) {
          toast.error("Username is already taken.");
          return false;
        }

        return true;
      },
    },
    {
      element: (
        <ThirdStep
          data={registerData}
          setData={setRegisterData}
          signalReady={(v = true) => setCanContinue(v)}
        />
      ),
      outside: null,
      button: (
        <Button variant="ghost" size="small" onClick={() => setStep(1)}>
          Previous
        </Button>
      ),
      continueText: "Continue to Final Step",
    },
    {
      element: (
        <FinalStep
          data={registerData}
          setData={setRegisterData}
          signalReady={(_any) => {
            setCanContinue(false);
          }}
        />
      ),
      outside: null,
      button: (
        <Button
          variant="ghost"
          size="small"
          onClick={() => toast.info("You can't go back from here.")}
        >
          Previous
        </Button>
      ),
      continueText: "No more steps",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col items-center"
    >
      <div className="mb-4">{stepAssignment[step].button}</div>
      <div
        className={
          "container shadow" +
          (stepAssignment[step].scrollNeeded ? "scroll-needed shadow" : "")
        }
        data-container-pref="auth_register"
      >
        {stepAssignment[step].element}
      </div>

      {step < stepAssignment.length - 1 ? (
        <Button
          onClick={proceedToNextStep}
          disabled={!canContinue}
          variant="ghost"
          className="mt-4"
        >
          {stepAssignment[step].continueText}
        </Button>
      ) : null}
    </motion.div>
  );
}

export default RegisterPage;
