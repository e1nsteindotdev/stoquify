
import { Footer } from '@/components/footer';
import { HeaderAnonc, Navbar } from '@/components/navbar';
import { Product } from '@/components/products';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { api } from 'api/convex';
import type { Id } from 'api/data-model';
import { useQuery } from 'convex/react';


export const Route = createFileRoute('/products/$slug')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ from: "/products/$slug" });
  const productId = params.slug as Id<'products'>
  const product = useQuery(api.products.getProductById, { id: productId })
  const category = useQuery(api.categories.getCategory, { categoryId: product?.categoryId })
  const navigate = useNavigate()
  if (!product) return <div> Loading ...</div>
  console.log(product)
  return (
    <div className="overflow-clip">
      <div className="px-3 lg:px-4 max-w-[1800px] mx-auto bg-[#E6E6E6]">
        <HeaderAnonc />
        <div className="flex flex-col gap-10 lg:gap-30 w-full border-l-1 border-r-1 border-seperator relative">
          <div>
            <Navbar />
            <div className='font-inter uppercase text-[10px] flex gap-2 pb-4'>
              <button onClick={() => navigate({ to: "/" })} >
                HOME
              </button>
              <span>/</span>
              <button>
                <span className='uppercase'>
                  catégorés
                </span>
              </button>
              <span>/</span>
              <button>
                <span className='uppercase'>
                  {category?.name}
                </span>
              </button>
              <span className='uppercase'>
                {product.title}
              </span>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}
