import { Description, Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from '@repo/components/button'
import { apiFetch } from '@repo/connection/utils/api'
import { getPrivateKey, encryptSymmetricKey, saveEncryptedChatHybridKey } from '@repo/connection/utils/userAuthentication'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

// -- Symmetric key generation helpers --

/** Generate a single random symmetric key (256-bit hex string) */
function generateRandomSymmetricKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// -- Key generation duration (ms) --
const KEY_GEN_DURATION = 3000

// -- Sub-views --

type ModalView = 'choose' | 'join' | 'create'

function ChooseView({ onPick }: { onPick: (v: 'join' | 'create') => void }) {
  return (
    <>
      <DialogTitle className="subtitle">New Group</DialogTitle>
      <Description className="text-white/60 text-sm text-center">
        Would you like to create a new group or join an existing one?
      </Description>

      <div className="btn-group btn-group-vertical w-full" style={{ marginTop: 8 }}>
        <Button variant="ghost" onClick={() => onPick('create')}>Create a group</Button>
        <Button variant="secondary" onClick={() => onPick('join')}>Join a group</Button>
      </div>
    </>
  )
}

function JoinView({ onBack }: { onBack: () => void }) {
  return (
    <>
      <DialogTitle className="subtitle">Join a Group</DialogTitle>

      <div className="flex flex-col gap-3 text-center text-sm text-white/70">
        <p>To join a group you need an invitation link from the group owner.</p>
        <p>Ask the owner to generate an invite and send you the link. Once you receive it, simply click on it and you'll be added automatically.</p>
      </div>

      <Button variant="ghost" size="small" onClick={onBack} className="mt-2">Back</Button>
    </>
  )
}

function CreateView({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const { auth } = useAuth()

  // -- Form state --
  const [name, setName] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // -- Key generation state --
  const [keyState, setKeyState] = useState<'idle' | 'generating' | 'done'>('idle')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const keysPoolRef = useRef<string[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // -- Submission --
  const [submitting, setSubmitting] = useState(false)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // -- Key generation: produce multiple keys over KEY_GEN_DURATION, pick one randomly --
  const handleGenerateKey = useCallback(() => {
    if (keyState !== 'idle') return
    setKeyState('generating')
    keysPoolRef.current = []

    // Generate keys at a fast rate during the window
    timerRef.current = setInterval(() => {
      keysPoolRef.current.push(generateRandomSymmetricKey())
    }, 120)

    setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current)
      // Always ensure at least one key exists
      if (keysPoolRef.current.length === 0) {
        keysPoolRef.current.push(generateRandomSymmetricKey())
      }
      // Pick one at random
      const pool = keysPoolRef.current
      const chosen = pool[Math.floor(Math.random() * pool.length)]
      setGeneratedKey(chosen)
      setKeyState('done')
    }, KEY_GEN_DURATION)
  }, [keyState])

  // -- Image picker --
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Image must be under 1 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1]
      setImage(b64)
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // -- Submit --
  const handleSubmit = async () => {
    if (!name.trim() || !generatedKey || submitting) return

    setSubmitting(true)
    try {
      const username = auth?.user?.username
      if (!username) throw new Error('Session lost. Please log in again.')

      const storedKey = await getPrivateKey(username)
      if (!storedKey) throw new Error('Key not found in secure storage. Please log in again.')

      const encryptedKey = await encryptSymmetricKey(generatedKey, storedKey)

      const response = await apiFetch('/groups/create', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          encodedImage: image,
          encryptedKey,
        }),
      })

      if (response?.success) {
        const groupsResponse = await apiFetch('/groups', { method: 'GET' })
        const createdGroup = groupsResponse?.data?.find((g: any) => g.name === name.trim())
        if (createdGroup?.id) {
          await saveEncryptedChatHybridKey(createdGroup.id, encryptedKey)
        }
        window.dispatchEvent(new Event('groups:refresh'))
        toast.success('Group created successfully!')
        onClose()
      } else {
        toast.error(response?.error || 'Failed to create group.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      console.error('Group creation error:', err)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogTitle className="subtitle">Create a Group</DialogTitle>

      {/* Group name */}
      <input
        type="text"
        placeholder="Group name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="input text-center"
        maxLength={40}
      />

      {/* Group image */}
      <div className="flex flex-col items-center gap-2 w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Group preview"
            className="w-16 h-16 rounded-full object-cover cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          />
        ) : (
          <Button variant="secondary" size="small" onClick={() => fileInputRef.current?.click()}>
            Choose image
          </Button>
        )}
      </div>

      {/* Key generation */}
      <div className="flex flex-col items-center gap-2 w-full">
        {keyState === 'idle' && (
          <Button variant="accent" onClick={handleGenerateKey}>
            Generate key
          </Button>
        )}

        {keyState === 'generating' && (
          <Button variant="accent" disabled>
            Generating…
          </Button>
        )}

        {keyState === 'done' && (
          <Button variant="accent" disabled>
            Key generated ✓
          </Button>
        )}

        {/* Tooltip / info about hidden key */}
        <p className="text-xs text-white/40 text-center" style={{ maxWidth: 280 }}>
          The key is hidden for your security. Nobody - not even the server or other users - should ever see it. It is encrypted on your device before being sent.
        </p>
      </div>

      {/* Actions */}
      <div className="btn-group w-full" style={{ marginTop: 4 }}>
        <Button variant="ghost" size="small" onClick={onBack}>Back</Button>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || keyState !== 'done' || submitting}
        >
          {submitting ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </>
  )
}

// --- Main modal ---

export function NewGroupModal({ triggerClassName, children }: { triggerClassName?: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<ModalView>('choose')

  const handleClose = () => {
    setIsOpen(false)
    // Reset view when fully closed so next open starts fresh
    setTimeout(() => setView('choose'), 200)
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)}>
        {children}
      </button>
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black/50">
          <DialogPanel className="container shadow">
            {view === 'choose' && <ChooseView onPick={setView} />}
            {view === 'join' && <JoinView onBack={() => setView('choose')} />}
            {view === 'create' && <CreateView onBack={() => setView('choose')} onClose={handleClose} />}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
