import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { stripeService } from '@/lib/services/stripeService';
import { isStripeConfigured } from '@/lib/services/stripeClient';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reason, details } = body;

        // Save feedback
        // Even if saving feedback fails, we might still want to let them cancel? 
        // But for now let's assume valid saving is required.
        try {
            await storage.saveCancellationFeedback({
                userId,
                reason: reason || 'unknown',
                details: details,
            });
        } catch (err) {
            console.error('Error saving cancellation feedback:', err);
            // Continue to portal generation even if feedback save fails
        }

        // Generate Stripe Portal Link
        if (!isStripeConfigured()) {
            return NextResponse.json({ message: 'Stripe is not configured' }, { status: 503 });
        }

        const user = await storage.getUser(userId);
        if (!user?.stripeCustomerId) {
            return NextResponse.json({ message: 'No Stripe customer found' }, { status: 400 });
        }

        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const session = await stripeService.createCustomerPortalSession(
            user.stripeCustomerId,
            `${origin}/settings` // Redirect back to settings after portal
        );

        return NextResponse.json({ portalUrl: session.url });

    } catch (error) {
        console.error('[CANCELLATION_FEEDBACK] Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
