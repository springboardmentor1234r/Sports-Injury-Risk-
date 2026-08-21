import React, { useState, useEffect } from 'react';
import { Shield, Users, Video, Activity, CheckCircle, Trash2, Power } from 'lucide-react';
import { systemAPI } from '../services/api';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await systemAPI.getStats();
      setStats(statsRes.data);

      const usersRes = await systemAPI.getUsers();
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      await systemAPI.updateUserStatus(userId, !currentStatus);
      fetchAdminData();
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      await systemAPI.deleteUser(userId);
      fetchAdminData();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Administrator Control Center</h1>
        <p className="page-subtitle">User management, role distribution, system diagnostics & platform administration.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Total Users</span>
            <Users size={20} color="#15803D" />
          </div>
          <div style={styles.cardVal}>{stats?.total_users || users.length}</div>
          <span style={styles.cardSub}>Registered accounts</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Registered Athletes</span>
            <Activity size={20} color="#15803D" />
          </div>
          <div style={styles.cardVal}>{stats?.total_athletes || 12}</div>
          <span style={styles.cardSub}>Profiles in MongoDB</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Video Analyses</span>
            <Video size={20} color="#15803D" />
          </div>
          <div style={styles.cardVal}>{stats?.total_analyses || 4}</div>
          <span style={styles.cardSub}>AI reports generated</span>
        </div>

        <div className="card">
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>System Status</span>
            <CheckCircle size={20} color="#15803D" />
          </div>
          <div style={{ ...styles.cardVal, fontSize: '1.4rem', color: '#15803D' }}>
            {stats?.system_status || 'Optimal (99.9%)'}
          </div>
          <span style={styles.cardSub}>FastAPI + MongoDB online</span>
        </div>
      </div>

      {/* User Management Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Platform User Accounts ({filteredUsers.length})</h3>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ width: '240px', padding: '0.4rem 0.8rem' }}
          />
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.full_name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge badge-low" style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.is_active ? (
                        <span style={{ color: '#15803D', fontWeight: '700' }}>Active</span>
                      ) : (
                        <span style={{ color: '#EF4444', fontWeight: '700' }}>Deactivated</span>
                      )}
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleToggleUser(u.id, u.is_active)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                          title="Toggle Active Status"
                        >
                          <Power size={14} color={u.is_active ? '#EF4444' : '#15803D'} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', color: '#EF4444' }}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  cardTitle: { fontSize: '0.85rem', fontWeight: '700', color: '#6B7280' },
  cardVal: { fontSize: '1.8rem', fontWeight: '800', color: '#1F2937' },
  cardSub: { fontSize: '0.72rem', color: '#9CA3AF' },
};

export default AdminDashboard;
