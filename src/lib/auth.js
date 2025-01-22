import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Both email and password are required.");
        }

        try {
          console.log("Authenticating user:", credentials.email);

          const user = await prisma.user_master.findUnique({
            where: { email: credentials.email.toLowerCase() },
            select: {
              id: true,
              email: true,
              password: true,
              hasaccess: true,
            },
          });

          if (!user) {
            console.error("User not found:", credentials.email);
            throw new Error("User not found. Please sign up.");
          }

          if (credentials.password !== user.password) {
            console.error("Invalid password for user:", user.email);
            throw new Error("Invalid email or password.");
          }

          if (!user.hasaccess) {
            console.error("User has no access:", user.email);
            throw new Error("Access denied. Please contact support.");
          }

          // Fetch all clients with their nuvama_code and username
          const clients = await prisma.client_master.findMany({
            where: { user_id: user.id },
            select: { 
              nuvama_code: true,
              username: true 
            },
          });

          // Create arrays for both nuvama codes and usernames
          const nuvamaCodes = clients.map((client) => client.nuvama_code);
          const usernames = clients.map((client) => client.username);

          console.log("User authenticated:", user.email);

          return {
            id: user.id.toString(),
            email: user.email,
            hasaccess: user.hasaccess,
            nuvama_codes: nuvamaCodes,
            usernames: usernames, // Add usernames to the return object
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error("Login failed. Please try again.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id,
          email: token.email,
          hasaccess: token.hasaccess,
          nuvama_codes: token.nuvama_codes,
          usernames: token.usernames, // Add usernames to session
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          hasaccess: user.hasaccess,
          nuvama_codes: user.nuvama_codes,
          usernames: user.usernames, // Add usernames to JWT
        };
      }
      return token;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};