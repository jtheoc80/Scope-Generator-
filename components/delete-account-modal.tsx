"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
    const [confirmation, setConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const { signOut } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleDelete = async () => {
        if (confirmation !== "DELETE") return;

        setLoading(true);
        try {
            const response = await fetch("/api/auth/delete", {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete account");
            }

            toast({
                title: "Account deleted",
                description: "Your account has been permanently deleted.",
            });

            // Sign out and redirect
            await signOut();
            window.location.href = "/";

        } catch (error) {
            console.error("Delete account error:", error);
            toast({
                title: "Error",
                description: "Failed to delete account. Please try again.",
                variant: "destructive",
            });
            setLoading(false);
            onClose();
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Account
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Are you sure you want to delete your account? This action is <strong>irreversible</strong>.
                        </p>
                        <p>
                            All your data, including proposals, company information, and settings will be permanently removed.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-2 space-y-2">
                    <Label htmlFor="confirmation" className="text-sm font-medium">
                        Type <strong>DELETE</strong> to confirm:
                    </Label>
                    <Input
                        id="confirmation"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="DELETE"
                        className="font-mono"
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={confirmation !== "DELETE" || loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Account"
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
