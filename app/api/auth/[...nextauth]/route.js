// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import bcrypt from "bcrypt";

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

        // Check if email is allowed
        const allowed = await db.collection("allowedEmails").findOne({ email: credentials.email });
        if (!allowed) throw new Error("Email not authorized");

        const user = await db.collection("users").findOne({ email: credentials.email });
        if (!user) throw new Error("No user found");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Incorrect password");

        return { id: user._id, name: user.name || user.email, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/login", // custom login page (optional)
  },
  callbacks: {
    async signIn({ user, account }) {
      // Only restrict email check for OAuth (Google) sign-in
      if (account?.provider === "google") {
        const client = await clientPromise;
        const db = client.db("instaclone");

        const allowed = await db.collection("allowedEmails").findOne({ email: user.email });
        if (!allowed) {
          console.log(`Blocked Google login for unapproved email: ${user.email}`);
          return false; // Deny login
        }
      }

      return true; // Allow login
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
