import { useEffect, useState } from "react";
import client from "../api/client";
import Icon from "../components/Icon";

export default function Notifications({ onRead }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { client.get("/notifications").then(response => setItems(response.data)).catch(() => setError("Alerts could not be loaded.")); }, []);
  const read = async item => { if (item.is_read) return; try { await client.post(`/notifications/${item.id}/read`); setItems(current => current.map(value => value.id === item.id ? { ...value, is_read: true } : value)); onRead?.(); } catch { setError("This alert could not be updated."); } };
  return <section className="page-enter"><div className="page-heading"><div><span className="eyebrow">ALERT CENTER</span><h1>Stay ahead of the signal.</h1><p>Assessment updates, risk notices, and recommended follow-through are collected here.</p></div><span className="roster-count"><Icon name="bell" size={18}/><b>{items.filter(item => !item.is_read).length}</b> unread</span></div>{error && <div className="notice-error">{error}</div>}<div className="notification-list">{items.length ? items.map(item => <button className={`notification ${item.is_read ? "read" : ""} ${item.severity}`} key={item.id} onClick={() => read(item)}><span className="notification-icon"><Icon name={item.severity === "critical" ? "shield" : "bell"} size={20}/></span><span><b>{item.title}</b><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString()}</small></span>{!item.is_read && <em>New</em>}</button>) : <div className="empty-card"><span className="empty-icon"><Icon name="bell" size={30}/></span><h3>No alerts right now.</h3><p>We will place assessment and recovery updates here as they arrive.</p></div>}</div></section>;
}
