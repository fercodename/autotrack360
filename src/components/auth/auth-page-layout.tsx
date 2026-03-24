import Link from 'next/link'
import Image from 'next/image'

type AuthVariant = 'propietario' | 'taller'

interface AuthPageLayoutProps {
  children: React.ReactNode
  variant: AuthVariant
}

export function AuthPageLayout({ children, variant }: AuthPageLayoutProps) {
  const isTaller = variant === 'taller'
  const homeHref = isTaller ? '/talleres' : '/'
  const otherLabel = isTaller ? 'Soy propietario' : 'Soy taller'
  const otherHref = isTaller ? '/' : '/talleres'

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-2 w-fit">
          <Image src="/logo-isologo.png" alt="AutoTrack 360°" width={36} height={36} className="rounded-xl shadow-lg shadow-accent/20" />
          <span className="text-xl font-bold text-white">AutoTrack <span className="text-accent">360°</span></span>
        </Link>
        <Link href={otherHref} className="text-sm text-slate-400 hover:text-white transition-colors">
          {otherLabel}
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-slate-400">
        © 2026 AutoTrack 360°
      </footer>
    </div>
  )
}
