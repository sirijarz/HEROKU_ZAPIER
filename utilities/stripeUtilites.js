const Config = require("../config/config")
var config = new Config()
const stripe = require('stripe')(config.stripeKey)

/*** Stripe Customer API */
var stripeCreateCustomer = function(customerObject){
   return stripe.customers.create(customerObject)
}

var stripeGetCustomer = function(customerId){
    return stripe.customers.retrieve(customerId)
}

var stripeUpdateCustomer = function(customerId,customerUpdate){
    return stripe.customers.update(customerId,customerUpdate)
}

var stripeDeleteCustomer = function(customerId){
    return stripe.customers.del(customerId)
}

/*** Stripe Charge API */
var stripeCreateCharge = function(chargeObj){
    return stripe.charges.create({
        amount:chargeObj.amount,
        source:chargeObj.token,
        currency:chargeObj.currency
     })
}

/*** Stripe Subscription API */
var stripeCreateSubscription = function(customerId,prices,couponId){
    return stripe.subscriptions.create({
        customer:customerId,
        // default_payment_method:tokenId,
        items:prices,
        coupon:couponId,
        
        invoice_customer_balance_settings:{consume_applied_balance_on_void:false},
        expand:["latest_invoice.payment_intent"]
    })

}

var stripeGetSubscriptions = function(subscriptionId){
    return stripe.subscriptions.retrieve(subscriptionId)
}

var stripeUpdateSubscriptions = function(subscriptionId,subscriptionUpdate){
    return stripe.subscriptions.update(subscriptionId,subscriptionUpdate)
}

var stripeCancelSubscriptions = function(subscriptionId){
    return stripe.subscriptions.del(subscriptionId)

}

var stripeGetAllSubscriptions = function(limit){
    return stripe.subscriptions.list({limit:limit})

}

/*** Stripe Refund API */
var stripeCreateRefund = function(chargeId){
    return stripe.refunds.create({charge:chargeId})
}

var stripeGetRefund = function(refundId){
    return stripe.refunds.retrieve(refundId)
}

/*** Strip Products API */
var stripeGetAllProducts = function(limit){
   
    return stripe.products.list({limit:limit})
}

/*** Stripe Plans API */
var stripeGetAllPlans = function(limit){
    console.log(stripe)
    return stripe.prices.list({limit:limit,
        expand:["data.tiers"]})
}

var stripeGetPlan = function(planId){
    return stripe.prices.retrieve(planId)
}

/*** Stripe Cards API */
var stripeCreateCard = function(customer){
    var customerId = customer.customerId;
    var token = customer.tokenId;
    return stripe.customers.createSource(
        customerId,
        {source:token}
    )
}

var stripeDeleteCard = function(customer){
    var customerId = customer.customerId;
    var cardId = customer.cardId;
    return stripe.customers.deleteSource(
        customerId,
        cardId
    )
}

/*** Stripe get coupon */
var stripeGetCoupon = function(couponId){
    return stripe.coupons.retrieve(couponId)
}

module.exports = {
    stripeGetCustomer,
    stripeCreateCustomer,
    stripeUpdateCustomer,
    stripeDeleteCustomer,
    stripeCreateCharge,
    stripeGetSubscriptions,
    stripeCreateSubscription,
    stripeGetAllSubscriptions,
    stripeGetSubscriptions,
    stripeUpdateSubscriptions,
    stripeCancelSubscriptions,
    stripeCreateRefund,
    stripeGetRefund,
    stripeGetAllProducts,
    stripeGetAllPlans,
    stripeGetPlan,
    stripeCreateCard,
    stripeDeleteCard,
    stripeGetCoupon
}