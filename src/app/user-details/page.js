'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DefaultLayout from '@/components/Layouts/Layouts';
import { useRouter } from 'next/navigation';

const UserDetailsPage = () => {  // Renamed the function to start with an uppercase letter
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push("/auth/signin");
        } else {
            setLoading(false);
        }
    }, [session, status, router]);

    if (loading) {
        return (
            <div className="fixed inset-0 flex justify-center items-center bg-white">
                <div className="w-16 h-16 border-t-4 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <DefaultLayout>
            <h1 className="text-2xl font-bold mb-4">User Details</h1>
            <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-semibold">Name: {session.user.username}</h2>
                <p className="text-gray-600">Your email is: {session.user.email}</p>
                <p className="text-gray-600">Your user ID is: {session.user.id}</p>
            </div>
        </DefaultLayout>
    );
};

export default UserDetailsPage;
