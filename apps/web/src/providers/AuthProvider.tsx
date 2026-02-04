import { apiFetch, setAuthToken } from "@repo/connection/utils/api";
import { getFromStorage, solveChallenge } from "@repo/connection/utils/userAuthentication";
import { createContext, useEffect, useState, useContext } from "react"

type Session = { token: string }
type User = { id: string; username: string; bio?: string }

type AuthState = {
  isAuthenticated: boolean
  session?: Session
  user?: User
}

interface AuthContextInterface {
  auth: AuthState
  login: (username: string, privateKey: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextInterface | null>(null)

type AuthProviderProps = {
  children: React.ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false })

  useEffect(() => {
    let mounted = true
    const init = async () => {
      setLoading(true)
      try {
        const jsonResponse = await apiFetch("/session/me", { method: "GET" })
        if (jsonResponse && typeof jsonResponse === "object" && "user" in jsonResponse && typeof jsonResponse.user === "object" && jsonResponse.user !== null) { // damn, this is a lot of checks huh
          if (!mounted) return
          const token = jsonResponse.data?.session || jsonResponse.session || jsonResponse.token || null
          if (token) setAuthToken(token)
          setAuth({
            isAuthenticated: true,
            session: token ? { token } : undefined,
            user: {
              id: jsonResponse.user.userId,
              username: jsonResponse.user.username,
              bio: jsonResponse.user.bio || undefined,
            }
          })
        } else {
          setAuth({ isAuthenticated: false })
        }
      } catch (e) {
        console.error("Auth init error", e)
        setError("Failed to validate session")
        setAuthToken(null)
        if (mounted) setAuth({ isAuthenticated: false })
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()
    return () => { mounted = false }
  }, [])

  const login = async (username: string, privateKey: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const plainPrivate = privateKey || getFromStorage(username)

      const challengeResponse = await apiFetch('/auth/challenge', {
        method: 'POST',
        body: JSON.stringify({ username }),
      })

      if (!challengeResponse || !challengeResponse.challengeId || !challengeResponse.challenge) {
        setError('Failed to get challenge from server.')
        return false
      }

      const solvedChallenge = await solveChallenge(challengeResponse.challenge, plainPrivate)

      const solutionResponse = await apiFetch('/auth/challenge/verify', {
        method: 'POST',
        body: JSON.stringify({ challengeId: challengeResponse.challengeId, solution: solvedChallenge })
      })

      if (solutionResponse && solutionResponse.message && solutionResponse.data && solutionResponse.data.session) {
        const token = solutionResponse.data.session
        setAuthToken(token)

        const userObj = solutionResponse.data.user || solutionResponse.user || null
        setAuth({
          isAuthenticated: true,
          session: { token },
          user: userObj ? { id: userObj.userId || userObj.id, username: userObj.username, bio: userObj.bio || undefined } : undefined,
        })

        return true
      }

      setError('Login failed. Please check your credentials.')
      return false
    } catch (e) {
      console.error("Login error", e)
      setError(e?.message || "Login failed")
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await apiFetch("/auth/logout", { method: "POST" })
    } catch (e) {
      console.error("Logout error", e)
      // proceed to clear client side state even on error
    } finally {
      setAuthToken(null)
      setAuth({ isAuthenticated: false })
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ loading, error, auth, login, logout }}>{children}</AuthContext.Provider>
}

export default AuthContext
