import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const placeOrder = mutation({
  args: v.object({
    address: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.number(),
    wilaya: v.string(),
    order: v.array(
      v.object({
        quantity: v.number(),
        productId: v.id('products'),
        price: v.number(),
        selection: v.array(v.object({
          variantId: v.id('variants'),
          variantOptionId: v.id('variantOptions'),
        })),
      })
    )
  }
  ),
  handler: async (ctx,
    {
      phoneNumber,
      address,
      firstName,
      lastName,
      wilaya,
      order
    }) => {
    let fullWilaya = await ctx.db.query('wilayat')
      .filter(e => e.eq(e.field('name'), wilaya))
      .first()
    console.log("found wilaya", fullWilaya?.name)
    if (!fullWilaya) return new Error('wilaya doesnt exist')

    const newAddressId = await ctx.db.insert('addresses',
      {
        wilayaId: fullWilaya?._id,
        address
      })
    console.log('inserted new address', newAddressId)

    let customer = await ctx.db.query('customers')
      .filter(e => e.eq(e.field('phoneNumber'), phoneNumber))
      .first()
    if (customer)
      console.log('found customer :', customer?._id)

    if (!customer) {
      const newCustomerId = await ctx.db.insert('customers', {
        firstName,
        lastName,
        phoneNumber,
        lastestAdressId: newAddressId,
      })
      customer = await ctx.db.get(newCustomerId)
      console.log('created new csutomer :', newCustomerId)
    }
    if (!customer) return new Error('couldnt create customer for some reason')

    else
      await ctx.db.patch(customer._id, { lastestAdressId: newAddressId })

    const products = await Promise.all(
      order.map(v => ctx.db.get(v.productId))
    )
    const subTotalCost = products.map(p => {
      if (p?.price) {
        const quantity = order.find(o => o?.productId === p?._id)?.quantity ?? 0
        return p.price * quantity
      } else return 0
    }).reduce((acc, current) => acc + current,)
    console.log('calculated the total cost :', subTotalCost)

    // finally place the order
    const placedOrder = await ctx.db.insert('orders', {
      order,
      customerId: customer._id,
      addressId: newAddressId,
      deliveryCost: fullWilaya.deliveryCost,
      subTotalCost
    })
    console.log('ordered placed correctly :', placedOrder)

    return 'success'
  }
})

export const getWilayat = query({
  handler: async (ctx) => {
    return await ctx.db.query('wilayat').collect()
  }
})
