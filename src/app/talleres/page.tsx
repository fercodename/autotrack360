import { redirect } from 'next/navigation'

/** Redirige a la sección de talleres en la landing unificada */
export default function TalleresLandingRedirect() {
  redirect('/#para-talleres')
}
