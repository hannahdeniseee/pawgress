import { useState, useEffect, useRef } from "react";

import goldenDog from "../assets/golden-retriever-dog.svg";
import dalmatianDog from "../assets/dalmatian-dog.svg";
import beagleDog from "../assets/beagle-dog.svg";
import whiteCat from "../assets/white-cat.svg";
import blackCat from "../assets/black-cat.svg";
import orangeCat from "../assets/orange-cat.svg";
import blueBird from "../assets/blue-bird.svg";
import yellowBird from "../assets/yellow-bird.svg";
import pinkBird from "../assets/pink-bird.svg";

import starShape1 from "../assets/shapes/star-shape-1.svg";
import starShape2 from "../assets/shapes/star-shape-2.svg";
import starShape3 from "../assets/shapes/star-shape-3.svg";
import starShape4 from "../assets/shapes/star-shape-4.svg";
import starShape5 from "../assets/shapes/star-shape-5.svg";
import starShape6 from "../assets/shapes/star-shape-6.svg";
import starShape7 from "../assets/shapes/star-shape-7.svg";
import starShape8 from "../assets/shapes/star-shape-8.svg";
import catShape from "../assets/shapes/cat-shape.svg";
import dogShape from "../assets/shapes/dog-shape.svg";
import pedestal from "../assets/shapes/pedestal.svg";


const petData = {
  dog: {
    name: "Dog",
    image: goldenDog,
    breeds: [
      { name: "Golden Retriever", image: goldenDog },
      { name: "Dalmatian", image: dalmatianDog },
      { name: "Beagle", image: beagleDog },
    ],
  },
  cat: {
    name: "Cat",
    image: whiteCat,
    breeds: [
      { name: "Black Cat", image: blackCat },
      { name: "Orange Cat", image: orangeCat },
      { name: "White Cat", image: whiteCat }
    ],
  },
  bird: {
    name: "Bird",
    image: blueBird,
    breeds: [
      { name: "Yellow Bird", image: yellowBird },
      { name: "Pink Bird", image: pinkBird },
      { name: "Blue Bird", image: blueBird }
    ],
  },
};

/**
 * This component creates the animated shapes for the background of the app. It uses a canvas element to draw and animate cute shapes that move around the screen, creating a dynamic and visually appealing backdrop for the pet selection interface.
 */
const bgShapes = [
  {
    img: starShape8,
    size: 103,
    x: 53,
    y: -14,
    rotate: 0,
  },
  {
    img: starShape7,
    size: 233,
    x: -9,
    y: 584,
    rotate: -11.17,
  },
  {
    img: starShape6,
    size: 238,
    x: 1058,
    y: -68,
    rotate: 30,
  },
  {
    img: starShape5,
    size: 114,
    x: -30,
    y: 376,
    rotate: -10.38,
  },
  {
    img: starShape4,
    size: 95,
    x: 545,
    y: 671,
    rotate: 14.65,
  },
  {
    img: starShape3,
    size: 104,
    x: 1345,
    y: 469,
    rotate: 10.18,
  },
  {
    img: starShape2,
    size: 117,
    x: 629,
    y: 900,
    rotate: -12.23,
  },
  {
    img: starShape1,
    size: 103,
    x: 629,
    y: 0,
    rotate: 0,
  },
  {
    img: catShape,
    size: 257,
    x: 71,
    y: 37,
    rotate: 15,
    w: 247,
  },
  {
    img: dogShape,
    size: 237,
    x: 828,
    y: 482,
    rotate: -18.42,
    w: 334,
  },
];

function BackgroundShapes() {
  const renderShapes = (prefix) =>
    bgShapes.map((shape, i) => (
      <img
        key={`${prefix}-${i}`}
        src={shape.img}
        alt=""
        className="absolute"
        style={{
          width: `${((shape.w ?? shape.size) / 14.4)}vw`,
          height: `${shape.size / 14.4}vw`,
          left: `${(shape.x / 1440) * 100}%`,
          top: shape.y,
          transform: `rotate(${shape.rotate}deg)`,
          opacity: 0.7,
        }}
      />
    ));
 
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute inset-0"
        style={{ animation: "bgDrift 30s linear infinite" }}
      >
        {renderShapes("a")}
      </div>
      <div
        className="absolute inset-0"
        style={{
          animation: "bgDrift 30s linear infinite",
          animationDelay: "-15s",
          transform: "translateX(100%)",
        }}
      >
        {renderShapes("b")}
      </div>
      <style>{`
        @keyframes bgDrift {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

/**
 * This component is used to wrap the pet selection views and apply a smooth fade and slide animation whenever the user switches between different pet types or breeds. It listens for changes in the viewKey prop, which should be updated whenever the user selects a different pet type or breed, and triggers the animation accordingly.
 */
function AnimatedView({ viewKey, children }) {
  const [visible, setVisible] = useState(false);
  const prevKey = useRef(viewKey);
 
  useEffect(() => {
    if (prevKey.current !== viewKey) {
      setVisible(false);
      prevKey.current = viewKey;
    }
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [viewKey]);
 
  return (
    <div
      className="transition-all duration-400 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
      }}
    >
      {children}
    </div>
  );
}

/** This component renders a pedestal shape for displaying pets. */
function Pedestal({ className }) {
  return (
    <div className={`w-[120px] h-[41px] mt-[-14px] sm:w-[150px] sm:h-[51px] sm:mt-[-17px] lg:w-[175px] lg:h-[59.806px] lg:mt-[-20px] mx-auto ${className ?? ""}`}>
      <img src={pedestal} alt="" className="block w-full h-full" />
    </div>
  );
}

/** This component renders a title banner for the pet selection views. It supports responsive design for different screen sizes and for the different pets being selected (e.g., displays 'Cats' on the Pet Type selection view if 'Cat' was previously selected) */
function TitleBanner({ text }) {
  return (
    <div className="flex justify-center pt-10 sm:pt-16 lg:pt-20 px-4">
      <div className="relative w-full max-w-[581px] h-[70px] sm:h-[85px] lg:h-[105px] bg-gradient-to-b from-[#adbbfa] to-[#8799ed] rounded-[10px]">
        <div
          className="absolute border-3 border-[#4e56c0] border-solid inset-[-1.5px] pointer-events-none rounded-[11.5px]"
          style={{ boxShadow: "0px 4px 0px 0px rgba(78,86,192,0.5)" }}
        />
        <p className="absolute inset-0 flex items-center justify-center font-['Jersey_15',sans-serif] text-[40px] sm:text-[55px] lg:text-[75px] text-white text-center leading-none px-2">
          {text}
        </p>
        {[
          "left-[10px] top-[11px]",
          "right-[10px] top-[11px]",
          "right-[10px] bottom-[11px]",
          "left-[10px] bottom-[11px]",
        ].map((pos, i) => (
          <svg key={i} className={`absolute ${pos} size-[15px]`} viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="7.5" fill="white" />
          </svg>
        ))}
      </div>
    </div>
  );
}

/** This component renders a back button for navigating back to the previous view in the pet selection process. */
function BackButton({ onClick }) {
  return (
    <button
      className="absolute top-3 left-3 sm:top-6 sm:left-8 lg:top-[55px] lg:left-[72px] bg-white border-3 border-[#4e56c0] border-solid h-[50px] sm:h-[60px] lg:h-[74px] rounded-[30px] w-[120px] sm:w-[150px] lg:w-[185px] flex items-center gap-2 px-3 sm:px-4 cursor-pointer z-10 hover:bg-[#f0f2ff] transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center justify-center w-[25px] sm:w-[30px] lg:w-[40px] h-[20px] sm:h-[25px] lg:h-[31px] -rotate-90">
        <svg width="31" height="40" viewBox="0 0 31.4438 39.6514" fill="none" className="w-full h-full">
          <path
            d="M13.2474 1.77498C14.5762 0.297648 16.8676 0.297648 18.1965 1.77498L30.3153 15.2437C32.2914 17.4393 30.7348 20.888 27.8408 20.888H3.60313C0.709023 20.888 -0.847558 17.4393 1.12862 15.2437L13.2474 1.77498Z"
            fill="#4E56C0"
          />
        </svg>
      </div>
      <span className="font-['Jersey_15',sans-serif] text-[#4e56c0] text-[36px] sm:text-[48px] lg:text-[64px] leading-none">
        Back
      </span>
    </button>
  );
}

/** This component renders a select button for confirming the user's selection of a pet type or breed. It is disabled until the user has made a valid selection, and it triggers the appropriate action when clicked. */
function SelectButton({ onClick, disabled, label = "Select" }) {
  return (
    <div className="flex justify-center mt-8 sm:mt-10 lg:mt-12 pb-8">
      <button
        className="relative w-[160px] sm:w-[185px] lg:w-[207.433px] h-[48px] sm:h-[54px] lg:h-[59.925px] bg-gradient-to-b from-[#adbbfa] to-[#8799ed] rounded-[9.219px] cursor-pointer transition-opacity z-10"
        style={{ opacity: disabled ? 0.5 : 1 }}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="absolute border-[#4e56c0] border-[2.766px] border-solid inset-[-1.383px] pointer-events-none rounded-[10.602px]" />
        <p className="font-['Jersey_15',sans-serif] text-[28px] sm:text-[32px] lg:text-[36.877px] text-center text-white leading-none">
          {label}
        </p>
      </button>
    </div>
  );
}

/** This component renders a card for displaying a pet option in the selection process. It does the same for the pet type selection as well. */
function PetCard({ label, image, isSelected, isHovered, onHover, onLeave, onClick }) {
  const active = isSelected || isHovered;
  const PetImage = image;
 
  return (
    <div
      className="relative cursor-pointer select-none transition-transform duration-150 w-[200px] sm:w-[240px] lg:w-[272px]"
      style={{ transform: isHovered ? "scale(1.03)" : "scale(1)" }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = isHovered ? "scale(1.03)" : "scale(1)")}
      onClick={onClick}
    >
      <div
        className="bg-white border-[2.766px] border-solid rounded-[18.438px] w-full aspect-[272/400] transition-all"
        style={{ borderColor: "#4e56c0", boxShadow: "0px 4px 0px 0px rgba(78,86,192,0.5)" }}
      />
      <p
        className="absolute top-[6%] left-0 right-0 font-['Jersey_15',sans-serif] text-[36px] sm:text-[44px] lg:text-[50.706px] text-center leading-[0.75] transition-all"
        style={{
          color: active ? "white" : "#4e56c0",
          textShadow: active ? "0px 4px 0px rgba(78,86,192,0.5)" : "none",
          zIndex: 2,
        }}
      >
        {label}
      </p>
      <div className="absolute top-[17%] left-1/2 -translate-x-1/2 w-[70%] aspect-square flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full">
          <PetImage />
        </div>
      </div>
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[70%]">
        <Pedestal />
      </div>
      {active && (
        <>
          <div className="absolute inset-0 bg-[rgba(78,86,192,0.25)] rounded-[18.438px] pointer-events-none" />
          <div
            className="absolute inset-0 border-[2.766px] border-solid border-white rounded-[18.438px] pointer-events-none"
            style={{ boxShadow: "0px 4px 0px 0px rgba(78,86,192,0.5)" }}
          />
        </>
      )}
    </div>
  );
}

function PetDisplay({ pet, onRemove }) {
  const PetImage = pet.image;
  return (
    <div className="flex justify-center mt-10 sm:mt-14 lg:mt-16 px-4">
      <div
        className="bg-white border-[2.766px] border-solid border-[#4e56c0] rounded-[18.438px] w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[420px] p-6 flex flex-col items-center gap-4" 
        style={{ boxShadow: "0px 4px 0px 0px rgba(78,86,192,0.5)" }}
      >
        {/* CHANGED: <PetImage /> instead of <img src={pet.image}> */}
        <div className="relative w-[180px] sm:w-[220px] lg:w-[260px] h-[180px] sm:h-[220px] lg:h-[260px] overflow-hidden">
          <PetImage />
        </div>
        <Pedestal />
        <p className="font-['Jersey_15',sans-serif] text-[32px] sm:text-[40px] text-[#4e56c0] text-center leading-none mt-2">
          {pet.breed}
        </p>
        <span className="font-['Jersey_15',sans-serif] text-[20px] sm:text-[24px] bg-[#8799ed] text-white px-4 py-1 rounded-full">
          {pet.type}
        </span>
        <button
          onClick={() => onRemove(pet.id)}
          className="mt-2 font-['Jersey_15',sans-serif] text-[24px] sm:text-[28px] bg-[#f06060] text-white border-2 border-[#c04040] rounded-[10px] px-6 py-1 cursor-pointer hover:bg-[#d84848] transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function SelectPet() {
  const API_BASE = "http://localhost:5000/api";
  const userId = 1;
  const [pets, setPets] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedBreed, setSelectedBreed] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
 
  const hasPet = pets.length > 0;
  const currentView = hasPet ? "pet" : selectedType ? "breed" : "type";
 
  const handleTypeSelect = (typeKey) => {
    if (hasPet) return;
    setSelectedType(typeKey);
    setSelectedBreed("");
    setHoveredCard(null);
  };
 
  const handleBreedSelect = (breedName) => {
    if (hasPet) return;
    setSelectedBreed((prev) => (prev === breedName ? "" : breedName));
  };
 
  const selectPet = () => {
    if (hasPet || !selectedType || !selectedBreed) return;
    const breedInfo = petData[selectedType].breeds.find((b) => b.name === selectedBreed);
    if (!breedInfo) return;
    setPets([{ type: petData[selectedType].name, breed: selectedBreed, image: breedInfo.image, id: Date.now() }]);
    setSelectedType(null);
    setSelectedBreed("");
    setHoveredCard(null);
  };
 
  const removePet = (id) => setPets(pets.filter((p) => p.id !== id));
 
  const handleBack = () => {
    setSelectedBreed("");
    setSelectedType(null);
    setHoveredCard(null);
  };
 
  return (
    <div className="bg-gradient-to-b from-white to-[#f5d4e8] relative min-h-screen w-full overflow-hidden">
      <BackgroundShapes />
 
      {currentView === "breed" && <BackButton onClick={handleBack} />}
 
      <AnimatedView viewKey={currentView}>
        <div className="relative z-10">
          <TitleBanner
            text={
              currentView === "pet"
                ? "Your pet"
                : currentView === "breed" && selectedType
                ? `${petData[selectedType].name} Type Selection`
                : "Pet Selection"
            }
          />
 
          {currentView === "type" && (
            <div className="flex flex-wrap justify-center gap-5 sm:gap-8 lg:gap-10 mt-10 sm:mt-14 lg:mt-16 px-4">
              {Object.keys(petData).map((key) => {
                const data = petData[key];
                return (
                  <PetCard
                    key={key}
                    label={data.name}
                    image={data.image}
                    isSelected={false}
                    isHovered={hoveredCard === key}
                    onHover={() => setHoveredCard(key)}
                    onLeave={() => setHoveredCard(null)}
                    onClick={() => handleTypeSelect(key)}
                  />
                );
              })}
            </div>
          )}
 
          {currentView === "breed" && selectedType && (
            <>
              <div className="flex flex-wrap justify-center gap-5 sm:gap-8 lg:gap-10 mt-10 sm:mt-14 lg:mt-16 px-4">
                {petData[selectedType].breeds.map((breed) => (
                  <PetCard
                    key={breed.name}
                    label={breed.name}
                    image={breed.image}
                    isSelected={selectedBreed === breed.name}
                    isHovered={hoveredCard === breed.name}
                    onHover={() => setHoveredCard(breed.name)}
                    onLeave={() => setHoveredCard(null)}
                    onClick={() => handleBreedSelect(breed.name)}
                  />
                ))}
              </div>
              <SelectButton onClick={selectPet} disabled={!selectedBreed} label="Select" />
            </>
          )}
 
          {currentView === "pet" && <PetDisplay pet={pets[0]} onRemove={removePet} />}
        </div>
      </AnimatedView>
    </div>
  );
}