import { Image } from '@/components/ui/image'
import { useForm } from "@tanstack/react-form"
import { createFileRoute } from '@tanstack/react-router'
import { useCartStore } from "@/lib/state";
import { useQuery } from 'convex/react';
import { api } from 'api/convex';
import { XIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/search-select';

export const Route = createFileRoute('/checkout')({
  component: RouteComponent,
})

function RouteComponent() {
  const products = useQuery(api.products.listProducts)
  const removeProductFromCart = useCartStore((state) => state.removeProductFromCart);
  const cart = useCartStore((state) => state.cart);

  return (
    <div className=''>
      {/* navbar  */}
      <div className='mx-auto w-full border-b-white border-1 py-6 flex justify-center bg-white/40'>
        <Image src="/logo.svg" className="h-[30px]" />
      </div>

      <div className='flex justify-center min-h-screen'>

        {/* form */}
        <OrderForm />

        {/* summary  */}

        <div className='flex-1 flex justify-start'>
          <div className='w-[600px] px-20 py-8 order-2 font-inter'>

            <p className='text-[40px] font-bold'>Summary</p>
            <div className="flex flex-col gap-3 pt-3 lg:pt-8">
              {Array.from(cart.keys()).map((key) => {
                const product = products?.find((product) => product?._id === key);
                if (!product) return <p key={key}>loading...</p>;
                return (
                  <div key={key} className="flex gap-2 text-[14px]">
                    <img
                      src={product?.images?.find((img) => img.order === 1)?.url}
                      className="border-white h-[102px] border-1 object-cover"
                    />
                    <div className="w-full flex flex-col gap-2 justify-start">
                      <div>
                        <p className="font-inter font-bold text-primary tracking-wide lg:text-[14px] uppercase"> {product.title}</p>
                        <p className="text-[12px] font-semibold">{product.price} DA <span className="text-black/50"> x{cart.get(key)?.quantity}</span></p>
                      </div>

                      <div className="flex gap-2">
                        {Object.entries(cart.get(key)!.selection).map(([key, value]) =>
                        (<div className="bg-black/5 px-2 py-1 text-[10px] font-semibold uppercase" key={key}>
                          <p>{value.variantOptionName}</p>
                        </div>
                        ))}
                      </div>

                      <button onClick={() => removeProductFromCart(product._id)} className="text-[#D20909] bg-red-200 flex gap-2 p-1 items-center text-[10px] self-start font-semibold">
                        <XIcon size={10} />
                        REMOVE FROM CART
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}


function OrderForm() {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      wilaya: '',
      address: ''
    },
    onSubmit: async () => { }
  })
  const wilayat = useQuery(api.order.getWilayat)
  return (
    <div className='flex-1 flex justify-end bg-white/40 border-r-1 border-white'>
      <div className='py-8 lg:px-20 lg:w-[600px] font-inter'>
        <p className='text-[40px] font-bold'>Complete order</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className='space-y-4'
        >
          <div className='flex flex-col gap-3 pt-8'>
            <div className='flex gap-2'>
              <Input placeholder='nom' />
              <Input placeholder='prenom' />
            </div>
            <Input placeholder='phone number' />
            <Input placeholder='full home address' />
            {wilayat && <SearchSelect options={wilayat} />}
          </div>

          <button className='w-full bg-primary rounded-2xl py-1.5 text-white font-semibold'>Complete order</button>
        </form>
      </div>
    </div>
  )

} 
