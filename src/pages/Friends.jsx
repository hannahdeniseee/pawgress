import { useState, useEffect } from 'react';

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
    <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0' }}>
      <h2>Friends</h2>

      <div>
        <h3>Search for a User</h3>
        <input
          type="text"
          value={searchUsername}
          onChange={(e) => { setSearchUsername(e.target.value); setSearched(false); setSearchResult(null); }}
          placeholder="Enter username"
          onKeyDown={(e) => e.key === 'Enter' && searchUser()}
        />
        <button onClick={searchUser}>Search</button>

        {searched && !searchResult && <p>No users were found</p>}
        {searched && searchResult && (
          <div>
            {searchResult.id === currentUser.id ? (
              <p>You're already your own best friend, silly!</p>
            ) : (
              <div>
                <p>{searchResult.username}</p>
                {sentRequests.includes(searchResult.id) ? (
                  <p>Friend request sent!</p>
                ) : (
                  <button onClick={() => sendRequest(searchResult.id)}>Send Friend Request</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h3>Pending Friend Requests</h3>
        {pendingRequests.length === 0 && <p>No pending requests.</p>}
        {pendingRequests.map(req => (
          <div key={req.id}>
            <span>{req.requester.username} wants to be your friend</span>
            <button onClick={() => respondToRequest(req.id, 'ACCEPTED')}>Accept</button>
            <button onClick={() => respondToRequest(req.id, 'DECLINED')}>Decline</button>
          </div>
        ))}
      </div>

      <div>
        <h3>Friends</h3>
        {friends.length === 0 && <p>No friends yet.</p>}
        {friends.map(f => {
          const friendUser = f.requesterId === currentUser.id ? f.receiver : f.requester;
          return (
            <div key={f.id}>
              <span>{friendUser.username}</span>
              <button onClick={() => viewProfile(friendUser.id)}>View Profile</button>
            </div>
          );
        })}
      </div>

      {selectedFriend && (
        <div style={{ border: '1px solid #aaa', padding: '1rem', marginTop: '1rem' }}>
          <h3>{selectedFriend.username}&apos;s Profile</h3>
          {selectedFriend.avatarUrl && (
            <img src={selectedFriend.avatarUrl} alt={selectedFriend.username} width={60} style={{ borderRadius: '50%' }} />
          )}
          <p>Coins: {selectedFriend.coins}</p>
          <p>Member since: {new Date(selectedFriend.createdAt).toLocaleDateString()}</p>
          <button onClick={() => setSelectedFriend(null)}>Close</button>
        </div>
      )}
    </div>
  );
}

export default Friends;
