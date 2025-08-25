const { stripe } = require('../config/stripe');
const Ticket = require('../models/ticket');
const { validationResult } = require('express-validator');
const { HTTP_STATUS_CODE } = require('../utils/httpStatus');

/**
 * Create a payment intent for ticket purchase
 * @route POST /api/payments/create-payment-intent
 * @access Private
 */
const createPaymentIntent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const { ticket_id, email } = req.body;
    const user_id = req.user.id; // From JWT token

    // Verify ticket exists and is available
    const ticket = await Ticket.findByPk(ticket_id);
    if (!ticket) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.total_available <= 0) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: 'No tickets available for purchase'
      });
    }

    // Calculate amount in cents (Stripe expects amounts in cents)
    const amountInCents = Math.round(ticket.ticket_value * 100);

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        ticket_id: ticket_id.toString(),
        user_id: user_id.toString(),
        ticket_name: ticket.name,
        company_name: ticket.company_name
      },
      receipt_email: email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(HTTP_STATUS_CODE.CREATED).json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: amountInCents,
        currency: 'usd',
        ticket_id: ticket_id,
        ticket_name: ticket.name,
        ticket_value: ticket.ticket_value
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error creating payment intent',
      error: error.message
    });
  }
};

/**
 * Confirm payment completion and update ticket availability
 * @route POST /api/payments/confirm-payment
 * @access Private
 */
const confirmPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const { payment_intent_id, ticket_id } = req.body;
    const user_id = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (!paymentIntent) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Verify the payment intent belongs to the correct ticket and user
    if (paymentIntent.metadata.ticket_id !== ticket_id.toString() || 
        paymentIntent.metadata.user_id !== user_id.toString()) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        success: false,
        message: 'Payment intent does not match ticket or user'
      });
    }

    // Check if payment was successful
    if (paymentIntent.status === 'succeeded') {
      // Update ticket availability
      const ticket = await Ticket.findByPk(ticket_id);
      if (!ticket) {
        return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      if (ticket.total_available <= 0) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
          success: false,
          message: 'No tickets available for purchase'
        });
      }

      // Decrease available tickets
      await ticket.update({
        total_available: ticket.total_available - 1
      });

      res.status(HTTP_STATUS_CODE.OK).json({
        success: true,
        message: 'Payment confirmed and ticket purchased successfully',
        data: {
          payment_status: 'succeeded',
          payment_intent_id: payment_intent_id,
          ticket_id: ticket_id,
          remaining_tickets: ticket.total_available - 1
        }
      });
    } else {
      res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: 'Payment was not successful',
        data: {
          payment_status: paymentIntent.status,
          payment_intent_id: payment_intent_id
        }
      });
    }

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

/**
 * Get payment intent status
 * @route GET /api/payments/status/:payment_intent_id
 * @access Private
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { payment_intent_id } = req.params;
    const user_id = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (!paymentIntent) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Verify the payment intent belongs to the user
    if (paymentIntent.metadata.user_id !== user_id.toString()) {
      return res.status(HTTP_STATUS_CODE.FORBIDDEN).json({
        success: false,
        message: 'Payment intent does not belong to this user'
      });
    }

    res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      data: {
        payment_intent_id: payment_intent_id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      }
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error getting payment status',
      error: error.message
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus
}; 