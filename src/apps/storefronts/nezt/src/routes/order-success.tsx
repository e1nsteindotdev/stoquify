import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Image } from '@/components/ui/image'
import { Check } from 'lucide-react'
import { getTotal, useCartStore } from '@/lib/state'
import { useQuery } from 'convex/react'
import { api } from 'api/convex'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/order-success')({
  component: RouteComponent,
})

function RouteComponent() {
  const cart = useCartStore((state) => state.cart);
  const products = useQuery(api.products.listProducts)

  const removeProductFromCart = useCartStore((state) => state.removeProductFromCart);
  const cartArray = Array.from(cart)
  const navigate = useNavigate()

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-[#EAEAEA] px-4'>
      <div className='flex flex-col lg:max-w-[550px] justify-center w-full text-center gap-y-6'>
        <table className=''>
          <tr className='flex justify-center py-2 lg:py-4'>
            <Image src="/logo.svg" className="h-[40px]" />
          </tr>
          <tr className='flex flex-col justify-center py-4 lg:pt-8 lg:pb-8 px-2 lg:px-6'>
            <div className='flex gap-4 justify-center items-center' >
              <h1 className='text-2xl lg:text-3xl font-bold uppercase text-green-600'>
                Commande Envoyée
              </h1>
              <Check color='black' className='size-7 lg:size-8 stroke-green-600 lg:mb-1.5' strokeWidth={3} />
            </div>
            <div className='rounded-lg space-y-2 border border-gray-200'>
              <p className='text-[14px] lg:text-base text-black font-inter'>
                Nous avons bien reçu votre commande et nous vous contacterons très bientôt pour confirmer tous les détails.
              </p>
              <p className='text-sm text-gray-600 font-inter'>
                Merci de votre confiance !
              </p>
            </div>
          </tr>
          <tr className='flex flex-col px-10 py-4 '>
            <p className='text-[25px] font-bold uppercase'>REÇU</p>
            <div className="flex flex-col pt-3 lg:pt-4 pb-10 ">
              {Array.from(cart.keys()).map((key, index) => {
                const product = products?.find((product) => product?._id === key);
                if (!product) return <p key={key}>chargement...</p>;
                return (
                  <div key={key} className={cn("flex text-[14px] py-2 border-t-1 border-black",
                    index === (cart.size - 1) && "border-b-1")}>
                    <div className='flex items-center gap-6'>
                      <p className="font-inter font-bold text-primary tracking-wide lg:text-[14px] uppercase">{product.title}</p>
                      <p className="text-[12px] font-semibold">{product.price} DA <span className="text-black/50"> x{cart.get(key)?.quantity}</span></p>
                    </div>

                    <div className="flex gap-2">
                      {Object.entries(cart.get(key)!.selection).map(([key, value]) =>
                      (<div className="bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase" key={key}>
                        <p>{value.variantOptionName}</p>
                      </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className='flex flex-col gap-2 text-[14px] uppercase pt-4 border-black'>
              <div className='w-full flex justify-between'>
                <p className='font-bold'>SOUS-TOTAL</p>
                <p>{getTotal()} DA</p>
              </div>
              <div className='w-full h-[1px] bg-black' />
              <div className='w-full flex justify-between'>
                <p className='font-bold'>livraison</p>
                <p>400 DA</p>
              </div>

              <div className='w-full  text-[18px] flex justify-between pt-4 lg:pt-6 mt-6 border-t-1 border-black/40 border-dashed'>
                <p className='font-black'>TOTAL</p>
                <p className='font-black'>{getTotal() + 400} DA</p>
              </div>

            </div>
          </tr>
        </table>
        <button
          onClick={() => {
            // clear cart
            cartArray.forEach(([productId]) => {
              removeProductFromCart(productId)
            })
            navigate({ to: '/' })
          }}
          className='bg-primary rounded-2xl py-3 text-white font-semibold uppercase hover:bg-primary/90 transition-colors'
        >
          Retour à l'accueil
        </button>
      </div>
    </div >
  )
}
