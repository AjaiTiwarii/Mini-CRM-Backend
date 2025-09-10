-- Sample customers for testing segmentation
INSERT INTO customers (email, name, phone, total_spent, order_count, last_order_date) VALUES
('john.doe@example.com', 'John Doe', '+91-9876543210', 15000.00, 5, '2024-08-15 10:30:00'),
('jane.smith@example.com', 'Jane Smith', '+91-9876543211', 8500.50, 3, '2024-09-01 14:20:00'),
('alice.johnson@example.com', 'Alice Johnson', '+91-9876543212', 25000.75, 8, '2024-07-20 09:15:00'),
('bob.wilson@example.com', 'Bob Wilson', '+91-9876543213', 3200.00, 2, '2024-06-10 16:45:00'),
('sarah.brown@example.com', 'Sarah Brown', '+91-9876543214', 18900.25, 6, '2024-08-25 11:30:00'),
('mike.davis@example.com', 'Mike Davis', '+91-9876543215', 5600.00, 4, '2024-05-15 13:20:00')
ON CONFLICT (email) DO NOTHING;

-- Sample orders for customer activity
INSERT INTO orders (customer_id, amount, order_date) 
SELECT 
    c.id,
    (RANDOM() * 3000 + 500)::DECIMAL(10,2),
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '60 days')
FROM customers c, generate_series(1, 2) gs
WHERE c.email LIKE '%@example.com';