
import { Footer } from '@/components/footer';
import { HeaderAnonc, Navbar } from '@/components/navbar';
import { createFileRoute, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { api } from 'api/convex';
import type { Id } from 'api/data-model';
import { useQuery } from 'convex/react';
import { z } from 'zod'
import { MinusIcon, PlusIcon } from 'lucide-react';
import { CartIcon } from '@/components/icons/cart-icon';


export const Route = createFileRoute('/products/$slug')({
  component: RouteComponent,
  validateSearch: z.object({
    source: z.object({
      sourceType: z.string(),
      sourceName: z.string()
    })
  })
})

function RouteComponent() {
  const params = useParams({ from: "/products/$slug" });
  const productId = params.slug as Id<'products'>
  const product = useQuery(api.products.getProductById, { id: productId })
  const navigate = useNavigate()
  let { source: { sourceType, sourceName } } = useSearch({
    from: Route.fullPath
  })
  if (sourceType === "categories")
    sourceType = 'catégorés'
  else if (sourceType === "collections")
    sourceType = 'collections'
  else sourceType = ''

  const images = product?.images ?? []
  console.log(images)


  if (!product) return <div> Loading ...</div>
  return (
    <div className="overflow-clip">
      <div className="px-3 lg:px-4 max-w-[1800px] mx-auto bg-[#E6E6E6]">
        <HeaderAnonc />
        <div className="flex flex-col gap-10 lg:gap-30 w-full border-l-1 border-r-1 border-seperator relative">
          <div>
            <Navbar />
            {sourceType &&
              <div className='font-inter uppercase text-[10px] flex gap-2 pb-4'>
                <button onClick={() => navigate({ to: "/" })} >
                  HOME
                </button>
                <span>/</span>
                <button>
                  <span className='uppercase'>
                    {sourceType}
                  </span>
                </button>
                <span>/</span>
                <button>
                  <span className='uppercase'>
                    {sourceName}
                  </span>
                </button>
                <span>/</span>
                <span className='uppercase'>
                  {product.title}
                </span>
              </div>
            }
            <div className='flex flex-col gap-3 px-3'>
              <div className='flex flex-col gap-3'>
                <div className='flex flex-col gap-1'>
                  <p className='uppercase text-[35px] lg:text-[64px] font-display text-primary'>
                    {product.title}
                  </p>
                  <p className='font-bold text-[20px] font-inter'>{product.price} DZD</p>
                  <p className='font-medium text-[14px] font-inter text-black/40 uppercase tracking-wider'>{sourceName}</p>
                </div>
                <img
                  className='w-full max-w-[800px] min-h-[300px] border-1 border-white'
                  src={images?.[0].url} />
              </div>
              <div className='p-3 flex flex-col gap-3 border-1 border-[white]'>
                <div className='flex flex-col gap-4'>
                  <p className='text-primary text-[16px] font-semibold font-inter'>Taille</p>
                  <div className='flex gap-3'>
                    <button
                      onClick={() => { }}
                      className='p-[10px] rounded-[4px] border-1 border-white text-[12px] font-semibold'
                    >
                      40
                    </button>
                    <button
                      onClick={() => { }}
                      className='p-[10px] rounded-[4px] border-1 border-white text-[12px] font-semibold'
                    >
                      40
                    </button>
                    <button
                      onClick={() => { }}
                      className='p-[10px] rounded-[4px] border-1 border-white text-[12px] font-semibold'
                    >
                      40
                    </button>
                  </div>
                </div>

                {/* seperator */}
                <div className='w-full h-[1px] bg-white' />

                <div className='flex flex-col gap-1'>
                  <p className='text-primary text-[16px] font-semibold font-inter'>Quantity</p>
                  <div className='flex gap-2 items-center'>
                    <button
                      onClick={() => { }}
                      className='border-black border-[1px] flex items-center justify-center h-[26px] w-[26px]'
                    >
                      <PlusIcon size={16} />
                    </button>

                    <div className='p-[10px] rounded-[4px] font-inter border-1- border-white text-[18px] font-semibold' > 5 </div>

                    <button
                      onClick={() => { }}
                      className='border-black border-[1px] flex items-center justify-center h-[26px] w-[26px]'
                    >
                      <MinusIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <p className='font-bold text-[25px] leading-[1] font-inter'>{product.price}</p>
                <p className='text-[14px] leading-[1] uppercase font-inter'>total: {product.price ? 5 * product.price : 0} DZD</p>
              </div>

              <div className='py-6 flex flex-col gap-4'>
                <button className='font-semibold uppercase text-white pt-[11px] pb-[12px] w-full rounded-[12px] bg-primary'>
                  <p className='leading-[1] pt-1.25'>
                    BUY IT NOW
                  </p>
                </button>

                <button className='font-semibold uppercase text-primary pt-[11px] pb-[12px] w-full rounded-[12px] bg-primary/5 ring-[1.5px] ring-primary flex items-center justify-center gap-3'>
                  <p className='leading-[1] pt-1.25'>
                    ADD TO CART
                  </p>
                  <CartIcon color='#684FCA' size={16} />
                </button>

              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}
