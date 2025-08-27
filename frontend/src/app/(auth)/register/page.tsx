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
import { useRouter } from 'next/navigation';
import Logo from '@/components/icons/logo';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { register } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      await register({ username, password });
      toast({
        title: 'Registration Successful',
        description: 'You can now log in with your new account.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description:
          error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center pb-4">
          <Logo className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl">
          Create an Account
        </CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="yourusername"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create an account'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
