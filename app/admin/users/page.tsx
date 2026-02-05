// Force dynamic rendering to prevent static generation errors
// This page uses useAuth() which requires QueryClientProvider
export const dynamic = 'force-dynamic';

import AdminUsersClient from './admin-users-client';

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
