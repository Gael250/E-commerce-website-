import API from '../api/axios';

const CartItem = ({ item, onUpdate }) => {

    const updateQty = async (newQty) => {
        if (newQty < 1) return;
        await API.put(`/cart/${item.id}`, { quantity: newQty });
        onUpdate();
    };

    const removeItem = async () => {
        await API.delete(`/cart/${item.id}`);
        onUpdate();
    };

    return (
        <div className="flex items-center justify-between border-b py-4">
            <div className="flex items-center gap-4">
                <img
                    src={`http://localhost:5000/uploads/products/${item.image}`}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                />
                <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-500 text-sm">{item.price} RWF</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => updateQty(item.quantity - 1)}
                    className="w-8 h-8 border rounded text-lg font-bold"
                >-</button>

                <span className="w-8 text-center">{item.quantity}</span>

                <button
                    onClick={() => updateQty(item.quantity + 1)}
                    className="w-8 h-8 border rounded text-lg font-bold"
                >+</button>
            </div>

            <p className="font-medium">
                {item.price * item.quantity} RWF
            </p>

            <button
                onClick={removeItem}
                className="text-red-500 hover:text-red-700 text-sm"
            >Remove</button>
        </div>
    );
};

export default CartItem;