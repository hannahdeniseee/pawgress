import { useState } from "react";
import "../styles/PetShop.css";

import pinkBow from "../assets/pink-bow.svg";
import necktie from "../assets/necktie.svg";
import glasses from "../assets/glasses.svg";
import collar from "../assets/collar.svg";

const SHOP_ITEMS = [
  { id: "pinkBow", name: "Pink Bow", price: 60, image: pinkBow, slot: "head" },
  { id: "necktie", name: "Necktie", price: 60, image: necktie, slot: "neck" },
  { id: "glasses", name: "Glasses", price: 80, image: glasses, slot: "head" },
  { id: "collar", name: "Collar", price: 50, image: collar, slot: "head" },
];

const INITIAL_STATE = {
  coins: 200,
  inventory: [],
};

export default function PetAccessoryShop() {
  const [coins, setCoins] = useState(INITIAL_STATE.coins);
  const [inventory, setInventory] = useState(INITIAL_STATE.inventory);
  const [activeTab, setActiveTab] = useState("shop");
  const [message, setMessage] = useState("");

  function getItem(id) {
    return SHOP_ITEMS.find((i) => i.id === id);
  }

  function owns(itemId) {
    return inventory.includes(itemId);
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  function buyItem(item) {
    if (owns(item.id)) return showMessage("You already own this!");
    if (coins < item.price) return showMessage("Not enough coins!");

    setCoins((c) => c - item.price);
    setInventory((inv) => [...inv, item.id]);
    showMessage(`Bought ${item.name}!`);
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