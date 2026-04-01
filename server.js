const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const productCatalog = {
  "my-business-strategy-online": {
    name: "Mijn bedrijfsstrategie (Online)",
    price: 4800
  },
  "my-business-strategy-physical": {
    name: "Mijn bedrijfsstrategie (Physical)",
    price: 6800
  }
};

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { cart, customer } = req.body;
    console.log("REQ BODY:", req.body);
    console.log("CUSTOMER:", customer);

    console.log("CART FROM FRONTEND:", cart);
    console.log("CUSTOMER FROM FRONTEND:", customer);

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const line_items = cart.map((item) => {
      const product = productCatalog[item.id];

      if (!product) {
        throw new Error(`Unknown product id: ${item.id}`);
      }

      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: product.name
          },
          unit_amount: product.price
        },
        quantity: Number(item.qty) || 1
      };
    });

const session = await stripe.checkout.sessions.create({
  customer_email: customer?.email || undefined,
  metadata: {
    debugFullName: customer?.fullName || "EMPTY",
    debugEmail: customer?.email || "EMPTY",
    debugPhone: customer?.phone || "EMPTY",
    debugAddress: customer?.address || "EMPTY",
    debugCountry: customer?.country || "EMPTY",
    debugCity: customer?.city || "EMPTY",
    debugPostcode: customer?.postcode || "EMPTY",
    paymentMethod: "pay_now"
  },
  mode: "payment",
  line_items,
  success_url: "https://www.65xgroup.com/nl/payment?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "https://www.65xgroup.com/nl/cart"
});

    console.log("STRIPE SESSION CREATED:", session.id);

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || "Stripe session error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});