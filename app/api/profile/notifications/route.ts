import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailNotificationsEnabled, smsNotificationsEnabled } = body;
    
    // Coerce and validate - handle both boolean and string values
    const preferences: { emailNotificationsEnabled?: boolean; smsNotificationsEnabled?: boolean } = {};
    
    if (emailNotificationsEnabled !== undefined) {
      preferences.emailNotificationsEnabled = emailNotificationsEnabled === true || emailNotificationsEnabled === 'true';
    }
    if (smsNotificationsEnabled !== undefined) {
      preferences.smsNotificationsEnabled = smsNotificationsEnabled === true || smsNotificationsEnabled === 'true';
    }
    
    const user = await storage.updateNotificationPreferences(userId, preferences);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const { userStripeSecretKey, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { message: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
