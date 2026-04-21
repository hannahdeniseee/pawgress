import { useState, useEffect, useRef } from "react";
import "../styles/SelectPet.css";

import goldenDog from "../assets/golden-retriever-dog.svg";
import dalmatianDog from "../assets/dalmatian-dog.svg";
import beagleDog from "../assets/beagle-dog.svg";
import whiteCat from "../assets/white-cat.svg";
import blackCat from "../assets/black-cat.svg";
import orangeCat from "../assets/orange-cat.svg";
import blueBird from "../assets/blue-bird.svg";
import yellowBird from "../assets/yellow-bird.svg";
import pinkBird from "../assets/pink-bird.svg";

import goldenDogIdle from "../assets/golden-retriever-dog-idle.gif";
import goldenDogActive from "../assets/golden-retriever-dog-active.gif";
import dalmatianDogIdle from "../assets/dalmatian-dog-idle.gif";
import dalmatianDogActive from "../assets/dalmatian-dog-active.gif";
import beagleDogIdle from "../assets/beagle-dog-idle.gif";
import beagleDogActive from "../assets/beagle-dog-active.gif";

import whiteCatIdle from "../assets/white-cat-idle.gif";
import whiteCatActive from "../assets/white-cat-active.gif";
import orangeCatIdle from "../assets/orange-cat-idle.gif";
import orangeCatActive from "../assets/orange-cat-active.gif";
import blackCatIdle from "../assets/black-cat-idle.gif";
import blackCatActive from "../assets/black-cat-active.gif";

import blueBirdIdle from "../assets/blue-bird-idle.gif";
import blueBirdActive from "../assets/blue-bird-active.gif";
import yellowBirdIdle from "../assets/yellow-bird-idle.gif";
import yellowBirdActive from "../assets/yellow-bird-active.gif";
import pinkBirdIdle from "../assets/pink-bird-idle.gif";
import pinkBirdActive from "../assets/pink-bird-active.gif";

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
  
  "../assets/golden-retriever-dog-idle.gif": goldenDogIdle,
  "../assets/golden-retriever-dog-active.gif": goldenDogActive,
  "../assets/dalmatian-dog-idle.gif": dalmatianDogIdle,
  "../assets/dalmatian-dog-active.gif": dalmatianDogActive,
  "../assets/beagle-dog-idle.gif": beagleDogIdle,
  "../assets/beagle-dog-active.gif": beagleDogActive,
  "../assets/white-cat-idle.gif": whiteCatIdle,
  "../assets/white-cat-active.gif": whiteCatActive,
  "../assets/black-cat-idle.gif": blackCatIdle,
  "../assets/black-cat-active.gif": blackCatActive,
  "../assets/orange-cat-idle.gif": orangeCatIdle,
  "../assets/orange-cat-active.gif": orangeCatActive,
  "../assets/blue-bird-idle.gif": blueBirdIdle,
  "../assets/blue-bird-active.gif": blueBirdActive,
  "../assets/yellow-bird-idle.gif": yellowBirdIdle,
  "../assets/yellow-bird-active.gif": yellowBirdActive,
  "../assets/pink-bird-idle.gif": pinkBirdIdle,
  "../assets/pink-bird-active.gif": pinkBirdActive,
};

const soundMap = {
  dog: "/sfx-dog.wav",
  cat: "/sfx-cat.wav",
  bird: "/sfx-bird.wav",
};

const petData = {
  dog: {
    name: "Dog",
    image: "../assets/golden-retriever-dog.svg",
    activeImage: "../assets/golden-retriever-dog-active.gif",
    breeds: [
      { name: "Golden Retriever", image: "../assets/golden-retriever-dog.svg", activeImage: "../assets/golden-retriever-dog-active.gif" },
      { name: "Dalmatian", image: "../assets/dalmatian-dog.svg", activeImage: "../assets/dalmatian-dog-active.gif" },
      { name: "Beagle", image: "../assets/beagle-dog.svg", activeImage: "../assets/beagle-dog-active.gif" },
    ],
  },
  cat: {
    name: "Cat",
    image: "../assets/white-cat.svg",
    activeImage: "../assets/white-cat-active.gif",
    breeds: [
      { name: "Black Cat", image: "../assets/black-cat.svg", activeImage: "../assets/black-cat-active.gif" },
      { name: "Orange Cat", image: "../assets/orange-cat.svg", activeImage: "../assets/orange-cat-active.gif" },
      { name: "White Cat", image: "../assets/white-cat.svg", activeImage: "../assets/white-cat-active.gif" }
    ],
  },
  bird: {
    name: "Bird",
    image: "../assets/blue-bird.svg",
    activeImage: "../assets/blue-bird-active.gif",
    breeds: [
      { name: "Yellow Bird", image: "../assets/yellow-bird.svg", activeImage: "../assets/yellow-bird-active.gif" },
      { name: "Pink Bird", image: "../assets/pink-bird.svg", activeImage: "../assets/pink-bird-active.gif" },
      { name: "Blue Bird", image: "../assets/blue-bird.svg", activeImage: "../assets/blue-bird-active.gif" }
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
  const [petName, setPetName] = useState(""); 
  const [hoveredType, setHoveredType] = useState(null);
  const sfxRefs = useRef({});

  const getSfx = (typeKey) => {
    if (!sfxRefs.current[typeKey]) {
      sfxRefs.current[typeKey] = new Audio(soundMap[typeKey]);
      sfxRefs.current[typeKey].preload = "auto";
    }
    return sfxRefs.current[typeKey];
  };

  // Helper to check if the user already has a pet
  const hasPet = pets.length > 0;

  const playTypeSound = (typeKey) => {
    const sfx = getSfx(typeKey);
    sfx.currentTime = 0;
    sfx.play().catch((err) => console.warn("Audio play failed:", err));
  };

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

    if (!petName.trim()) {
      alert("Please give your companion a name!");
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
            name: petName.trim(),
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
        setPetName("");

      } catch (err) {
        console.error(err);
        alert("Failed to save pet");
      }
    }
  };

  const currentBreedImage = selectedType && selectedBreed 
    ? petData[selectedType].breeds.find(b => b.name === selectedBreed)?.image 
    : null;
  
  const getTypeButtonImage = (key, data) => {
    if (hoveredType === key) {
      return imageMap[data.activeImage];
    }
    return imageMap[data.image];
  };

return (
  <div className="companion-card">
    <h2 className="companion-title">🐾 My Companion 🐾</h2>

    {/* Show existing pet first if exists */}
    {hasPet && pets.map((pet) => (
      <div key={pet.id} className="companion-pet-display">
        <img
          src={imageMap[pet.image] || pet.image}
          alt={pet.breed}
          className="companion-pet-image"
        />
        <div className="companion-pet-breed">{pet.breed}</div>
        <div className="companion-pet-type">{pet.type}</div>
      </div>
    ))}

    {/* Show adoption form if no pet */}
    {!hasPet && (
      <>
        {/* 1. Select Pet Type */}
        <div className="companion-section">
          <h3 className="companion-section-title">1. Select Pet Type</h3>
          <div className="companion-type-row">
            {Object.entries(petData).map(([key, data]) => (
              <button
                key={key}
                onClick={() => handleTypeSelect(key)}
                onMouseEnter={() => setHoveredType(key)}
                onMouseLeave={() => setHoveredType(null)}
                className={`companion-type-btn${selectedType === key ? " selected" : ""}`}
              >
                <img
                  src={getTypeButtonImage(key, data)}
                  alt={data.name}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
                />
                <span>{data.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Select Breed */}
        {selectedType && (
          <div className="companion-section">
            <h3 className="companion-section-title">2. Select Breed</h3>
            <div className="companion-breed-wrapper">
              <select
                value={selectedBreed}
                onChange={(e) => setSelectedBreed(e.target.value)}
                className="companion-breed-select"
              >
                <option value="" disabled>Choose a breed...</option>
                {petData[selectedType].breeds.map((breed) => (
                  <option key={breed.name} value={breed.name}>{breed.name}</option>
                ))}
              </select>
              {currentBreedImage && (
                <img
                  src={imageMap[petData[selectedType].breeds.find(b => b.name === selectedBreed)?.activeImage]}
                  alt="Preview"
                  className="companion-breed-preview"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          </div>
        )}

        {/* 3. Name your pet */}
        {selectedType && selectedBreed && (
          <div className="companion-section">
            <h3 className="companion-section-title">3. Name Your Companion</h3>
            <input
              type="text"
              placeholder="Enter a name..."
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              maxLength={30}
            />
          </div>
        )}

        {/* Adopt Button */}
        <button
          onClick={selectPet}
          disabled={!selectedType || !selectedBreed || hasPet}
          className="companion-adopt-btn"
        >
          Adopt Companion
        </button>
      </>
    )}
  </div>
);
}