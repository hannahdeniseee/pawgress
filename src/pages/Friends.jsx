import { useState, useEffect } from 'react';
import '../styles/Friends.css';

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

      {/* Profile Modal */}
      {selectedFriend && (
        <div className="friends-overlay" onClick={() => setSelectedFriend(null)}>
          <div className="friends-modal" onClick={e => e.stopPropagation()}>
            <div className="friends-modal-header">
              <span>{selectedFriend.username}&apos;s Profile</span>
              <button className="friends-modal-close" onClick={() => setSelectedFriend(null)}>✕</button>
            </div>
            <div className="friends-modal-body">
              {selectedFriend.avatarUrl && (
                <img className="friends-modal-avatar" src={selectedFriend.avatarUrl} alt={selectedFriend.username} />
              )}
              <p className="friends-modal-stat">{selectedFriend.username}</p>
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
