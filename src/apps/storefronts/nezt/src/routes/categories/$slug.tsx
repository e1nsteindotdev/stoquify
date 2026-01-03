import { Footer } from '@/components/footer';
import { HeaderAnonc, Navbar } from '@/components/navbar';
import { Product } from '@/components/products';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { api } from "api/convex";
import type { Id } from "api/data-model";
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
  return (
    <div className="overflow-clip" >
      <div className="px-3 lg:px-4 max-w-[1800px] mx-auto bg-[#E6E6E6]">
        <HeaderAnonc />
        <div className="flex flex-col gap-10 lg:gap-30 w-full border-l-1 border-r-1 border-seperator relative">
          <div>
            <Navbar />
            <div className='py-4 px-2 lg:px-4 pb-20 lg:pb-50'>
              <div className='font-inter uppercase text-[10px] lg:text-[14px] flex gap-2 pb-2 lg:pb-3'>
                <button
                  onClick={() => navigate({ to: "/" })}
                >ACCUEIL</button>
                <span>/</span>
                <button>
                  <span className='uppercase'>
                    catégories
                  </span>
                </button>
                <span>/</span>
                <button>
                  {category?.name
                    ? <span className='uppercase'>
                      {category.name}
                    </span>
                    : <div className='lg:h-[64px] w-[100px]' />
                  }
                </button>
              </div>
              <div className='flex flex-col gap-1'>
                <p className='uppercase leading-[1] text-[16px] lg:text-[25px] text-primary'>catégories</p>
                {category?.name
                  ? <p className='uppercase leading-[1] text-[41px] lg:text-[64px] font-display text-primary'>{category.name} </p>
                  : <div />
                }
              </div>
              <div className='grid grid-cols-1 lg:grid-cols-4 gap-x-4 gap-y-8 pt-4'>
                {category ? products?.map(p =>
                  <Product
                    source={{ sourceType: 'categories', sourceName: category.name }}
                    data={p} key={p._id} />
                )
                  :
                  Array.from({ length: 12 }).map((_) => <Product data={undefined} />)
                }

              </div>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  )
}
