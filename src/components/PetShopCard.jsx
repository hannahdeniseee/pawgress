import coin from "../assets/coin.svg";
import "../styles/PetShop.css";

export function PetShopCard({ item, purchased, canAfford, onBuy }) {
  return (
    <div className={`shop-card ${!purchased && !canAfford ? "disabled" : ""}`}>
      <img src={item.image} alt={item.name} className="shop-image" />
      <strong>{item.name}</strong>
      <div className="shop-price">
        <img src={coin} alt="Coin" /> {item.price}
      </div>
      <button
        onClick={() => onBuy(item)}
        disabled={purchased || !canAfford}
        className="shop-button"
      >
        {purchased ? "Owned ✓" : "Buy"}
      </button>
    </div>
  );
}