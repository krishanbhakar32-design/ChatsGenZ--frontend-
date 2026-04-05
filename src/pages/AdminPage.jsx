/**
 * AdminPage.jsx — Wrapper page rendered at /admin route
 * This page is meant to be opened in a new browser tab.
 * It sets the document title and renders the full AdminPanel.
 *
 * FIX: Import path corrected from '../components/AdminPanel'
 *      to './admin/AdminPanel' (file lives at src/pages/admin/AdminPanel.jsx)
 */
import React, { useEffect } from 'react';
import AdminPanel from './admin/AdminPanel';

export default function AdminPage() {
  useEffect(() => {
    document.title = 'Admin Panel — ChatsGenZ';
  }, []);

  return <AdminPanel />;
}
