import { redirect } from 'next/navigation'

/** Ruta deprecada — redirige al login único */
export default function DeprecatedTallerLogin() {
  redirect('/login')
}
