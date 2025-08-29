
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/icons/logo';
import { forgotPassword } from '@/lib/auth';
import React from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const mobile_no = formData.get('mobile_no') as string;

    try {
      await forgotPassword(mobile_no);
      setSubmitted(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
       <Card className="mx-auto max-w-sm">
        <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center pb-4">
                <Logo className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Request Sent</CardTitle>
            <CardDescription>
                If an account with that mobile number exists, a password reset link
                has been sent. Please check for instructions.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Back to Login</Link>
            </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center pb-4">
          <Logo className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl">Forgot Password</CardTitle>
        <CardDescription>
          Enter your mobile number and we will send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mobile_no">Mobile Number</Label>
            <Input
              id="mobile_no"
              name="mobile_no"
              type="text"
              placeholder="e.g. 1234567890"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
         <div className="mt-4 text-center text-sm">
          Remembered your password?{' '}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
