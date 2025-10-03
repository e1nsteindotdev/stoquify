import { Footer } from '@/components/footer';
import { HeaderAnonc, Navbar } from '@/components/navbar';
import { Product } from '@/components/products';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { api } from 'api/convex';
import type { Id } from 'api/data-model';
import { useQuery } from 'convex/react';

export const Route = createFileRoute('/categories/$slug')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ from: "/categories/$slug" });
  const categoryId = params.slug as Id<'categories'>
  const category = useQuery(api.categories.getCategory, { categoryId: categoryId })
  const navigate = useNavigate()
  const products = useQuery(api.products.listProducts)
    ?.filter(p => p.categoryId === categoryId)
  if (!category) return <div> Loading ...</div>
  return (
    <div className="overflow-clip">
      <div className="px-3 lg:px-4 max-w-[1800px] mx-auto bg-[#E6E6E6]">
        <HeaderAnonc />
        <div className="flex flex-col gap-10 lg:gap-30 w-full border-l-1 border-r-1 border-seperator relative">
          <div>
            <Navbar />
            <div className='py-4 px-2 lg:px-4 pb-20 lg:pb-50'>
              <div className='font-inter uppercase text-[10px] lg:text-[14px] flex gap-2 pb-2 lg:pb-3'>
                <button
                  onClick={() => navigate({ to: "/" })}
                >HOME</button>
                <span>/</span>
                <button>
                  <span className='uppercase'>
                    catégorés
                  </span>
                </button>
                <span>/</span>
                <button>
                  <span className='uppercase'>
                    {category.name}
                  </span>
                </button>
              </div>
              <div className='flex flex-col gap-1'>
                <p className='uppercase leading-[1] text-[16px] lg:text-[25px] text-primary'>
                  catégorés</p>
                <p className='uppercase leading-[1] text-[41px] lg:text-[64px] font-display text-primary'>
                  {category.name}
                </p>
              </div>
              <div className='h-full flex flex-col lg:flex-row flex-wrap gap-x-8 gap-y-8 pt-4'>
                {products?.map(p => <Product data={p} key={p._id} />)}
              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}
