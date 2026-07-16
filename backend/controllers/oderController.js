import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import { DELIVERY_ALLOWED_STATUSES, USER_ROLES } from "../constants/roles.js";
import { sendOrderSuccessEmail } from "../utils/loginEmail.js";
import { emitOrderUpdate } from "../utils/orderRealtime.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    console.log("Order request received:", req.body);

    if (!req.body.items || !req.body.amount || !req.body.address) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const userId = req.userId || req.user?.id;

    if (!userId) {
      return res.json({
        success: false,
        message: "Not Authorized Login Again",
      });
    }

    const newOrder = new orderModel({
      userId: userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const subtotal = req.body.items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const freeDeliveryThreshold = 15000;
    const deliveryFeeAmount = 400;
    const deliveryFee =
      subtotal === 0
        ? 0
        : subtotal > freeDeliveryThreshold
          ? 0
          : deliveryFeeAmount;

    const line_items = req.body.items.map((item) => ({
      price_data: {
        currency: "lkr",
        product_data: {
          name: item.name, // Product name
        },
        unit_amount: Number(item.price) * 100, 
      },
      quantity: item.quantity, 
    }));

    //*delivery charge part 
    if (deliveryFee > 0) {
      line_items.push({
        price_data: {
          currency: "lkr",
          product_data: {
            name: "Delivery Charges",
          },
          unit_amount: deliveryFee * 100, 
        },
        quantity: 1,
      });
    }

    
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment", 
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    // Send session URL back to frontend
    res.json({ success: true, success_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success == "true") {
      const order = await orderModel.findById(orderId);

      if (!order) {
        return res.json({ success: false, message: "Order not found" });
      }

      const alreadyPaid = Boolean(order.payment);
      if (!alreadyPaid) {
        await orderModel.findByIdAndUpdate(orderId, { payment: true });
      }

      let emailStatus = "skipped";
      if (!alreadyPaid) {
        try {
          const customer = await userModel
            .findById(order.userId)
            .select("name email");
          const customerName =
            customer?.name || order.address?.firstName || "Customer";
          const customerEmail = customer?.email || order.address?.email || "";

          await sendOrderSuccessEmail({
            name: customerName,
            email: customerEmail,
            orderId: order._id?.toString(),
            amount: order.amount,
          });
          emailStatus = "sent";
        } catch (emailError) {
          emailStatus = `error: ${emailError?.message || emailError}`;
          console.error(
            "Failed to send order success email:",
            emailError?.message || emailError,
          );
        }
      }

      res.json({ success: true, message: "paid", emailStatus });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({
        success: false,
        message: "Not Paid",
        emailStatus: "not-sent",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};


const userOrders = async (req, res) => {
  try {
   
    const userId = req.userId || req.body.userId;

    if (!userId) {
      return res.json({ success: false, message: "User ID not found" });
    }

    const orders = await orderModel.find({ userId: userId }).sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};


const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Update order status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, kitchenStaff, deliveryStaff } = req.body;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const role = req.user?.role;
    const normalizedRole =
      role === USER_ROLES.STAFF ? USER_ROLES.MANAGEMENT_STAFF : role;

    if (
      status &&
      normalizedRole === USER_ROLES.DELIVERY_STAFF &&
      !DELIVERY_ALLOWED_STATUSES.includes(status)
    ) {
      return res.json({
        success: false,
        message: "Delivery staff can only set Out for delivery or Delivered",
      });
    }

    const updateObj = {};
    if (status) updateObj.status = status;
    if (kitchenStaff !== undefined) updateObj.kitchenStaff = kitchenStaff;
    if (deliveryStaff !== undefined) updateObj.deliveryStaff = deliveryStaff;

    if (Object.keys(updateObj).length === 0) {
      return res.json({
        success: false,
        message:
          "Either status, kitchenStaff, or deliveryStaff is required to update",
      });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      updateObj,
      { new: true },
    );

    if (updatedOrder) {
      emitOrderUpdate(updatedOrder.toObject());
    }

    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.userId || req.body.userId;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const order = await orderModel.findOne({ _id: orderId, userId });

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: "Error" });
  }
};

export {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  getSingleOrder,
};
