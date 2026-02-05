// Force dynamic rendering to prevent static generation errors
// This page uses useAuth() which requires QueryClientProvider
export const dynamic = 'force-dynamic';

import GeneratorClient from './generator-client';

export default function Generator() {
  return <GeneratorClient />;
}
