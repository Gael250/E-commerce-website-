exports.validateWhatsApp = (req, res, next) => {
  const { orderId, customerName, amount } = req.body;

  if (!orderId || !customerName || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: orderId, customerName, amount'
    });
  }

  next();
};
