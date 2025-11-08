
import { Footer } from '@/components/footer';
import { HeaderAnonc, Navbar } from '@/components/navbar';
import { createFileRoute, Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { api } from 'api/convex';
import type { Id } from 'api/data-model';
import { useQuery } from 'convex/react';
import { z } from 'zod'
import { MinusIcon, PlusIcon } from 'lucide-react';
import { CartIcon } from '@/components/icons/cart-icon';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/state';


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
  const addProductToCart = useCartStore(state => state.addProductToCart)
  const productId = params.slug as Id<'products'>
  const product = useQuery(api.products.getProductById, { id: productId })
  const isCartOpened = useCartStore(state => state.isCartOpened)
  let { source: { sourceType, sourceName } } = useSearch({
    from: Route.fullPath
  })
  if (sourceType === "categories")
    sourceType = 'catégorés'
  else if (sourceType === "collections")
    sourceType = 'collections'
  else sourceType = ''
  const images = product?.images?.sort((a, b) => a.order - b.order) ?? []
  const [selectedVariants, setSelectedVariants] = useState(new Map<string, string>(product?.variants.map(v => [v._id, 'vide'])))
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  if (!product) return <div> Loading ...</div>
  const header = (
    <div className='flex-col items-start gap-1 hidden lg:flex'>
      {sourceType &&
        <div className='font-inter uppercase text-[10px] lg:text-[14px] font-semibold flex items-start gap-2 text-black/60 cursor-pointer'>
          <Link to={"/"} >
            HOME
          </Link>
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
      <p className='uppercase text-[35px] leading-[1] lg:text-[64px] font-display text-primary'>
        {product.title}
      </p>
      <p className='rounded-[8px] leading-[1] text-[14px] font-[600] text-black/70 uppercase tracking-[.2em]'>
        {sourceName}
      </p>
      <p className='text-[30px] pt-4 leading-[0.9] uppercase font-bold'>
        {product.price} DZD
      </p>
    </div>
  )

  function handleSubmit(mode: "BUY_IT_NOW" | "ADD_TO_CART") {
    if (mode === "ADD_TO_CART") {
      if (product?._id && Object.values(selectedVariants).includes(null) === false) {
        addProductToCart(product?._id, { price: product?.price ?? 0, selection: Object.fromEntries(selectedVariants), quantity: selectedQuantity })
      }
    }
  }

  return (
    <div className="overflow-clip">
      <div className="px-3 lg:px-4 max-w-[1800px] mx-auto bg-[#E6E6E6] relative">
        <div className={cn('lg:h-[90px] border-l-1 border-r-1 border-white bg-[#E6E6E6] top-0 z-100', isCartOpened ? 'lg:static' : 'lg:sticky')}>
          <HeaderAnonc />
          <Navbar />

        </div>
        <div className="flex flex-col gap-10 lg:gap-30 w-full border-l-1 border-r-1 border-seperator relative">
          <div className='relative'>
            <div className='flex flex-col lg:flex-row w-full lg:justify-center gap-x-4 lg:pb-100'>
              <div className='flex flex-col gap-3 px-3'>

                {/* first part */}
                <div className='flex flex-col gap-1 lg:hidden'>
                  {sourceType &&
                    <div className='font-inter uppercase text-[10px] lg:text-[14px] font-semibold flex items-start gap-2 pt-4 pb-2 lg:pb-10 lg:px-3 w-full text-black/60 cursor-pointer'>
                      <Link to={"/"} >
                        HOME
                      </Link>
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
                  <div className='flex-col items-start gap-1 flex lg:px-3'>
                    <p className='uppercase text-[31px] leading-[1] lg:text-[64px] font-display text-primary'>
                      {product.title}
                    </p>
                    <p className='rounded-[8px] leading-[1] text-[12px] font-[600] text-black/70 uppercase tracking-[.2em]'>
                      {sourceName}
                    </p>
                    <p className='text-[20px] pt-2 leading-[0.9] uppercase font-bold'>
                      {product.price} DZD
                    </p>
                  </div>
                  {/* {product?.desc && <p className='font-inter leading-[1.2] text-[14px] text-black/60 pt-1'>{product.desc}</p>} */}
                </div>

                {/* second part */}
                <div className='pb-4 lg:pt-8'>
                  <img
                    className='w-full min-h-[300px] lg:h-[1000px] border-1 border-white'
                    src={images?.[0].url} />
                  {images.length >= 2 &&
                    <div
                      className=''>
                      {images?.slice(1)?.map(img => <img
                        className='border-1 border-white mt-2 lg:h-[1000px] '
                        key={img.url}
                        src={img.url} />
                      )}
                    </div>
                  }
                </div>
              </div>

              {/* third part */}
              <div className='relative'>
                <div className={cn('flex flex-col gap-6 lg:top-[120px] lg:h-[1000px] lg:sticky')}>
                  {/* desktop */}

                  {header}

                  <div className='flex flex-col gap-4 items-center lg:items-start px-3 lg:px-0'>

                    {/* options form  */}
                    <div className='flex flex-col border-white border-1 w-full lg:w-auto'>
                      {product?.variants.map(variant => {
                        return (
                          <div key={variant._id}>
                            <div className='flex flex-col gap-2 p-3'>
                              <p className='text-primary text-[18px] font-bold uppercase'>{variant.name}</p>
                              <div className='flex gap-3'>
                                {variant.options.map(option =>
                                  <button
                                    key={option._id}
                                    onClick={() => {
                                      setSelectedVariants(prev => {
                                        prev.set(variant.name, option.name)
                                        return new Map(prev)
                                      })
                                    }}
                                    className={`pb-[10px] pt-[13px] px-[14px] leading-[1] bg-black/1 border-[1px] text-[16px] font-[600] tracking-wider uppercase min-w-[40px]
                                  ${selectedVariants.get(variant.name) === option.name
                                        ? "text-primary border-primary bg-primary/5" : "border-white"} `}
                                  >
                                    {option.name}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className='w-full h-[1px] bg-white' />
                          </div>
                        )
                      })}

                      {/* quantity selector  */}

                      <div className='flex flex-col gap-2 p-3'>
                        <p className='text-primary text-[18px] font-bold uppercase'>Quantity</p>
                        <div className='flex gap-4 items-center'>
                          <button
                            onClick={() => { setSelectedQuantity(prev => prev === 0 ? 0 : prev - 1) }}
                            className='border-black border-[1px] flex items-center justify-center h-[26px] w-[26px]'
                          >
                            <MinusIcon size={16} />
                          </button>

                          <p className='rounded-[4px] w-[40px] text-center font-inter border-white text-[24px] font-semibold' >
                            {selectedQuantity}
                          </p>

                          <button
                            onClick={() => { setSelectedQuantity(prev => prev + 1) }}
                            className='border-black border-[1px] flex items-center justify-center h-[26px] w-[26px]'
                          >
                            <PlusIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className='mb-20 w-full flex flex-col gap-4 pt-8 lg:pt-20'>
                      <button
                        onClick={() => handleSubmit('BUY_IT_NOW')}
                        className='font-semibold uppercase text-white pt-[11px] pb-[12px] w-full rounded-[16px] bg-primary lg:text-[18px] lg:w-[500px]'>
                        <p className='leading-[1] pt-1.25'>
                          BUY IT NOW
                        </p>
                      </button>

                      <button
                        onClick={() => handleSubmit('ADD_TO_CART')}
                        className='font-semibold uppercase text-primary pt-[11px] pb-[12px] rounded-[12px] bg-primary/5 lg:text-[18px] ring-[1.5px] ring-primary flex items-center justify-center gap-3 w-full lg:w-[500px] flex-1 grow-1'>
                        <p className='leading-[1] pt-1.25'>
                          ADD TO CART
                        </p>
                        <CartIcon color='#684FCA' size={16} />
                      </button>
                      <p className='upppercase text-[12px] lg:text-[16px] text-black/40 uppercase font-inter italic text-center lg:text-start'>LIVRAISON 48H MAXIMUM</p>
                    </div>
                  </div>

                  <div className='hidden lg:flex gap-4 h-full underline-offset-2' >
                    <p className='font-[12px] underline mt-auto'>INSTAGRAM</p>
                    <p className='font-[12px] underline mt-auto'>TIKTOK</p>
                    <p className='font-[12px] underline mt-auto'>GOOGLE MAPS</p>
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
