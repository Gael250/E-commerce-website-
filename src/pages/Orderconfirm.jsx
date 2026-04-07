
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function OrderConfirm() {
  const location = useLocation();
  const orderId = location.state?.orderId;

  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });
  }, [orderId]);

 
  const handleWhatsApp = () => {
    fetch('/api/whatsapp-redirect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: order.id,
        customerName: order.customerName,
        amount: order.totalPrice
      })
    })
      .then(res => res.json())
      .then(data => {
        setMessage('Opening WhatsApp...');
        window.open(data.whatsappUrl, '_blank');
      })
      .catch(err => console.log(err));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) return <p>Order not found</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Order Confirmed</h1>

      {message && <p className="text-green-600">{message}</p>}

      <p><b>Order ID:</b> {order.id}</p>
      <p><b>Name:</b> {order.customerName}</p>
      <p><b>Total:</b> ${order.totalPrice}</p>
      <p><b>Address:</b> {order.deliveryAddress}</p>

      <h3 className="mt-4 font-semibold">Items:</h3>
      <ul>
        {order.items && order.items.map((item, i) => (
          <li key={i}>
            {item.name} - {item.quantity} x ${item.price}
          </li>
        ))}
      </ul>

      <button
        onClick={handleWhatsApp}
        className="mt-6 bg-green-500 text-white px-4 py-2"
      >
        WhatsApp Shopkeeper
      </button>
    </div>
  );
}

export default OrderConfirm;
