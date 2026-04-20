import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Friends from './Friends';
import '../styles/Social.css';

export default function Social({ currentUser }) {
  const { user, isAuthenticated } = useAuth0();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      const fetchData = async () => {
        try {
          const encodedId = encodeURIComponent(user.sub);
          const [profileRes, statsRes] = await Promise.all([
            fetch(`http://localhost:5000/api/profile/${encodedId}`),
            fetch(`http://localhost:5000/api/stats?auth0Id=${encodedId}`)
          ]);
          if (profileRes.ok) setProfile(await profileRes.json());
          if (statsRes.ok) setStats(await statsRes.json());
        } catch (err) {
          console.error("Error fetching profile data:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, user]);

  const chartData = [
    {
      name: 'Duration (Days)',
      'Account Age': stats?.accountAgeDays || 0,
      'Pet Ownership': stats?.petOwnershipDays || 0,
    }
  ];

  return (
    <div className="social-page">
      <div className="social-cards">
        {/* Profile Card */}
        <div className="social-card">
          <div className="social-card-header">My Profile</div>
          <div className="social-card-body">
            {loading ? (
              <p className="social-loading">Loading...</p>
            ) : profile ? (
              <>
                <div className="profile-info">
                  <img
                    className="profile-avatar"
                    src={profile.avatarUrl || user?.picture || 'https://via.placeholder.com/80'}
                    alt="Avatar"
                  />
                  <p className="profile-name">{profile.username || user?.nickname || 'Pawgress User'}</p>
                  <p className="profile-joined">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
                </div>
                <hr className="social-divider" />
                <h4 className="social-section-title">Your Companion</h4>
                {profile.pet && profile.pet.length > 0 ? (
                  <div className="profile-pet-card">
                    <img src={profile.pet[0].image} alt={profile.pet[0].type} className="profile-pet-img" />
                    <div>
                      <p className="profile-pet-detail"><strong>Type:</strong> {profile.pet[0].type}</p>
                      <p className="profile-pet-detail"><strong>Breed:</strong> {profile.pet[0].breed}</p>
                      <p className="profile-pet-detail"><strong>Adopted:</strong> {new Date(profile.pet[0].createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ) : (
                  <p className="social-empty">No pet adopted yet!</p>
                )}
              </>
            ) : (
              <p className="social-empty">No profile data found.</p>
            )}
          </div>
        </div>

        {/* Journey Statistics Card */}
        <div className="social-card">
          <div className="social-card-header">Journey Statistics</div>
          <div className="social-card-body">
            {loading ? (
              <p className="social-loading">Loading...</p>
            ) : (
              <div className="stats-chart-wrap">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: '#f0f2fc' }} />
                    <Legend />
                    <Bar dataKey="Account Age" fill="#8890d8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pet Ownership" fill="#4E56C0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Friends Card */}
        <Friends currentUser={currentUser} />
      </div>
    </div>
  );
}
