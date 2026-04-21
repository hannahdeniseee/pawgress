import { useState, useEffect } from "react";
import { playSaveSfx } from "../utils/sfx.js";
import { PetShopCard } from "../components/PetShopCard";
import "../styles/PetShop.css";

import pinkBow from "../assets/pink-bow.svg";
import necktie from "../assets/necktie.svg";
import glasses from "../assets/glasses.svg";
import collar from "../assets/collar.svg";
import crown from "../assets/crown.svg";
import cap from "../assets/cap.svg";
import starGlasses from "../assets/star-glasses.svg";
import flowerGarland from "../assets/flower-garland.svg";
import coin from "../assets/coin.svg";
import shopBanner from "../styles/website-assets/shop-banner.png"

const SHOP_ITEMS = [
  { id: 1, name: "Pink Bow", price: 60, image: pinkBow, slot: "head" },
  { id: 2, name: "Necktie", price: 60, image: necktie, slot: "neck" },
  { id: 3, name: "Glasses", price: 80, image: glasses, slot: "face" },
  { id: 4, name: "Collar", price: 50, image: collar, slot: "neck" },
  { id: 5, name: "Crown", price: 200, image: crown, slot: "head" },
  { id: 6, name: "Cap", price: 60, image: cap, slot: "head" },
  { id: 7, name: "Star Glasses", price: 100, image: starGlasses, slot: "face" },
  { id: 8, name: "Flower Garland", price: 60, image: flowerGarland, slot: "neck" },
];

const API = "http://localhost:5000/api";

// Retriever current coins from local storage
const getLocalCoins = () => {
  try {
    return JSON.parse(localStorage.getItem("user_data"))?.coins ?? 0;
  } catch {
    return 0;
  }
};

// Change local coins from local storage
const setLocalCoins = (coins) => {
  try {
    const data = JSON.parse(localStorage.getItem("user_data") || "{}");
    localStorage.setItem("user_data", JSON.stringify({ ...data, coins }));
  } catch {
    localStorage.setItem("user_data", JSON.stringify({ coins }));
  }
};

export default function PetAccessoryShop({ userId }) {
  const [coins, setCoins] = useState(getLocalCoins);
  const [inventory, setInventory] = useState([]);
  const [activeTab, setActiveTab] = useState("shop");
  const [message, setMessage] = useState("");

  // Initialize the user
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${API}/users/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        const backendCoins = data.coins ?? 0;
        setCoins(backendCoins);
        setLocalCoins(backendCoins);
        setInventory(data.inventory?.map(a => a.accessoryId) ?? []);
      } catch (err) {
        console.error("Failed to load user from backend:", err);
      }
    })();
  }, [userId]);
    
  // Sync with other events to handle updates to coins and the inventory
  useEffect(() => {
    const onReward = (e) => {
      if (e.detail?.coins !== undefined) setCoins(e.detail.coins);
    };
    const onStorage = (e) => {
      if (e.key === "user_data" && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.coins !== undefined) setCoins(parsed.coins);
      }
    };
    window.addEventListener("userRewardsUpdated", onReward);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("userRewardsUpdated", onReward);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Helper function for the inventory
  function owns(itemId) {
    return inventory.includes(itemId);
  }

  // Helper function to show feedback
  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  // Function to handle purchasing items
  async function buyItem(item) {
    if (owns(item.id)) return showMessage("You already own this!");
    if (coins < item.price) return showMessage("Not enough coins!");

    try {
      // Deduct coins from backend
      const coinRes = await fetch(`${API}/users/${userId}/coins`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: -item.price }), 
      });

      const { coins: newCoins } = await coinRes.json();
      setCoins(newCoins);
      setLocalCoins(newCoins); // Update local storage
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('userRewardsUpdated', { 
        detail: { coins: newCoins, xp: 0 }
      }));

      // Add purchased item to inventory
      await fetch(`${API}/users/${userId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessoryId: item.id }),
      });

      setInventory((inv) => [...inv, item.id]);
      showMessage(`Bought ${item.name}!`);

    } catch (err) {
      console.error("Purchase error:", err);
      showMessage("Network error, try again.");
    }
  }

  return (    
    <div className="page">
      <img src={shopBanner} className="shop-banner" alt="Shop Banner" />

      {/* Number of coins */}
      <div className="shop-header">
        <img src={coin} className="coin-img" alt="Coin" />
        <span className="coin-display">{coins}</span>
      </div>

      {/* Message banner */}
      {message && <div className="shop-message">{message}</div>}

      {/* SHOP TAB */}
      {activeTab === "shop" && (
        <div className="shop-grid">
          {SHOP_ITEMS.map((item) => (
            <PetShopCard
              key={item.id}
              item={item}
              purchased={inventory.includes(item.id)}
              canAfford={coins >= item.price}
              onBuy={buyItem}
            />
          ))}
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="shop-grid">
          {inventory.length === 0 && (
            <p className="inventory-empty">
              Your inventory is empty. Buy something from the shop!
            </p>
          )}

          {inventory.map((itemId) => {
            const item = SHOP_ITEMS.find(i => i.id === Number(itemId));
            return (
              <div key={itemId} className="shop-card">
                <img src={item.image} alt={item.name} className="shop-image" />
                <div>
                  <strong>{item.name}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="shop-button" onClick={() => setActiveTab(t => t === "inventory" ? "shop" : "inventory")}>
        {activeTab === "inventory" ? "◄ Back to Shop" : "Inventory"}
      </button>
    </div>
  );
}