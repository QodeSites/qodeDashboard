import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// Function to get current time in IST with minutes precision
function getCurrentISTTime() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  // Reset seconds and milliseconds
  istTime.setSeconds(0);
  istTime.setMilliseconds(0);
  return istTime;
}

// Helper function to hash passwords (use this when creating/updating user passwords)
export async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Helper function to compare password with stored hash
export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

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
            throw new Error("User not found. Please sign up.");
          }

          // Use bcrypt to compare the provided password with the stored hash
          const passwordValid = await bcrypt.compare(credentials.password, user.password);
          if (!passwordValid) {
            throw new Error("Invalid email or password.");
          }

          if (!user.hasaccess) {
            throw new Error("Access denied. Please contact support.");
          }

          // Update last_login timestamp with formatted IST time
          const istTime = getCurrentISTTime();
          await prisma.user_master.update({
            where: { id: user.id },
            data: { last_login: istTime },
          });

          // Set custom username for user with id 9
          const customUsername = user.id === 9 ? "Hiren Zaverchand Gala" : undefined;

          // First check client_master
          const clients = await prisma.client_master.findMany({
            where: {
              user_id: user.id, 
              OR: [
                { nuvama_code: { startsWith: 'QTF' } },
                { nuvama_code: { startsWith: 'QGF' } },
                { nuvama_code: { startsWith: 'QFH' } },
                { nuvama_code: { startsWith: 'QAW' } }
              ]
            },
            select: {
              nuvama_code: true,
              username: true
            },
          });

          // If no clients in client_master, check managed_account_clients
          if (clients.length === 0) {
            const managedClients = await prisma.managed_account_clients.findMany({
              where: { user_id: user.id },
              select: {
                id: true,
                user_id: true,
                client_name: true,
                account_code: true,
                account_name: true,
              },
            });

            return {
              master_id: user.id.toString(),
              email: user.email,
              hasaccess: user.hasaccess,
              last_login: istTime,
              managed_client_names: managedClients.map(client => client.client_name),
              managed_account_codes: managedClients.map(client => client.account_code),
              managed_account_names: managedClients.map(client => client.account_name),
              id: managedClients[0]?.id.toString() || user.id.toString(),
              user_id: managedClients[0]?.user_id || user.id,
              ...(customUsername && { username: customUsername }),
            };
          }

          return {
            id: user.id.toString(),
            email: user.email,
            hasaccess: user.hasaccess,
            last_login: istTime,
            nuvama_codes: clients.map(client => client.nuvama_code),
            usernames: clients.map(client => client.username),
            ...(customUsername && { username: customUsername }),
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
          user_id: token.user_id,
          email: token.email,
          hasaccess: token.hasaccess,
          last_login: token.last_login,
          ...(token.username && { username: token.username }),
          ...(token.nuvama_codes ? 
            { nuvama_codes: token.nuvama_codes, usernames: token.usernames } : 
            { managed_client_names: token.managed_client_names, managed_account_codes: token.managed_account_codes, managed_account_names: token.managed_account_names }
          ),
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          user_id: user.user_id,
          hasaccess: user.hasaccess,
          last_login: user.last_login,
          ...(user.username && { username: user.username }),
          ...(user.nuvama_codes ? 
            { nuvama_codes: user.nuvama_codes, usernames: user.usernames } : 
            { managed_client_names: user.managed_client_names, managed_account_codes: user.managed_account_codes, managed_account_names: user.managed_account_names }
          ),
        };
      }
      return token;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};