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
    <div style={{ 
      background: 'white', 
      borderRadius: '20px', 
      border: '2.5px solid #4E56C0',
      padding: '24px',
      width: '100%',
      maxWidth: '500px',
      margin: '20px auto',
      boxShadow: '0 4px 20px rgba(100, 120, 200, 0.12)',
      fontFamily: "'Jersey 15', 'Arial', sans-serif"
    }}>
      <h2 style={{ 
        marginBottom: '20px', 
        color: '#4E56C0',
        fontSize: '28px',
        textAlign: 'center',
        fontFamily: "'Jersey 15', serif"
      }}>
        🐾 My Companion 🐾
      </h2>

      {/* Show existing pet first if exists */}
      {hasPet && pets.map((pet) => (
        <div key={pet.id} style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <img 
            src={imageMap[pet.image] || pet.image} 
            alt={pet.breed} 
            style={{ 
              width: '150px', 
              height: '150px', 
              objectFit: 'contain',
              margin: '10px auto',
              display: 'block'
            }} 
          />
          <div style={{ 
            fontSize: '24px', 
            color: '#4E56C0',
            fontWeight: 'bold',
            marginTop: '10px'
          }}>
            {pet.breed}
          </div>
          <div style={{ 
            fontSize: '18px', 
            color: '#8890d8',
            marginTop: '5px'
          }}>
            {pet.type}
          </div>
        </div>
      ))}

      {/* Show adoption form if no pet */}
      {!hasPet && (
        <>
          {/* 1. Select Pet Type */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", color: "#4E56C0", marginBottom: "10px", fontFamily: "'Jersey 15', serif" }}>1. Select Pet Type</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              {Object.entries(petData).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => handleTypeSelect(key)}
                  style={{
                    flex: 1,
                    padding: "15px",
                    border: selectedType === key ? "2px solid #4E56C0" : "1px solid #ccc",
                    borderRadius: "12px",
                    cursor: "pointer",
                    backgroundColor: selectedType === key ? "#f0f2fc" : "#fff",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <img src={imageMap[data.image]} alt={data.name} style={{ width: "50px", height: "50px", objectFit: "contain" }} onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }} />
                  <span style={{ fontWeight: "bold", color: "#4E56C0", fontFamily: "'Jersey 15', serif", fontSize: "18px" }}>{data.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Select Breed */}
          {selectedType && (
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", color: "#4E56C0", marginBottom: "10px", fontFamily: "'Jersey 15', serif" }}>2. Select Breed</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                <select
                  value={selectedBreed}
                  onChange={(e) => setSelectedBreed(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    border: "2px solid #4E56C0",
                    borderRadius: "12px",
                    backgroundColor: "#fff",
                    color: "#4E56C0",
                    fontFamily: "'Jersey 15', serif",
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
                    style={{ width: "80px", height: "80px", objectFit: "contain", marginTop: "10px" }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Add Pet Button */}
          <button
            onClick={selectPet}
            disabled={!selectedType || !selectedBreed || hasPet}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "18px",
              border: "none",
              borderRadius: "999px",
              backgroundColor: (!selectedType || !selectedBreed || hasPet) ? "#ccc" : "#4E56C0",
              color: "#fff",
              fontWeight: "bold",
              cursor: (!selectedType || !selectedBreed || hasPet) ? "not-allowed" : "pointer",
              fontFamily: "'Jersey 15', serif",
              transition: "background 0.2s"
            }}
          >
            Adopt Companion
          </button>
        </>
      )}
    </div>
  );
}