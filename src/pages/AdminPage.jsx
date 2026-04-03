/**
 * AdminPage.jsx — Wrapper page rendered at /admin route
 * This page is meant to be opened in a new browser tab.
 * It sets the document title and renders the full AdminPanel.
 */
import React, { useEffect } from 'react';
import AdminPanel from '../components/AdminPanel';

export default function AdminPage() {
  useEffect(() => {
    document.title = 'Admin Panel — ChatsGenZ';
  }, []);

  return <AdminPanel />;
}
