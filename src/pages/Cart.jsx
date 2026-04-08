import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';

const Cart = () => {
    const [cart, setCart] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const { setCartCount } = useCart();
    const navigate = useNavigate();

    const fetchCart = async () => {
        try {
            const res = await API.get('/cart');
            setCart(res.data);
            const sum = res.data.reduce((acc, item) => acc + item.price * item.quantity, 0);
            setTotal(sum);
            setCartCount(res.data.length);
        } catch (err) {
            console.error('Failed to fetch cart', err);
        } finally {
            setLoading(false);
        }
    };

    const clearCart = async () => {
        await API.delete('/cart/clear');
        fetchCart();
    };

    useEffect(() => {
        fetchCart();
    }, []);

    if (loading) return <p className="text-center mt-10">Loading cart...</p>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">My Cart</h1>

            {cart.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 mb-4">Your cart is empty</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-black text-white px-6 py-2 rounded"
                    >Shop Now</button>
                </div>
            ) : (
                <>
                    {cart.map(item => (
                        <CartItem key={item.id} item={item} onUpdate={fetchCart} />
                    ))}

                    <div className="mt-6 flex justify-between items-center">
                        <button
                            onClick={clearCart}
                            className="text-red-500 border border-red-500 px-4 py-2 rounded hover:bg-red-50"
                        >Clear Cart</button>

                        <div className="text-right">
                            <p className="text-lg font-bold">Total: {total} RWF</p>
                            <button
                                onClick={() => navigate('/checkout')}
                                className="mt-2 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                            >Proceed to Checkout</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;