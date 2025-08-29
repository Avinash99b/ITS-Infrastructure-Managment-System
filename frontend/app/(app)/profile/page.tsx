
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateCurrentUser, updateUserProfileImage, handleApiError, updateCurrentUserPassword } from '@/lib/api';
import type { User } from '@/types';
import PageHeader from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [profileImage, setProfileImage] = React.useState<File | null>(null);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
        oldPassword: '',
        newPassword: '',
    }
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        profileForm.reset({
          name: currentUser.name,
          email: currentUser.email,
        });
        setPreviewImage(currentUser.image_url);
      } catch (error) {
        handleApiError(error, toast, 'Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [profileForm, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      let updatedUser = user;
      if (profileImage) {
        const formData = new FormData();
        formData.append('file', profileImage);
        const response = await updateUserProfileImage(formData);
        updatedUser = response;
        toast({
          title: 'Profile Image Updated',
          description: 'Your new profile image has been saved.',
        });
      }
      
      if(data.name !== user?.name || data.email !== user?.email) {
          const response = await updateCurrentUser(data);
          updatedUser = response;
          toast({
            title: 'Profile Updated',
            description: 'Your profile information has been updated successfully.',
          });
      }

      if (updatedUser) {
        setUser(updatedUser);
        setPreviewImage(updatedUser.image_url);
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...storedUser, name: updatedUser.name, image_url: updatedUser.image_url }));
        window.dispatchEvent(new Event('storage'));
      }

      setProfileImage(null);

    } catch (error) {
      handleApiError(error, toast, 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
        await updateCurrentUserPassword(data);
        toast({
            title: 'Password Updated',
            description: 'Your password has been changed successfully.',
        });
        passwordForm.reset();
    } catch (error) {
        handleApiError(error, toast, 'Failed to update password');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <PageHeader
        title="My Profile"
        description="View and update your personal information."
      />

      <div className="grid gap-8 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Update your photo and personal details here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={() => (
                      <FormItem className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                         <div className="relative group">
                          <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <AvatarImage src={previewImage || undefined} alt={user?.name} />
                              <AvatarFallback>
                              {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                              </AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <Camera className="h-8 w-8 text-white" />
                          </div>
                          <Input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                          />
                          </div>
                          <div className='grid gap-1'>
                              <FormLabel className="text-xl font-bold">{user?.name}</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                  {user?.email}
                              </p>
                              <p className="text-xs text-muted-foreground pt-2">Click the image to upload a new one.</p>
                          </div>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                              <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                              <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                  </div>
                  
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                    Update your password here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                            control={passwordForm.control}
                            name="oldPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Enter your current password" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Enter your new password" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                            {passwordForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
