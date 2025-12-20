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

    // Update customer info with latest data
    await ctx.db.patch(customer._id, {
      firstName,
      lastName,
      lastestAdressId: newAddressId
    })

    const products = await Promise.all(
      order.map(v => ctx.db.get(v.productId))
    )
    const subTotalCostArr = products.map(p => {
      if (p?.price) {
        const quantity = order.find(o => o?.productId === p?._id)?.quantity ?? 0
        return p.price * quantity
      } else return 0
    })
    const subTotalCost = subTotalCostArr.length > 0
      ? subTotalCostArr.reduce((acc, current) => acc + current)
      : 0
    console.log('calculated the total cost :', subTotalCost)

    // finally place the order
    const placedOrder = await ctx.db.insert('orders', {
      order,
      customerId: customer._id,
      addressId: newAddressId,
      deliveryCost: fullWilaya.deliveryCost,
      subTotalCost,
      status: 'pending',
      createdAt: Date.now()
    })
    console.log('ordered placed correctly :', placedOrder)

    return placedOrder
  }
})

export const getWilayat = query({
  handler: async (ctx) => {
    return await ctx.db.query('wilayat').collect()
  }
})

export const listOrders = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query('orders')
      .collect()

    // Sort by createdAt descending
    const sortedOrders = orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    return await Promise.all(sortedOrders.map(async (order) => {
      const customer = await ctx.db.get(order.customerId)
      const address = await ctx.db.get(order.addressId)
      const wilaya = address ? await ctx.db.get(address.wilayaId) : null

      return {
        ...order,
        customer,
        address: address ? {
          ...address,
          wilaya
        } : null
      }
    }))
  }
})

export const getOrder = query({
  args: { orderId: v.id('orders') },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId)
    if (!order) return null

    const customer = await ctx.db.get(order.customerId)
    const address = await ctx.db.get(order.addressId)
    const wilaya = address ? await ctx.db.get(address.wilayaId) : null

    const orderItems = await Promise.all(order.order.map(async (item) => {
      const product = await ctx.db.get(item.productId)
      const selections = await Promise.all(item.selection.map(async (sel) => {
        const variant = await ctx.db.get(sel.variantId)
        const variantOption = await ctx.db.get(sel.variantOptionId)
        return {
          variant,
          variantOption
        }
      }))
      return {
        ...item,
        product,
        selections
      }
    }))

    return {
      ...order,
      customer,
      address: address ? {
        ...address,
        wilaya
      } : null,
      order: orderItems
    }
  }
})

export const confirmOrder = mutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, { orderId }) => {
    await ctx.db.patch(orderId, { status: 'confirmed' })
    return 'success'
  }
})

export const denyOrder = mutation({
  args: { orderId: v.id('orders') },
  handler: async (ctx, { orderId }) => {
    await ctx.db.patch(orderId, { status: 'denied' })
    return 'success'
  }
})
