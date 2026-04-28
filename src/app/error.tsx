'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="bs">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl font-semibold text-gray-200 mb-4">500</p>
          <h1 className="text-xl font-medium text-gray-900 mb-2">Došlo je do greške</h1>
          <p className="text-sm text-gray-500 mb-6">Pokušajte ponovo ili kontaktirajte administratora.</p>
          <button onClick={reset} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
            Pokušaj ponovo
          </button>
        </div>
      </body>
    </html>
  )
}
