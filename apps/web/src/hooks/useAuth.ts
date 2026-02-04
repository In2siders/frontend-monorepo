import AuthContext from "../providers/AuthProvider"

export const useAuth = () => {
  if (!AuthContext) {
    throw new Error("useAuth must be used inside an AuthProvider")
  }
  return AuthContext
}
