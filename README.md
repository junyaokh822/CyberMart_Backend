# CyberMart Backend 🛒

The REST API server for CyberMart, a full-stack e-commerce web application. Built with Node.js, Express, and MongoDB.

🌐 **Live Demo:** [https://cybermart-frontend.onrender.com](https://cybermart-frontend.onrender.com)  
🔗 **Frontend Repo:** [CyberMart_Frontend](https://github.com/junyaokh822/CyberMart_Frontend)

---

## Tech Stack

- **Node.js / Express** — REST API server
- **MongoDB / Mongoose** — database
- **JWT** — authentication
- **bcrypt** — password hashing
- **CORS** — cross-origin resource sharing

### Deployment

- **Backend:** Render Web Service
- **Database:** MongoDB Atlas

---

## Getting Started (Local Development)

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/junyaokh822/CyberMart_Backend
cd CyberMart_Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 4. Start the server

```bash
npm start
```

Server runs on [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable       | Description                 |
| -------------- | --------------------------- |
| `MONGO_URI`    | MongoDB connection string   |
| `JWT_SECRET`   | Secret key for JWT signing  |
| `PORT`         | Server port (default: 3000) |
| `FRONTEND_URL` | Allowed CORS origin         |

---

## API Endpoints

| Method | Endpoint                       | Description                 |
| ------ | ------------------------------ | --------------------------- |
| POST   | `/api/auth/register`           | Register a new user         |
| POST   | `/api/auth/login`              | Login                       |
| GET    | `/api/auth/profile`            | Get user profile            |
| PUT    | `/api/auth/profile`            | Update user profile         |
| PUT    | `/api/auth/password`           | Change password             |
| GET    | `/api/products`                | Get all products            |
| GET    | `/api/products/:id`            | Get single product          |
| POST   | `/api/products`                | Create product (admin)      |
| PUT    | `/api/products/:id`            | Update product (admin)      |
| DELETE | `/api/products/:id`            | Delete product (admin)      |
| GET    | `/api/cart`                    | Get user cart               |
| POST   | `/api/cart/items`              | Add item to cart            |
| PUT    | `/api/cart/items/:id`          | Update cart item quantity   |
| DELETE | `/api/cart/items/:id`          | Remove cart item            |
| DELETE | `/api/cart`                    | Clear cart                  |
| POST   | `/api/orders`                  | Place an order              |
| GET    | `/api/orders`                  | Get user orders             |
| PUT    | `/api/orders/:id/cancel`       | Cancel an order             |
| GET    | `/api/orders/admin/all`        | Get all orders (admin)      |
| PUT    | `/api/orders/admin/:id/status` | Update order status (admin) |
| GET    | `/api/wishlist`                | Get user wishlist           |
| POST   | `/api/wishlist`                | Add to wishlist             |
| DELETE | `/api/wishlist/:id`            | Remove from wishlist        |
| GET    | `/api/reviews/product/:id`     | Get product reviews         |
| POST   | `/api/reviews`                 | Create a review             |
| PUT    | `/api/reviews/:id`             | Update a review             |
| DELETE | `/api/reviews/:id`             | Delete a review             |

---

## Project Structure

```
CyberMart_Backend/
├── routes/               # Express route handlers
├── middleware/           # Auth & error middleware
├── db/                   # MongoDB connection
└── server.js             # Entry point
```

---

## License

MIT
