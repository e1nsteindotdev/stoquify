import { v } from "convex/values";
import { query } from "./_generated/server";

export const listCustomers = query({
  handler: async (ctx) => {
    const customers = await ctx.db.query('customers')
      .collect()
    
    return await Promise.all(customers.map(async (customer) => {
      const address = await ctx.db.get(customer.lastestAdressId)
      const wilaya = address ? await ctx.db.get(address.wilayaId) : null
      
      // Get order count
      const orders = await ctx.db.query('orders')
        .withIndex('by_customer', (q) => q.eq('customerId', customer._id))
        .collect()
      
      return {
        ...customer,
        address: address ? {
          ...address,
          wilaya
        } : null,
        orderCount: orders.length
      }
    }))
  }
})

export const getCustomer = query({
  args: { customerId: v.id('customers') },
  handler: async (ctx, { customerId }) => {
    const customer = await ctx.db.get(customerId)
    if (!customer) return null
    
    const address = await ctx.db.get(customer.lastestAdressId)
    const wilaya = address ? await ctx.db.get(address.wilayaId) : null
    
    // Get all orders for this customer
    const orders = await ctx.db.query('orders')
      .withIndex('by_customer', (q) => q.eq('customerId', customerId))
      .collect()
    
    // Sort by createdAt descending
    const sortedOrders = orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    
    const ordersWithDetails = await Promise.all(sortedOrders.map(async (order) => {
      const orderAddress = await ctx.db.get(order.addressId)
      const orderWilaya = orderAddress ? await ctx.db.get(orderAddress.wilayaId) : null
      
      return {
        ...order,
        address: orderAddress ? {
          ...orderAddress,
          wilaya: orderWilaya
        } : null
      }
    }))
    
    return {
      ...customer,
      address: address ? {
        ...address,
        wilaya
      } : null,
      orders: ordersWithDetails
    }
  }
})

export const getCustomerByPhone = query({
  args: { phoneNumber: v.number() },
  handler: async (ctx, { phoneNumber }) => {
    const customer = await ctx.db.query('customers')
      .withIndex('by_phone', (q) => q.eq('phoneNumber', phoneNumber))
      .first()
    
    if (!customer) return null
    
    const address = await ctx.db.get(customer.lastestAdressId)
    const wilaya = address ? await ctx.db.get(address.wilayaId) : null
    
    return {
      ...customer,
      address: address ? {
        ...address,
        wilaya
      } : null
    }
  }
})

