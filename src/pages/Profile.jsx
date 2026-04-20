import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Friends from './Friends.jsx';
import PawBackground from "../components/PawBackground";
import "../styles/Profile.css";

const Profile = ({ currentUser }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRewards, setUserRewards] = useState({ coins: 0, xp: 0 });

  useEffect(() => {
    const savedUser = localStorage.getItem("user_data");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUserRewards({ coins: userData.coins || 0, xp: userData.xp || 0 });
    } else {
      localStorage.setItem("user_data", JSON.stringify({ coins: 0, xp: 0 }));
    }
  }, []);

  useEffect(() => {
    const handleRewardUpdate = (event) => {
      if (event.detail) {
        setUserRewards({ coins: event.detail.coins || 0, xp: event.detail.xp || 0 });
      }
    };
    
    window.addEventListener('userRewardsUpdated', handleRewardUpdate);
    
    return () => {
      window.removeEventListener('userRewardsUpdated', handleRewardUpdate);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      const fetchProfileData = async () => {
        try {
            setLoading(true);
          
            const encodedId = encodeURIComponent(user.sub);

            const [profileRes, statsRes] = await Promise.all([
                fetch(`http://localhost:5000/api/profile/${encodedId}`),
                fetch(`http://localhost:5000/api/stats?auth0Id=${encodedId}`)
            ]);

            if (!profileRes.ok) throw new Error('Profile not found');

            const profileData = await profileRes.json();
            const statsData = await statsRes.json();

            setProfile(profileData);
            setStats(statsData);
            } catch (err) {
            setError(err.message);
            } finally {
            setLoading(false);
            }
        };

        fetchProfileData();
        } else if (!authLoading && !isAuthenticated) {
        setLoading(false);
        setError('Please log in to view your profile.');
        }
    }, [isAuthenticated, user, authLoading]);

    if (authLoading || loading) return <div className="loading-spinner">Loading Profile...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;
    if (!profile) return <div>No profile data found.</div>;

    const chartData = [
        {
        name: 'Duration (Days)',
        'Account Age': stats?.accountAgeDays || 0,
        'Pet Ownership': stats?.petOwnershipDays || 0,
        }
    ];

    return (
        <div className="profile-container">
        
          {/* Profile Header */}
          <div className="profile-header">
            <img className="profile-avatar" src={profile.avatarUrl || user?.picture || 'https://via.placeholder.com/100'} alt="User Avatar" />
            <div>
              <h2 className="profile-name">{profile.username || user?.nickname || 'Pawgress User'}</h2>
              <p className="profile-join-date">Joined: {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Rewards Section - 2 cards in one row */}
          <div className="rewards-container">
            <h3 className="section-title">💰 Your Rewards</h3>
            <div className="rewards-row">
              <div className="rewards-card">
                <div className="rewards-value">{userRewards.coins}</div>
                <div className="rewards-label">🐾 Coins</div>
              </div>
              <div className="rewards-card">
                <div className="rewards-value">{userRewards.xp}</div>
                <div className="rewards-label">⭐ XP Points</div>
              </div>
            </div>
          </div>

          {/* Pet Information */}
          <div className="pet-section">
            <h3 className="section-title">🐾 Your Companion</h3>
            {profile.pet && profile.pet.length > 0 ? (
              <div className="pet-card">
                <div>
                  <p className="pet-name"><strong>Name:</strong> {profile.pet[0].name}</p>
                  <p className="pet-info"><strong>Type:</strong> {profile.pet[0].type}</p>
                  <p className="pet-info"><strong>Breed:</strong> {profile.pet[0].breed}</p>
                  <p className="pet-info"><strong>Adopted:</strong> {new Date(profile.pet[0].createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div className="no-pet-card">
                <p className="no-pet-text">You haven't adopted a pet yet! Head over to the selection page to find your new companion.</p>
              </div>
            )}
          </div>
          
          {/* Statistics */}
          <div className="stats-section">
            <h3 className="section-title">📊 Journey Statistics</h3>
            <div className="stats-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{ fill: '#f5f5f5' }} />
                  <Legend />
                  <Bar dataKey="Account Age" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pet Ownership" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Friends Section */}
          <div className="friends-section">
            <h3 className="section-title">👥 Your Friends</h3>
            {currentUser && <Friends currentUser={currentUser} />}
          </div>

        </div>
    );
};

export default Profile;