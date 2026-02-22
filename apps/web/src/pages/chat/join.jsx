import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import toast from 'react-hot-toast'
import { apiFetch } from '@repo/connection/utils/api'
import {
  decryptTextWithPassword,
  encryptSymmetricKey,
  getPrivateKey,
  rememberChatHybridKey,
  saveEncryptedChatHybridKey,
} from '@repo/connection/utils/userAuthentication'
import { useAuth } from '../../hooks/useAuth'

export const JoinInvitePage = () => {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const inviteTransportKey = useMemo(() => {
    const hash = window.location.hash || ''
    return decodeURIComponent(hash.replace(/^#\//, '').trim())
  }, [])

  useEffect(() => {
    if (!inviteCode || !auth?.user?.username || done) return

    const joinWithInvite = async () => {
      if (!inviteTransportKey) {
        toast.error('Invite transport key is missing from this URL.')
        return
      }

      setLoading(true)
      try {
        const inviteData = await apiFetch(`/groups/invite/${inviteCode}`, { method: 'GET' })
        if (!inviteData?.success || !inviteData?.data?.encryptedGroupKey || !inviteData?.data?.groupId) {
          toast.error(inviteData?.error || 'Invite code is invalid or expired.')
          return
        }

        const plainChatHybridKey = await decryptTextWithPassword(
          inviteData.data.encryptedGroupKey,
          inviteTransportKey,
        )

        const privateKey = await getPrivateKey(auth.user.username)
        if (!privateKey) {
          toast.error('Private key not found in secure storage.')
          return
        }

        const encryptedForJoiner = await encryptSymmetricKey(plainChatHybridKey, privateKey)
        const joinResponse = await apiFetch('/groups/join-code', {
          method: 'POST',
          body: JSON.stringify({
            inviteCode,
            encryptedGroupKey: encryptedForJoiner,
          }),
        })

        if (!joinResponse?.success) {
          toast.error(joinResponse?.error || 'Failed to join this group invite.')
          return
        }

        await saveEncryptedChatHybridKey(inviteData.data.groupId, encryptedForJoiner)
        rememberChatHybridKey(inviteData.data.groupId, plainChatHybridKey)
        window.dispatchEvent(new Event('groups:refresh'))
        setDone(true)
        toast.success('You joined the group securely.')
        navigate(`/chat/${inviteData.data.groupId}`)
      } catch (err) {
        console.error('Join invite failed:', err)
        toast.error('Could not join this invite right now.')
      } finally {
        setLoading(false)
      }
    }

    joinWithInvite()
  }, [auth, done, inviteCode, inviteTransportKey, navigate])

  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <div className="w-full max-w-xl flex flex-col gap-4 p-6 rounded-xl border border-white/10 bg-white/5 text-center">
        <h1 className="text-2xl font-semibold text-white">Joining Group</h1>
        <p className="text-sm text-white/60">Invite code: <span className="font-mono text-white/80">{inviteCode || 'missing'}</span></p>
        <p className="text-sm text-white/60">{loading ? 'Verifying invite and decrypting secure chat key...' : done ? 'Done, redirecting...' : 'Preparing secure join flow...'}</p>
      </div>
    </div>
  )
}
