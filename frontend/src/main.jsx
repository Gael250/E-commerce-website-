import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Checkout from "./pages/checkout";
import OrderConfirm from "./pages/order-confirm";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirm" element={<OrderConfirm />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
