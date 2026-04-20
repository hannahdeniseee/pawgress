import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/PetCustomization.css";

import goldenDog from "../assets/golden-retriever-dog.svg";
import dalmatianDog from "../assets/dalmatian-dog.svg";
import beagleDog from "../assets/beagle-dog.svg";
import whiteCat from "../assets/white-cat.svg";
import blackCat from "../assets/black-cat.svg";
import orangeCat from "../assets/orange-cat.svg";
import blueBird from "../assets/blue-bird.svg";
import yellowBird from "../assets/yellow-bird.svg";
import pinkBird from "../assets/pink-bird.svg";
import pinkBow from "../assets/pink-bow.svg";
import necktie from "../assets/necktie.svg";
import glasses from "../assets/glasses.svg";
import collar from "../assets/collar.svg";
import platform from "../assets/platform.svg";

const SHOP_ITEMS = [
  { id: 1, name: "Pink Bow", price: 60, image: pinkBow, slot: "head" },
  { id: 2, name: "Necktie", price: 60, image: necktie, slot: "neck" },
  { id: 3, name: "Glasses", price: 80, image: glasses, slot: "face" },
  { id: 4, name: "Collar", price: 50, image: collar, slot: "neck" },
];

// Map accessory image positions, consistent throughout all 3 pets
const SLOT_POSITIONS = {
  head: { position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "80px", zIndex: 10 },
  neck: { position: "absolute", top: "57%", left: "50%", transform: "translateX(-50%)", height: "70px", zIndex: 10 },
  face: { position: "absolute", top: "34%", left: "50%", transform: "translateX(-50%)", width: "180px", zIndex: 10 },
};

// Shop tabs according to the different accessory types
const SLOTS = [...new Set(SHOP_ITEMS.map(i => i.slot))];
const TABS = ["All", ...SLOTS.map(s => s.charAt(0).toUpperCase() + s.slice(1))];

// Map source file images
const petImageMap = {
  "../assets/golden-retriever-dog.svg": goldenDog,
  "../assets/dalmatian-dog.svg": dalmatianDog,
  "../assets/beagle-dog.svg": beagleDog,
  "../assets/white-cat.svg": whiteCat,
  "../assets/black-cat.svg": blackCat,
  "../assets/orange-cat.svg": orangeCat,
  "../assets/blue-bird.svg": blueBird,
  "../assets/yellow-bird.svg": yellowBird,
  "../assets/pink-bird.svg": pinkBird,
};

// COnstant API link base
const API_BASE = "http://localhost:5000/api/users";

// Helper function to fetch API calls
async function apiCall(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

export default function PetCustomization({ userId }) {
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [petImage, setPetImage] = useState(goldenDog);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  // Load initial data
  useEffect(() => {
    if (!userId) { 
      setLoading(false); return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/${userId}`);
        const data = await res.json();
        setInventory(data.inventory?.map((a) => a.accessoryId) || []);
        setEquipped(data.equipped || {});
        if (data.petImage && petImageMap[data.petImage]) {
          setPetImage(petImageMap[data.petImage]);
        }
      } catch (err) {
        console.error("loadUserData failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Helper function to list accessories
  function getItem(id) {
    return SHOP_ITEMS.find((i) => i.id === Number(id));
  }

  // Helper function to show feedback pop-ups
  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  // Helper function to check if an item is equipped
  function isEquipped(itemId) {
    return Object.values(equipped).includes(itemId);
  }

  // Function to equip an item
  async function equipItem(item) {
    try {
      const res = await apiCall(`${API_BASE}/${userId}/equipped`, "PUT", {
        slot: item.slot,
        accessoryId: item.id,
      });
      if (res.ok) {
        setEquipped({ ...equipped, [item.slot]: item.id });
        showMessage(`Equipped ${item.name}!`);
      } else {
        showMessage("Failed to equip item.");
      }
    } catch (err) {
      showMessage("Network error, try again.");
    }
  }

  // Function to unequip an item
  async function unequipItem(item) {
    try {
        const res = await apiCall(`${API_BASE}/${userId}/equipped`, "DELETE", {
        slot: item.slot,
      });
      if (res.ok) {
        const newEquipped = { ...equipped };
        delete newEquipped[item.slot];
        setEquipped(newEquipped);
        showMessage(`Unequipped ${item.name}.`);
      } else {
        showMessage("Failed to unequip item.");
      }
    } catch (err) {
      showMessage("Network error, try again.");
    }
  }

  // List owned items
  const ownedItems = inventory.map(getItem).filter(Boolean);

  // List the owned items per shop tab
  const filteredItems = activeTab === "All"
    ? ownedItems
    : ownedItems.filter(item => item.slot.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="customization-page">
      {message && <div className="shop-message">{message}</div>}

      <img src={platform} className="platform" alt="Platform" />
      
      {/* Pet image */}
      <div className="pet-preview">
        <img src={petImage} alt="Your pet"/>

        {/* Equipped items */}
        {Object.entries(equipped).map(([slot, itemId]) => {
          const item = getItem(itemId);
          if (!item) return null;
          return (
            <img
              key={slot}
              src={item.image}
              alt={item.name}
              style={SLOT_POSITIONS[slot]}
              className="accessory-img"
            />
          );
        })}
      </div>

      {/* Inventory tabs */}
      <div className="inventory-picker">
        <div className="filter-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`filter-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Inventory content */}
        <div className="inventory-grid">
          {filteredItems.length === 0 && (
            <p className="inventory-empty">
              {ownedItems.length === 0
                ? "You don't own any accessories yet. Visit the shop!"
                : `No ${activeTab.toLowerCase()} items owned yet.`}
            </p>
          )}

          {filteredItems.map((item) => {
            const alreadyEquipped = isEquipped(item.id);
            return (
              <div key={item.id} className={`inventory-item ${alreadyEquipped ? "equipped" : ""}`}>
                <img src={item.image} alt={item.name}/>
                <div className="item-name">{item.name}</div>
                <button
                  className={`item-btn ${alreadyEquipped ? "unequip" : "equip"}`}
                  onClick={() => alreadyEquipped ? unequipItem(item) : equipItem(item)}
                >
                  {alreadyEquipped ? "Unequip" : "Equip"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}