'use client'

import { useRouter } from 'next/navigation'

const LABELS = { bs: 'BS', en: 'EN' }

export default function LangSwitcher({ current }: { current: string }) {
  const router = useRouter()

  function switchLang(lang: string) {
    document.cookie = `locale=${lang};path=/;max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      {Object.entries(LABELS).map(([lang, label]) => (
        <button
          key={lang}
          onClick={() => switchLang(lang)}
          className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
            current === lang
              ? 'bg-[var(--brand-pale)] text-[var(--brand)]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
