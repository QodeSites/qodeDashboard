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
          // Find the user by email (stored in lowercase)
          const user = await prisma.user_master.findUnique({
            where: { email: credentials.email.toLowerCase() },
            select: {
              id: true,
              email: true,
              password: true, // hashed password
              hasaccess: true,
            },
          });

          if (!user) {
            throw new Error("User not found. Please sign up.");
          }

          // Use bcrypt to compare the provided password with the hashed password in the database
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          if (!passwordMatch) {
            throw new Error("Invalid email or password.");
          }

          if (!user.hasaccess) {
            throw new Error("Access denied. Please contact support.");
          }

          // First, check client_master table for clients associated with the user
          const clients = await prisma.client_master.findMany({
            where: { user_id: user.id },
            select: { 
              nuvama_code: true,
              username: true,
            },
          });

          // If no clients in client_master, then check managed_account_clients table
          if (clients.length === 0) {
            const managedClients = await prisma.managed_account_clients.findMany({
              where: { user_id: user.id },
              select: {
                id: true,
                client_name: true,
                account_code: true,
                account_name: true,
              },
            });

            return {
              master_id: user.id.toString(),
              email: user.email,
              hasaccess: user.hasaccess,
              managed_client_names: managedClients.map(client => client.client_name),
              managed_account_codes: managedClients.map(client => client.account_code),
              managed_account_names: managedClients.map(client => client.account_name),
              id: managedClients[0].id.toString(),
            };
          }

          // Return the client details if found in client_master
          return {
            id: user.id.toString(),
            email: user.email,
            hasaccess: user.hasaccess,
            nuvama_codes: clients.map(client => client.nuvama_code),
            usernames: clients.map(client => client.username),
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
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id,
          email: token.email,
          hasaccess: token.hasaccess,
          ...(token.nuvama_codes
            ? { nuvama_codes: token.nuvama_codes, usernames: token.usernames }
            : {
                managed_client_names: token.managed_client_names,
                managed_account_codes: token.managed_account_codes,
                managed_account_names: token.managed_account_names,
              }),
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          hasaccess: user.hasaccess,
          ...(user.nuvama_codes
            ? { nuvama_codes: user.nuvama_codes, usernames: user.usernames }
            : {
                managed_client_names: user.managed_client_names,
                managed_account_codes: user.managed_account_codes,
                managed_account_names: user.managed_account_names,
              }),
        };
      }
      return token;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
