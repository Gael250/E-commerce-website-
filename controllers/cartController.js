const db = require('../config/db');

// GET - View cart
const getCart = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT ci.id, ci.quantity, ci.price, p.name, p.image
        FROM cart c
        JOIN cart_items ci ON c.id = ci.cart_id
        JOIN products p ON ci.product_id = p.id
        WHERE c.user_id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json(results);
    });
};

// POST - Add item to cart
const addToCart = (req, res) => {
    const userId = req.user.id;
    const { product_id, quantity, price } = req.body;

    // Step 1: get or create cart
    db.query('SELECT id FROM cart WHERE user_id = ?', [userId], (err, cart) => {
        if (err) return res.status(500).json({ message: 'Server error' });

        const insertItem = (cartId) => {
            // Step 2: check if product already in cart
            db.query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id], (err, item) => {
                if (err) return res.status(500).json({ message: 'Server error' });

                if (item.length > 0) {
                    // Already in cart - just increase quantity
                    db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [item[0].quantity + quantity, item[0].id], (err) => {
                        if (err) return res.status(500).json({ message: 'Server error' });
                        res.json({ message: 'Cart updated' });
                    });
                } else {
                    // Not in cart - add it
                    db.query('INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [cartId, product_id, quantity, price], (err) => {
                        if (err) return res.status(500).json({ message: 'Server error' });
                        res.json({ message: 'Item added to cart' });
                    });
                }
            });
        };

        if (cart.length > 0) {
            insertItem(cart[0].id);          // cart exists
        } else {
            db.query('INSERT INTO cart (user_id) VALUES (?)', [userId], (err, newCart) => {
                if (err) return res.status(500).json({ message: 'Server error' });
                insertItem(newCart.insertId); // new cart created
            });
        }
    });
};

// PUT - Update item quantity
const updateCartItem = (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId], (err) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ message: 'Quantity updated' });
    });
};

// DELETE - Remove one item
const removeCartItem = (req, res) => {
    const { itemId } = req.params;

    db.query('DELETE FROM cart_items WHERE id = ?', [itemId], (err) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.json({ message: 'Item removed' });
    });
};

// DELETE - Clear entire cart
const clearCart = (req, res) => {
    const userId = req.user.id;

    db.query('SELECT id FROM cart WHERE user_id = ?', [userId], (err, cart) => {
        if (err) return res.status(500).json({ message: 'Server error' });

        db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].id], (err) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            res.json({ message: 'Cart cleared' });
        });
    });
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };