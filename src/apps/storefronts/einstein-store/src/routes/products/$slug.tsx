
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

  const images = product?.images?.sort((a, b) => a.order - b.order) ?? []
  console.log(sourceType)


  if (!product) return <div> Loading ...</div>
  const header = (
    <div className='flex-col items-start gap-1 hidden lg:flex lg:px-3'>
      <p className='rounded-[8px] leading-[1] text-[12px] font-inter font-bold py-2 pb-1.75 px-3 mb-2 bg-black/5 text-black uppercase tracking-wider'>
        {sourceName}
      </p>

      <p className='uppercase text-[35px] leading-[1] lg:text-[64px] font-display text-primary'>
        {product.title}
      </p>

      <p className='font-bold text-[20px] lg:text-[31px] leading-[1]'>{product.price} DZD</p>
    </div>
  )

  return (
    <div className="overflow-clip">
      <div className="px-3 lg:px-4 max-w-[1800px] mx-auto bg-[#E6E6E6]">
        <HeaderAnonc />
        <div className="flex flex-col gap-10 lg:gap-30 w-full border-l-1 border-r-1 border-seperator relative">
          <div>
            <Navbar />
            {sourceType &&
              <div className='font-inter uppercase text-[10px] lg:text-[14px] font-semibold flex items-start gap-2 pt-4 pb-2 lg:pb-10 px-3 w-full lg:justify-center'>
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


            <div className='flex flex-col lg:flex-row w-full lg:justify-center gap-x-4'>
              <div className='flex flex-col gap-3 px-3'>
                {/* first part */}
                <div className='flex flex-col gap-1 lg:hidden'>
                  <p className='uppercase text-[35px] leading-[1] lg:text-[64px] font-display text-primary'>
                    {product.title}
                  </p>

                  {header}
                  {/* {product?.desc && <p className='font-inter leading-[1.2] text-[14px] text-black/60 pt-1'>{product.desc}</p>} */}
                </div>

                {/* second part */}
                <div className='pb-4'>
                  <img
                    className='w-full max-w-[800px] min-h-[300px] border-1 border-white'
                    src={images?.[0].url} />
                  {images.length >= 2 &&
                    <div
                      className='flex lg:flex-col justify-start gap-1 h-[200px] scrollbar-hide overflow-scroll lg:overflow-ellipsis
                      '>
                      {images?.slice(1)?.map(img => <img
                        className='border-1 border-white mt-2 lg:w-[800px]'
                        src={img.url} />
                      )}
                    </div>
                  }
                </div>
              </div>

              {/* third part */}
              <div className='flex flex-col gap-6'>

                {header}

                <div className='flex flex-col gap-4 px-3'>
                  <div className='flex flex-col border-white border-1'>
                    <div className='flex flex-col gap-2 p-3'>
                      <p className='text-primary text-[18px] font-bold uppercase'>Taille</p>
                      <div className='flex gap-3'>
                        {Array.from([1, 2, 3, 4]).map(i =>
                          <button
                            onClick={() => { }}
                            className='p-[10px] leading-[1] rounded-[4px] border-1 border-white text-[14px] font-semibold font-inter'
                          >
                            40
                          </button>
                        )}
                      </div>
                    </div>

                    {/* seperator */}
                    <div className='w-full h-[1px] bg-white' />

                    <div className='flex flex-col gap-2 p-3'>
                      <p className='text-primary text-[18px] font-bold uppercase'>Quantity</p>
                      <div className='flex gap-4 items-center'>
                        <button
                          onClick={() => { }}
                          className='border-black border-[1px] flex items-center justify-center h-[26px] w-[26px]'
                        >
                          <PlusIcon size={16} />
                        </button>

                        <p className='rounded-[4px] font-inter border-1- border-white text-[18px] font-semibold' > 5 </p>

                        <button
                          onClick={() => { }}
                          className='border-black border-[1px] flex items-center justify-center h-[26px] w-[26px]'
                        >
                          <MinusIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col gap-1 py-2'>
                    <p className='text-[18px] text-black/80'>TOTAL COST:</p>
                    <p className='text-[25px] leading-[0.9] uppercase font-bold'>{product.price ? 5 * product.price : 0} DZD</p>
                  </div>

                  <div className='mb-20 flex flex-col gap-4 lg:pt-20'>
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
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div >
    </div >
  )
}
