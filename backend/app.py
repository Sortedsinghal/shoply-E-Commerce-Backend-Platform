from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

DB_PATH = "inventory.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category TEXT
        )
    """)

    c.execute("SELECT COUNT(*) FROM products")
    count = c.fetchone()[0]

    # Only seed if empty
    if count == 0:
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

        c.executemany(
            "INSERT INTO products (name, category) VALUES (?, ?)",
            product_data
        )

    conn.commit()
    conn.close()


init_db()


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "").strip().lower()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    if user_input in ["show all", "show products", "list all"]:
        c.execute("SELECT name FROM products")
        matches = c.fetchall()
    else:
        c.execute(
            "SELECT name FROM products WHERE LOWER(name) = ? OR LOWER(category) = ?",
            (user_input, user_input)
        )
        matches = c.fetchall()

        if not matches:
            c.execute(
                "SELECT name FROM products WHERE LOWER(name) LIKE ? OR LOWER(category) LIKE ?",
                (f"%{user_input}%", f"%{user_input}%")
            )
            matches = c.fetchall()

    conn.close()

    reply = (
        "Here are some matching products:\n" +
        "\n".join([row[0] for row in matches])
        if matches else
        "Sorry, I couldn’t find any matching products."
    )

    return jsonify({"reply": reply})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
