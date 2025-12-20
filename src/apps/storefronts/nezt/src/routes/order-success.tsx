import { createFileRoute, Link } from '@tanstack/react-router'
import { Image } from '@/components/ui/image'

export const Route = createFileRoute('/order-success')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-[#EAEAEA] px-4'>
      <div className='max-w-md w-full text-center space-y-6'>
        <div className='flex justify-center mb-6'>
          <Image src="/logo.svg" className="h-[40px]" />
        </div>
        
        <div className='space-y-4'>
          <div className='text-6xl mb-4'>✓</div>
          <h1 className='text-3xl font-bold uppercase text-primary'>
            Commande Envoyée
          </h1>
          <p className='text-lg font-semibold text-gray-700'>
            Votre commande a été envoyée avec succès !
          </p>
        </div>

        <div className='bg-white rounded-lg p-6 space-y-4 border border-gray-200'>
          <p className='text-base text-gray-800'>
            Nous avons bien reçu votre commande et nous vous contacterons très bientôt pour confirmer tous les détails.
          </p>
          <p className='text-sm text-gray-600'>
            Merci de votre confiance !
          </p>
        </div>

        <Link
          to="/"
          className='inline-block w-full bg-primary rounded-2xl py-3 text-white font-semibold uppercase hover:bg-primary/90 transition-colors'
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
