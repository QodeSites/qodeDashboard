import Heading from "@/components/common/Heading";

export default function UserVerified() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-2">
            <div className="max-w-md w-full bg-beige rounded-lg shadow-xl overflow-hidden">
                <div className="p-4">
                    <div className="flex justify-center mb-2">
                        <svg className="w-2 h-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <Heading className="text-center text-black">
                        Account Verified Successfully!
                    </Heading>
                </div>
            </div>
        </div>
    );
}