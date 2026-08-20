/**
 * AdminUserManagementTab.jsx
 * Administrator → "User Management" tab
 */
import React from 'react';
import { RefreshCw } from 'lucide-react';

const ROLES = ['Athlete', 'Coach', 'Physiotherapist', 'Sports Scientist', 'Administrator'];

export default function AdminUserManagementTab({
  allUsers, loadingUsers, onRefresh, onUpdateRole, onDeleteUser,
}) {
  if (loadingUsers) {
    return (
      <div className="content-hero-card animate-fade-in">
        <div className="hero-accent-strip" />
        <h2 className="workspace-title">User Account Management</h2>
        <div className="placeholder-tab-content">
          <RefreshCw className="placeholder-tab-icon animate-spin" size={32} />
          <p className="placeholder-tab-text">Syncing user database roster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-hero-card animate-fade-in">
      <div className="hero-accent-strip" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 className="workspace-title">User Account Management</h2>
          <p className="workspace-desc">View, assign, modify user roles, or delete system profiles globally.</p>
        </div>
        <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {allUsers.length === 0 ? (
        <p className="no-athletes-msg">No registered users found in the system registry.</p>
      ) : (
        <div style={{ marginTop: 20, overflowX: 'auto' }}>
          <table className="athletes-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>System Role</th>
                <th>Registration Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id}>
                  <td className="athlete-name">{u.fullname}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => onUpdateRole(u.id, e.target.value)}
                      className="form-select"
                      style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto', display: 'inline-block', margin: 0 }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onDeleteUser(u.id)}
                      className="form-submit-btn"
                      style={{ width: 'auto', padding: '4px 10px', margin: 0, backgroundColor: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Delete Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
