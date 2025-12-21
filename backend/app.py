from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import sqlite3

app = Flask(__name__)

# ✅ Enable CORS globally (simplest + safest for dev)
CORS(app)

def init_db():
    conn = sqlite3.connect('inventory.db')
    c = conn.cursor()
    c.execute('DROP TABLE IF EXISTS products')
    c.execute('CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT)')
    product_data = [
        ("iPhone 14 Pro", "electronics"),
        ("Samsung Galaxy S22", "electronics"),
        ("Dell XPS 15", "electronics"),
        ("Apple AirPods Pro", "electronics"),
        ("Logitech MX Master 3", "electronics"),
        ("Atomic Habits", "books"),
        ("The Alchemist", "books"),
        ("Rich Dad Poor Dad", "books"),
        ("Zero to One", "books"),
        ("Nike Running Shoes", "apparel"),
        ("Adidas T-shirt", "apparel"),
        ("Blue Denim Shirt", "apparel"),
        ("H&M Cotton Dress", "apparel"),
        ("Levi’s Slim Fit Jeans", "apparel"),
        ("L'Oreal Moisturizer", "beauty"),
        ("Nykaa Lipstick", "beauty"),
        ("Nivea Face Wash", "beauty"),
        ("Lakme Kajal", "beauty"),
        ("Maybelline Foundation", "beauty"),
    ]

    for i in range(1, 81):
        product_data.append((f"Product {i}", "misc"))

    for name, category in product_data:
        c.execute('INSERT INTO products (name, category) VALUES (?, ?)', (name, category))

    conn.commit()
    conn.close()

init_db()

@app.route("/api/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        return response, 200

    user_input = request.json["message"].strip().lower()

    conn = sqlite3.connect("inventory.db")
    c = conn.cursor()

    if user_input in ["show all", "show products", "list all"]:
        c.execute("SELECT name FROM products")
        matches = c.fetchall()
    else:
        c.execute("""
            SELECT name FROM products
            WHERE LOWER(name) = ? OR LOWER(category) = ?
        """, (user_input, user_input))
        matches = c.fetchall()

        if not matches:
            c.execute("""
                SELECT name FROM products
                WHERE LOWER(name) LIKE ? OR LOWER(category) LIKE ?
            """, (f"%{user_input}%", f"%{user_input}%"))
            matches = c.fetchall()

    conn.close()

    reply = (
        "Here are some matching products:\n" + "\n".join([row[0] for row in matches])
        if matches else
        "Sorry, I couldn’t find any matching products."
    )

    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(port=5001, debug=True)

