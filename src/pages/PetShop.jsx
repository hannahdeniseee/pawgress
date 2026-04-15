import { useState, useEffect } from "react";
import { playSaveSfx } from "../utils/sfx.js";
import { useNavigate } from 'react-router-dom';
import "../styles/PetShop.css";

import pinkBow from "../assets/pink-bow.svg";
import necktie from "../assets/necktie.svg";
import glasses from "../assets/glasses.svg";
import collar from "../assets/collar.svg";
import coin from "../assets/coin.svg";
import shopBanner from "../styles/website-assets/shop-banner.png"

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

  // Load user data - FIRST from localStorage, THEN from backend
  const loadUser = () => {
    if (!userId) return;
    
    // FIRST: Load from localStorage for immediate display
    const savedUser = localStorage.getItem("user_data");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setCoins(userData.coins || 0);
      console.log("💰 PetShop loaded from localStorage:", userData.coins);
    }
    
    // THEN: Fetch from backend and sync
    const fetchFromBackend = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          const backendCoins = data.coins || 0;
          setCoins(backendCoins);
          setInventory(data.inventory?.map(a => a.accessoryId) || []);
          
          // Sync localStorage with backend
          const savedUserData = JSON.parse(localStorage.getItem("user_data") || "{}");
          savedUserData.coins = backendCoins;
          localStorage.setItem("user_data", JSON.stringify(savedUserData));
          console.log("✅ PetShop synced with backend:", backendCoins);
        }
      } catch (err) {
        console.error("Failed to load from backend:", err);
      }
    };
    
    fetchFromBackend();
  };

  // Listen for coin updates from Quests (real-time)
  useEffect(() => {
    const handleRewardUpdate = (event) => {
      console.log("💰 PetShop received reward event:", event.detail);
      if (event.detail && event.detail.coins !== undefined) {
        setCoins(event.detail.coins);
        console.log("💰 PetShop updated coins to:", event.detail.coins);
      }
    };
    
    window.addEventListener('userRewardsUpdated', handleRewardUpdate);
    
    return () => {
      window.removeEventListener('userRewardsUpdated', handleRewardUpdate);
    };
  }, []);

  // Also listen for localStorage changes (for cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user_data' && e.newValue) {
        const newData = JSON.parse(e.newValue);
        if (newData && newData.coins !== undefined) {
          setCoins(newData.coins);
          console.log("💰 PetShop storage change detected:", newData.coins);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Initial load
  useEffect(() => {
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
      // Deduct coins from backend
      const coinRes = await fetch(`http://localhost:5000/api/users/${userId}/coins`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: -item.price }), 
      });

      const coinData = await coinRes.json();
      const newCoins = coinData.coins;
      setCoins(newCoins);
      
      // Update localStorage
      const savedUser = localStorage.getItem("user_data");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.coins = newCoins;
        localStorage.setItem("user_data", JSON.stringify(userData));
      }
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('userRewardsUpdated', { 
        detail: { coins: newCoins, xp: 0 }
      }));

      // Add purchased item to inventory
      await fetch(`http://localhost:5000/api/users/${userId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessoryId: item.id }),
      });

      setInventory((inv) => [...inv, item.id]);

      showMessage(`Bought ${item.name}!`);
      console.log(`🛒 Purchased ${item.name}. New balance: ${newCoins}`);
    } catch (err) {
      console.error("Purchase error:", err);
      showMessage("Network error, try again.");
    }
  }

  const navigate = useNavigate();

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

                <div className="shop-price">
                  <img src={coin} alt="Coin" />
                  {item.price}
                </div>

                <button
                  onClick={() => { playSaveSfx(); buyItem(item); }}
                  disabled={purchased || !canAfford}
                  className="shop-button"
                  data-sfx="custom"
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
        <div className="shop-grid">
          {inventory.length === 0 && (
            <p className="inventory-empty">
              Your inventory is empty. Buy something from the shop!
            </p>
          )}

          {inventory.map((itemId) => {
            const item = getItem(itemId);
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

      <button 
        className="shop-button" 
        onClick={() => setActiveTab(activeTab === "inventory" ? "shop" : "inventory")}
      >
        {activeTab === "inventory" ? "◄ Back to Shop" : "Inventory"}
      </button>
    </div>
  );
}