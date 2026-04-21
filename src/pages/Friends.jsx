import { useState, useEffect } from 'react';
import '../styles/Friends.css';

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
import crown from "../assets/crown.svg";
import cap from "../assets/cap.svg";
import starGlasses from "../assets/star-glasses.svg";
import flowerGarland from "../assets/flower-garland.svg";

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

const SHOP_ITEMS = [
  { id: 1, name: "Pink Bow", image: pinkBow, slot: "head" },
  { id: 2, name: "Necktie", image: necktie, slot: "neck" },
  { id: 3, name: "Glasses", image: glasses, slot: "face" },
  { id: 4, name: "Collar", image: collar, slot: "neck" },
  { id: 5, name: "Crown", image: crown, slot: "head" },
  { id: 6, name: "Cap", image: cap, slot: "head" },
  { id: 7, name: "Star Glasses", image: starGlasses, slot: "face" },
  { id: 8, name: "Flower Garland", image: flowerGarland, slot: "neck" },
];

const SLOT_POSITIONS = {
  head: { position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: "70px", zIndex: 10 },
  neck: { position: "absolute", top: "57%", left: "50%", transform: "translateX(-50%)", height: "50px", zIndex: 10 },
  face: { position: "absolute", top: "34%", left: "50%", transform: "translateX(-50%)", width: "120px", zIndex: 10 },
};

const calculateLevel = (xp = 0) => {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2100) return 6;
  if (xp < 2800) return 7;
  if (xp < 3600) return 8;
  if (xp < 4500) return 9;
  return 10;
};

function Friends({ currentUser }) {
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchFriends();
      fetchPendingRequests();
    }
  }, [currentUser]);

  const fetchFriends = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/friends/${currentUser.id}`);
      const data = await res.json();
      setFriends(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/friends/${currentUser.id}/pending`);
      const data = await res.json();
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    }
  };

  const searchUser = async () => {
    if (!searchUsername.trim()) return;
    setSearched(true);
    setSearchResult(null);

    const res = await fetch(`http://localhost:5000/api/users/search?username=${encodeURIComponent(searchUsername.trim())}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResult(data);
    }
  };

  const sendRequest = async (receiverId) => {
    const res = await fetch('http://localhost:5000/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: currentUser.id, receiverId }),
    });
    if (res.ok) {
      setSentRequests(prev => [...prev, receiverId]);
    }
  };

  const respondToRequest = async (friendshipId, status) => {
    await fetch(`http://localhost:5000/api/friends/${friendshipId}/respond`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchPendingRequests();
    fetchFriends();
  };

  const viewProfile = async (friendId) => {
    const res = await fetch(`http://localhost:5000/api/users/${friendId}`);
    const data = await res.json();
    setSelectedFriend(data);
  };

  if (!currentUser?.id) return null;

  if (!currentUser?.id) return null;

  return (
    <div className="friends-card">
      <div className="friends-header">Friends</div>

      <div className="friends-body">
        {/* Search */}
        <div>
          <h3 className="friends-section-title">Search for a User</h3>
          <div className="friends-search-row">
            <input
              className="friends-search-input"
              type="text"
              value={searchUsername}
              onChange={(e) => { setSearchUsername(e.target.value); setSearched(false); setSearchResult(null); }}
              placeholder="Enter username"
              onKeyDown={(e) => e.key === 'Enter' && searchUser()}
            />
            <button className="friends-btn primary" onClick={searchUser}>Search</button>
          </div>

          {searched && !searchResult && <p className="friends-no-result">No users were found</p>}
          {searched && searchResult && (
            <div className="friends-search-result">
              {searchResult.id === currentUser.id ? (
                <p>You're already your own best friend, silly!</p>
              ) : (
                <>
                  <span className="friends-row-name">{searchResult.username}</span>
                  {sentRequests.includes(searchResult.id) ? (
                    <span className="friends-sent-msg">Friend request sent!</span>
                  ) : (
                    <button className="friends-btn primary" onClick={() => sendRequest(searchResult.id)}>Send Friend Request</button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <hr className="friends-divider" />

        {/* Pending Requests */}
        <div>
          <h3 className="friends-section-title">Pending Friend Requests</h3>
          <div className="friends-list">
            {pendingRequests.length === 0 && <p className="friends-empty">No pending requests.</p>}
            {pendingRequests.map(req => (
              <div key={req.id} className="friends-row">
                <span className="friends-row-msg">{req.requester.username} wants to be your friend</span>
                <div className="friends-row-actions">
                  <button className="friends-btn accept" onClick={() => respondToRequest(req.id, 'ACCEPTED')}>Accept</button>
                  <button className="friends-btn decline" onClick={() => respondToRequest(req.id, 'DECLINED')}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="friends-divider" />

        {/* Friends List */}
        <div>
          <h3 className="friends-section-title">Friends</h3>
          <div className="friends-list">
            {friends.length === 0 && <p className="friends-empty">No friends yet.</p>}
            {friends.map(f => {
              const friendUser = f.requesterId === currentUser.id ? f.receiver : f.requester;
              return (
                <div key={f.id} className="friends-row">
                  <span className="friends-row-name">{friendUser.username}</span>
                  <button className="friends-btn ghost" onClick={() => viewProfile(friendUser.id)}>View Profile</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Profile pop-up */}
      {selectedFriend && (
        <div className="friends-overlay" onClick={() => setSelectedFriend(null)}>
          <div className="friends-modal" onClick={e => e.stopPropagation()}>
            <div className="friends-modal-header">
              <span>{selectedFriend.username}&apos;s Profile</span>
              <button className="friends-modal-close" onClick={() => setSelectedFriend(null)}>✕</button>
            </div>
            <div className="friends-modal-body">

              {selectedFriend.petImage && (
                <div className="friends-pet-preview">
                  <img
                    src={petImageMap[selectedFriend.petImage] || selectedFriend.petImage}
                    alt="pet"
                    className="friends-pet-img"
                  />
                  {Object.entries(selectedFriend.equipped || {}).map(([slot, itemId]) => {
                    const item = SHOP_ITEMS.find(i => i.id === Number(itemId));
                    if (!item) return null;
                    return (
                      <img
                        key={slot}
                        src={item.image}
                        alt={item.name}
                        style={SLOT_POSITIONS[slot]}
                      />
                    );
                  })}
                </div>
              )}

              <p className="friends-modal-stat">{selectedFriend.username} and {selectedFriend.pet?.[0]?.name ?? "?"}</p>
              <p className="friends-modal-stat">⭐ Level {calculateLevel(selectedFriend.xp)}</p>
              <p className="friends-modal-stat">🪙 {selectedFriend.coins} coins</p>
              <p className="friends-modal-stat-label">Member since {new Date(selectedFriend.createdAt).toLocaleDateString()}</p>
              <button className="friends-btn ghost" onClick={() => setSelectedFriend(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Friends;
