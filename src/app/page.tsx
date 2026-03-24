import Link from 'next/link'
import Image from 'next/image'
import { Shield, FileCheck, QrCode, Car, ChevronRight, CheckCircle, Wrench, ClipboardList, Search, Users, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-surface-dark/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo-isologo.png" alt="AutoTrack 360°" width={36} height={36} className="rounded-lg" />
              <span className="text-xl font-bold text-white">AutoTrack <span className="text-accent">360°</span></span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-slate-400 hover:text-white font-medium transition-colors"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="btn-accent text-sm px-4 py-2"
              >
                Registrarse
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              La Historia Clínica
              <span className="block text-gradient">Vehicular</span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              La plataforma que conecta propietarios, talleres y compradores
              con un historial de mantenimiento <span className="text-white font-medium">verificable e inmutable</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-accent text-lg">
                Soy propietario
                <ChevronRight className="inline-block ml-2 h-5 w-5" />
              </Link>
              <Link href="/talleres/registro" className="btn-outline-premium text-lg">
                Soy taller
                <ChevronRight className="inline-block ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 pt-12 sm:pt-16 border-t border-slate-800">
              <div>
                <div className="text-xl sm:text-3xl md:text-4xl font-bold text-accent mb-1 sm:mb-2">SHA-256</div>
                <div className="text-xs sm:text-sm text-slate-400">Hash verificable</div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">0-100</div>
                <div className="text-xs sm:text-sm text-slate-400">Trust Score</div>
              </div>
              <div>
                <div className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">QR</div>
                <div className="text-xs sm:text-sm text-slate-400">Compartir seguro</div>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona — El ecosistema */}
        <section id="como-funciona" className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Un ecosistema de confianza
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Tres actores, un objetivo: que el historial de un vehículo sea confiable
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Arrows between cards (hidden on mobile) */}
            <div className="hidden md:flex absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 z-10">
              <ArrowRight className="h-8 w-8 text-accent/40" />
            </div>
            <div className="hidden md:flex absolute top-1/2 left-2/3 -translate-y-1/2 -translate-x-1/2 z-10">
              <ArrowRight className="h-8 w-8 text-accent/40" />
            </div>

            <div className="card-premium-hover p-5 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                <Car className="h-8 w-8 text-accent" />
              </div>
              <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Paso 1</div>
              <h3 className="text-xl font-bold text-white mb-3">El propietario registra</h3>
              <p className="text-slate-400 leading-relaxed">
                Carga cada service, reparación y mantenimiento con fotos, facturas y evidencias selladas con hash.
              </p>
            </div>

            <div className="card-premium-hover p-5 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-trust-high/10 border border-trust-high/20 flex items-center justify-center mx-auto mb-6">
                <Wrench className="h-8 w-8 text-trust-high" />
              </div>
              <div className="text-xs font-bold text-trust-high uppercase tracking-wider mb-2">Paso 2</div>
              <h3 className="text-xl font-bold text-white mb-3">El taller verifica</h3>
              <p className="text-slate-400 leading-relaxed">
                El taller carga los trabajos que realizó con su firma digital. Nivel A de confianza, imposible de falsificar.
              </p>
            </div>

            <div className="card-premium-hover p-5 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-primary-400" />
              </div>
              <div className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-2">Paso 3</div>
              <h3 className="text-xl font-bold text-white mb-3">El comprador consulta</h3>
              <p className="text-slate-400 leading-relaxed">
                Escanea un QR o recibe un link. Ve el historial completo, el Trust Score y las evidencias verificadas.
              </p>
            </div>
          </div>
        </section>

        {/* Para Propietarios */}
        <section id="para-propietarios" className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
              <CheckCircle className="h-4 w-4" />
              Para propietarios
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Vendé tu auto con historial verificado
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Un vehículo con historial confiable vale más. Demostralo con evidencias reales.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-premium-hover p-5 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                <FileCheck className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Evidencias Verificables</h3>
              <p className="text-slate-400 leading-relaxed">
                Cada archivo se sella con hash SHA-256 y timestamp inmutable. Imposible de alterar, fácil de verificar.
              </p>
            </div>

            <div className="card-premium-hover p-5 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-trust-high/10 border border-trust-high/20 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-trust-high" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Score de Confianza</h3>
              <p className="text-slate-400 leading-relaxed">
                Un puntaje 0-100 basado en la calidad y verificación del historial. Mayor score, mayor confianza para el comprador.
              </p>
            </div>

            <div className="card-premium-hover p-5 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                <QrCode className="h-7 w-7 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Compartí con QR</h3>
              <p className="text-slate-400 leading-relaxed">
                Generá un link seguro con tiempo de expiración. El comprador ve el historial sin acceder a tu cuenta.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/register" className="btn-accent inline-flex items-center">
              Registrá tu vehículo
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Para Talleres */}
        <section id="para-talleres" className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
              <Wrench className="h-4 w-4" />
              Para talleres y mecánicas
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Digitalizá la ficha de tus clientes
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Gestioná los vehículos que atendés en un solo lugar. Sin papeles, con evidencias verificables.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card-premium-hover p-5 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                <Car className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Vehículos clientes</h3>
              <p className="text-slate-400 leading-relaxed">
                Dá de alta vehículos por patente. Si ya están en AutoTrack, los vinculás a tu lista. Si no, los creás.
              </p>
            </div>

            <div className="card-premium-hover p-5 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-trust-high/10 border border-trust-high/20 flex items-center justify-center mb-6">
                <ClipboardList className="h-7 w-7 text-trust-high" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cargá cada servicio</h3>
              <p className="text-slate-400 leading-relaxed">
                Registrá fecha, kilometraje, costo y descripción. Adjuntá fotos e informes con hash verificable.
              </p>
            </div>

            <div className="card-premium-hover p-5 sm:p-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">El dueño aprueba</h3>
              <p className="text-slate-400 leading-relaxed">
                Si el vehículo tiene dueño en la plataforma, tu evento queda pendiente hasta que lo apruebe. Transparencia total.
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/talleres/registro" className="btn-accent inline-flex items-center">
              Registrá tu taller
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Trust Levels */}
        <section className="container mx-auto px-4 py-20">
          <div className="card-premium p-5 sm:p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Niveles de Verificación
              </h2>
              <p className="text-slate-400">
                Cada evento tiene un nivel de confianza según su verificación
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-2xl bg-trust-high/5 border border-trust-high/20">
                <div className="w-16 h-16 bg-trust-high text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg shadow-trust-high/30">
                  A
                </div>
                <h4 className="font-bold text-white mb-2">Verificado por Taller</h4>
                <p className="text-sm text-slate-300">
                  Evento registrado y firmado por un taller verificado en la plataforma.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-trust-medium/5 border border-trust-medium/20">
                <div className="w-16 h-16 bg-trust-medium text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg shadow-trust-medium/30">
                  B
                </div>
                <h4 className="font-bold text-white mb-2">Con Evidencia</h4>
                <p className="text-sm text-slate-300">
                  Evento con archivos adjuntos (fotos, facturas) sellados con hash verificable.
                </p>
              </div>

              <div className="text-center p-6 rounded-2xl bg-trust-low/5 border border-trust-low/20">
                <div className="w-16 h-16 bg-trust-low text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg shadow-trust-low/30">
                  C
                </div>
                <h4 className="font-bold text-white mb-2">Declarativo</h4>
                <p className="text-sm text-slate-300">
                  Evento declarado por el propietario sin evidencia adjunta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Empezá a construir confianza
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Registrate gratis y empezá en menos de 2 minutos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-accent text-lg inline-flex items-center">
                Soy propietario
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/talleres/registro" className="btn-outline-premium text-lg inline-flex items-center">
                Soy taller
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo-isologo.png" alt="AutoTrack 360°" width={28} height={28} className="rounded-md" />
              <span className="font-bold text-white">AutoTrack <span className="text-accent">360°</span></span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2026 AutoTrack 360°. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
