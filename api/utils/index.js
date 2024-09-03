import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Stripe from "stripe"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)


export const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:"1d"})
}

// Hash Token
export const hashToken = (token) => {
    return crypto.createHash("sha256").update(token.toString()).digest("hex");
};

// function calculateTotalPrice(products, cartItems) {
//     let totalPrice = 0;
  
//     cartItems.forEach(function (cartItem) {
//       const product = products.find(function (product) {
//         return product._id?.toString() === cartItem._id;
//       });
  
//       if (product) {
//         const quantity = cartItem.cartQuantity;
//         const price = parseFloat(product.price);
//         totalPrice += quantity * price;
//       }
//     });
  
//     return totalPrice;
//   }

export const calculateTotalPrice = (products, cartItems) => {
        let totalPrice = 0;
  
        cartItems.forEach(function (cartItem) {
            const product = products.find(function (product) {
            return product._id?.toString() === cartItem._id;
        });
  
            if (product) {
                const quantity = cartItem.cartQuantity;
                const price = parseFloat(product.price);
                totalPrice += quantity * price;
            }
        });
  
    return totalPrice;
}


