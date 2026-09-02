import { AnimatePresence, motion } from 'framer-motion'
import { sectionExit } from '../../lib/motion'

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Reacciones', emojis: ['🔥', '💯', '🤯', '😱', '😂', '🤣', '😭', '🥹', '😎', '🥵', '🥶', '😡', '🤡', '💀', '👻', '😤'] },
  { label: 'Gestos', emojis: ['👍', '👎', '👏', '🙌', '🤝', '💪', '🙏', '🫡', '✌️', '🤙'] },
  { label: 'Juego', emojis: ['🎮', '🕹️', '⚔️', '🛡️', '🏆', '🥇', '👑', '🎯', '⚡', '💥', '🚀', '🍀'] },
  { label: 'Caras', emojis: ['😍', '🤩', '🥳', '😏', '🙄', '😅', '🤔', '😴', '🤐'] },
  { label: 'Otros', emojis: ['❤️', '⭐', '✨', '💰', '✅', '❌', '❗', '❓', '🐐', '🐍'] },
]

export default function EmojiPickerSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (emoji: string) => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: sectionExit }}
          onClick={onClose}
        >
          <motion.div
            className="card-glass relative flex max-h-[75vh] w-full flex-col overflow-hidden rounded-t-3xl border-white/10 sm:max-w-sm sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0, transition: sectionExit }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="font-display text-sm font-black uppercase tracking-wide text-white">
                Elegí un emoji
              </h2>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {EMOJI_GROUPS.map((group) => (
                <div key={group.label} className="mb-4 last:mb-0">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/40">{group.label}</p>
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-7">
                    {group.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onPick(emoji)}
                        className="grid aspect-square cursor-pointer place-items-center rounded-xl text-xl transition hover:bg-white/10 active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
