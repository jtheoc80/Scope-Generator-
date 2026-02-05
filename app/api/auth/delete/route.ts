import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
    try {
        
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Optional: Check if user is an owner of a company with other members and prevent deletion?
        // For now, allow deletion and rely on cascade or manual cleanup if needed.

        // 1. Delete from database
        const success = await storage.deleteUser(userId);

        if (!success) {
            return NextResponse.json({ message: 'User not found in database' }, { status: 404 });
        }

        // 2. Delete from Clerk
        try {
            const client = await clerkClient();
            await client.users.deleteUser(userId);
        } catch (clerkError) {
            console.error('[AUTH_DELETE] Error deleting from Clerk:', clerkError);
            // We continue even if Clerk fails, as the DB record is gone. 
            // User won't be able to log in anyway because our app syncs users.
            // Ideally we should handle this more gracefully or retry.
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[AUTH_DELETE] Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
