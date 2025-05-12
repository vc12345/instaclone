// lib/auth.js
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcrypt";

// Helper to generate camelCase username
function toCamelCase(name) {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((word, index) =>
      index === 0 ? word : word[0].toUpperCase() + word.slice(1)
    )
    .join("");
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const client = await clientPromise;
        const db = client.db("instaclone");

        const allowed = await db.collection("allowedEmails").findOne({ email: credentials.email });
        if (!allowed) throw new Error("Email not authorized");

        const user = await db.collection("users").findOne({ email: credentials.email });
        if (!user) throw new Error("No user found");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Incorrect password");

        return {
          id: user._id,
          name: user.name || user.email,
          email: user.email,
          username: user.username || toCamelCase(user.name || user.email),
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      const client = await clientPromise;
      const db = client.db("instaclone");

      if (account?.provider === "google") {
        const allowed = await db.collection("allowedEmails").findOne({ email: user.email });
        if (!allowed) {
          console.log(`Blocked Google login for unapproved email: ${user.email}`);
          return false;
        }

        const existingUser = await db.collection("users").findOne({ email: user.email });
        if (!existingUser) {
          const baseUsername = toCamelCase(user.name || user.email.split("@")[0]);
          let username = baseUsername;
          let count = 1;

          while (await db.collection("users").findOne({ username })) {
            username = `${baseUsername}${count}`;
            count++;
          }

          await db.collection("users").insertOne({
            email: user.email,
            username,
            name: user.name,
            image: user.image,
            createdAt: new Date(),
          });

          user.username = username;
        } else {
          user.username = existingUser.username;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.username) {
        session.user.username = token.username;
      }
      return session;
    },
  },
};
