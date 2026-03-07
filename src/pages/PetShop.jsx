import { useState, useEffect } from "react";
import "../styles/PetShop.css";

import pinkBow from "../assets/pink-bow.svg";
import necktie from "../assets/necktie.svg";
import glasses from "../assets/glasses.svg";
import collar from "../assets/collar.svg";

const SHOP_ITEMS = [
  { id: 1, name: "Pink Bow", price: 60, image: pinkBow, slot: "head" },
  { id: 2, name: "Necktie", price: 60, image: necktie, slot: "neck" },
  { id: 3, name: "Glasses", price: 80, image: glasses, slot: "head" },
  { id: 4, name: "Collar", price: 50, image: collar, slot: "head" },
];

const INITIAL_STATE = {
  inventory: [],
};

export default function PetAccessoryShop({ userId }) {
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState(INITIAL_STATE.inventory);
  const [activeTab, setActiveTab] = useState("shop");
  const [message, setMessage] = useState("");

  useEffect(() => {
  if (!userId) return;

  async function loadUser() {
    const res = await fetch(`http://localhost:5000/api/users/${userId}`);
    const data = await res.json();

    setCoins(data.coins);
    setInventory(data.inventory.map(a => a.accessoryId) || []);
  }
    loadUser();
  }, [userId]);
  
  function getItem(id) {
    return SHOP_ITEMS.find((i) => i.id === Number(id));
  }

  function owns(itemId) {
    return inventory.includes(itemId);
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  async function buyItem(item) {
    if (owns(item.id)) return showMessage("You already own this!");
    if (coins < item.price) return showMessage("Not enough coins!");

    try {
      // Deduct coins
      const coinRes = await fetch(`http://localhost:5000/api/users/${userId}/coins`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: -item.price }), 
      });

      const coinData = await coinRes.json();
      setCoins(coinData.coins);

      // Add purchased item to inventory
      await fetch(`http://localhost:5000/api/users/${userId}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessoryId: item.id }),
    });

      setInventory((inv) => [...inv, item.id]);

      showMessage(`Bought ${item.name}!`);
    } catch {
      showMessage("Network error, try again.");
    }
  }

  return (
    <div className="shop-container">
      {/* Header */}
      <div className="shop-header">
        <h2>Pet Shop</h2>
        <span className="coin-display">💰 {coins} coins</span>
      </div>

      {/* Message banner */}
      {message && <div className="shop-message">{message}</div>}

      {/* Tabs */}
      <div className="shop-tabs">
        {["shop", "inventory"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "tab active" : "tab"}
          >
            {tab === "shop" ? "Shop" : `Inventory (${inventory.length})`}
          </button>
        ))}
      </div>

      {/* SHOP TAB */}
      {activeTab === "shop" && (
        <div className="shop-grid">
          {SHOP_ITEMS.map((item) => {
            const purchased = owns(item.id);
            const canAfford = coins >= item.price;

            return (
              <div
                key={item.id}
                className={`shop-card ${
                  !purchased && !canAfford ? "disabled" : ""
                }`}
              >
                <img src={item.image} alt={item.name} className="shop-image" />

                <strong>{item.name}</strong>

                <div className="shop-price">💰 {item.price}</div>

                <button
                  onClick={() => buyItem(item)}
                  disabled={purchased || !canAfford}
                  className="shop-button"
                >
                  {purchased ? "Owned ✓" : "Buy"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="inventory-list">
          {inventory.length === 0 && (
            <p className="inventory-empty">
              Your inventory is empty. Buy something from the shop!
            </p>
          )}

          {inventory.map((itemId) => {
            const item = getItem(itemId);
            return (
              <div key={itemId} className="inventory-row">
                <img src={item.image} alt={item.name} className="inventory-image" />
                <div>
                  <strong>{item.name}</strong>{" "}
                  <span className="inventory-slot">[{item.slot}]</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}