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

const imageMap = {
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

const SHOP_ITEMS = [
  { id: 1, name: "Pink Bow", price: 60, image: pinkBow,  slot: "head" },
  { id: 2, name: "Necktie",  price: 60, image: necktie,  slot: "neck" },
  { id: 3, name: "Glasses",  price: 80, image: glasses,  slot: "face" },
  { id: 4, name: "Collar",   price: 50, image: collar,   slot: "neck" },
];

const SLOT_POSITIONS = {
  head: { position: "absolute", top: "10%",  left: "50%", transform: "translateX(-50%)"},
  neck: { position: "absolute", top: "57%", left: "50%", transform: "translateX(-50%)", height: "70px"},
  face: { position: "absolute", top: "34%", left: "50%", transform: "translateX(-50%)", width: "180px"},
};

const SLOTS = [...new Set(SHOP_ITEMS.map(i => i.slot))];
const TABS = ["All", ...SLOTS.map(s => s.charAt(0).toUpperCase() + s.slice(1))];

export default function PetCustomization({ userId }) {
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [petImage, setPetImage] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  // Load user data: inventory and currently equipped items
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadUser() {
      try {
        const res  = await fetch(`http://localhost:5000/api/users/${userId}`);
        const data = await res.json();

        setInventory(data.inventory.map((a) => a.accessoryId) || []);
        setEquipped(data.equipped || {});
        setPetImage(imageMap[data.petImage] || data.petImage || null);

      } catch (err) {
        console.error("loadUser failed:", err);
        showMessage("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    } 

    loadUser();
  }, [userId]);

  // Helper functions
  function getItem(id) {
    return SHOP_ITEMS.find((i) => i.id === Number(id));
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  }

  function isEquipped(itemId) {
    return Object.values(equipped).includes(itemId);
  }

  // Equip an item
  async function equipItem(item) {
    const newEquipped = { ...equipped, [item.slot]: item.id };

    try {
      await fetch(`http://localhost:5000/api/users/${userId}/equipped`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: item.slot, accessoryId: item.id }),
      });

      setEquipped(newEquipped);
      showMessage(`Equipped ${item.name}!`);
    } catch {
      showMessage("Network error, try again.");
    }
  }

  // Unequip an item
  async function unequipItem(item) {
    const newEquipped = { ...equipped };
    delete newEquipped[item.slot];

    try {
      await fetch(`http://localhost:5000/api/users/${userId}/equipped`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: item.slot }),
      });

      setEquipped(newEquipped);
      showMessage(`Unequipped ${item.name}.`);
    } catch {
      showMessage("Network error, try again.");
    }
  }

  if (loading) return <p>Loading...</p>;

  const ownedItems = inventory.map(getItem).filter(Boolean);

  const filteredItems = activeTab === "All"
    ? ownedItems
    : ownedItems.filter(item => item.slot.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="customization-page">

      {message && <div className="shop-message">{message}</div>}

      <img src={platform} className="platform"></img>
      <div className="pet-preview">
        {petImage ? (
          <img src={petImage} alt="Your pet" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <div className="pet-preview-empty">
            No pet yet!
          </div>
        )}

        {/* Accessory overlays */}
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

      {/* Scrollable Inventory Picker */}
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

      {/* Item Grid */}
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
              <img src={item.image} alt={item.name} width={48} height={48} />
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
