'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import DefaultLayout from '@/components/Layouts/Layouts';

const UserDetailsPage = () => {  // Renamed the function to start with an uppercase letter
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div>Access Denied</div>;
    }

    return (
        <DefaultLayout>
            <h1>User Details</h1>
            <h1>Name: {session.user.name}</h1>  {/* Fixed typo "usermame" to "name" */}
            <p>Your email is: {session.user.email}</p>
            <p>Your user ID is: {session.user.id}</p>
        </DefaultLayout>
    );
};

export default UserDetailsPage;
