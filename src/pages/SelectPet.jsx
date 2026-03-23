import { useState, useEffect } from "react";
import goldenDog from "../assets/golden-retriever-dog.svg";
import dalmatianDog from "../assets/dalmatian-dog.svg";
import beagleDog from "../assets/beagle-dog.svg";
import whiteCat from "../assets/white-cat.svg";
import blackCat from "../assets/black-cat.svg";
import orangeCat from "../assets/orange-cat.svg";
import blueBird from "../assets/blue-bird.svg";
import yellowBird from "../assets/yellow-bird.svg";
import pinkBird from "../assets/pink-bird.svg";

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

const petData = {
  dog: {
    name: "Dog",
    image: "../assets/golden-retriever-dog.svg",
    breeds: [
      { name: "Golden Retriever", image: "../assets/golden-retriever-dog.svg" },
      { name: "Dalmatian", image: "../assets/dalmatian-dog.svg" },
      { name: "Beagle", image: "../assets/beagle-dog.svg" },
    ],
  },
  cat: {
    name: "Cat",
    image: "../assets/white-cat.svg",
    breeds: [
      { name: "Black Cat", image: "../assets/black-cat.svg" },
      { name: "Orange Cat", image: "../assets/orange-cat.svg" },
      { name: "White Cat", image: "../assets/white-cat.svg" }
    ],
  },
  bird: {
    name: "Bird",
    image: "../assets/blue-bird.svg",
    breeds: [
      { name: "Yellow Bird", image: "../assets/yellow-bird.svg" },
      { name: "Pink Bird", image: "../assets/pink-bird.svg" },
      { name: "Blue Bird", image: "../assets/blue-bird.svg" }
    ],
  },
};

export default function SelectPet({ currentUser }) {
  const [pets, setPets] = useState([]);

  useEffect(() => {
  if (!currentUser) return;

  fetch(`http://localhost:5000/api/profile/${currentUser.auth0Id}`)
    .then(res => res.json())
    .then(data => {
      console.log("pet from DB:", data.pet);
      if (data.pet && data.pet.length > 0) {
        setPets(data.pet);
      }
    })
    .catch(err => console.error("Failed to load pet:", err));
  }, [currentUser]);

  const [selectedType, setSelectedType] = useState(null);
  const [selectedBreed, setSelectedBreed] = useState("");

  // Helper to check if the user already has a pet
  const hasPet = pets.length > 0;

  const handleTypeSelect = (typeKey) => {
    // Prevent interaction if they already have a pet
    if (hasPet) return; 
    setSelectedType(typeKey);
    setSelectedBreed("");
  };

  const selectPet = async () => {
    // Check if they already have a pet before adding
    if (hasPet) {
      alert("You can only have one pet at a time!");
      return;
    }

    if (selectedType && selectedBreed) {
      const breedInfo = petData[selectedType].breeds.find(b => b.name === selectedBreed);
      console.log("currentUser:", currentUser);
      try {
        const res = await fetch("http://localhost:5000/api/pets/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            type: petData[selectedType].name,
            breed: selectedBreed,
            image: breedInfo.image,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error);
          return;
        }

        const newPet = await res.json();
        setPets([newPet]);
        setSelectedType(null);
        setSelectedBreed("");

      } catch (err) {
        console.error(err);
        alert("Failed to save pet");
      }
    }
  };

  const removePet = (id) => setPets(pets.filter((pet) => pet.id !== id));

  const currentBreedImage = selectedType && selectedBreed 
    ? petData[selectedType].breeds.find(b => b.name === selectedBreed)?.image 
    : null;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "40px"}}>
      <h2 style={{ marginBottom: "20px", color: "#fff" }}>
        {hasPet ? "Your Companion" : "Pet Selection"}
      </h2>

      {/* 1. Select Pet Type */}
      {!hasPet && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", color: "#fff", marginBottom: "10px" }}>1. Select Pet Type</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            {Object.entries(petData).map(([key, data]) => (
              <button
                key={key}
                onClick={() => handleTypeSelect(key)}
                style={{
                  flex: 1,
                  padding: "15px",
                  border: selectedType === key ? "2px solid #4CAF50" : "1px solid #ccc",
                  borderRadius: "12px",
                  cursor: "pointer",
                  backgroundColor: selectedType === key ? "#f0f9f0" : "#fff",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <img src={imageMap[data.image]} alt={data.name} style={{ width: "40px", height: "40px", objectFit: "contain" }} onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }} />
                <span style={{ fontWeight: "bold", color: "#222" }}>{data.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Select Breed */}
      {selectedType && !hasPet && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "16px", color: "#fff", marginBottom: "10px" }}>2. Select Breed</h3>
          <div style={{ display: "grid", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <select
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
              style={{
                flex: 1,
                padding: "15px",
                fontSize: "16px",
                border: "1px solid #ccc",
                borderRadius: "12px",
                backgroundColor: "#fff",
                color: "#666",
                height: "50px",
                boxSizing: "border-box"
              }}
            >
              <option value="" disabled>Choose a breed...</option>
              {petData[selectedType].breeds.map((breed) => (
                <option key={breed.name} value={breed.name}>{breed.name}</option>
              ))}
            </select>
            {currentBreedImage && (
              <img 
                src={imageMap[currentBreedImage]}
                alt="Preview" 
                style={{ borderRadius: "8px", objectFit: "fill", border: "1px solid #ccc" }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      )}

      {/* Add Pet Button */}
      {!hasPet && (
        <button
          onClick={selectPet}
          disabled={!selectedType || !selectedBreed || hasPet}
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "16px",
            border: "none",
            borderRadius: "12px",
            backgroundColor: (!selectedType || !selectedBreed || hasPet) ? "#ccc" : "#4CAF50",
            color: "#fff",
            fontWeight: "bold",
            cursor: (!selectedType || !selectedBreed || hasPet) ? "not-allowed" : "pointer",
            height: "50px",
            marginBottom: "30px",
            transition: "background 0.2s"
          }}
        >
          {hasPet ? "Limit Reached" : "Add Pet"}
        </button>
      )}

      {/* Pet List */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {pets.map((pet) => (
          <li key={pet.id} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 15px",
            marginBottom: "10px",
            borderRadius: "12px",
            backgroundColor: "#f5f5f5",
            boxShadow: "0 3px 6px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <img src={imageMap[pet.image] || pet.image} alt={pet.breed} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
              <div>
                <span style={{ fontSize: "16px", color: "#222", fontWeight: "bold", marginRight: "10px" }}>{pet.breed}</span>
                <span style={{ fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px", backgroundColor: "#4CAF50", color: "#fff", verticalAlign: "middle" }}>
                  {pet.type}
                </span>
              </div>
            </div>
            <button
              onClick={() => removePet(pet.id)}
              style={{
                backgroundColor: "#f44336",
                color: "#fff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                transition: "background 0.2s"
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}