import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import pg from "pg";

type UserRole = "ATHLETE" | "COACH" | "INVESTOR" | "ADMIN" | "OWNER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: UserRole;
    };
  }
}

async function findUserByEmail(email: string) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    const result = await pool.query(
      'SELECT id, email, name, image, "passwordHash", role FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } finally {
    await pool.end();
  }
}

async function findUserById(id: string) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    const result = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  } finally {
    await pool.end();
  }
}

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await findUserByEmail(email);

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        const dbUser = await findUserById(user.id as string);
        token.role = dbUser?.role ?? "ATHLETE";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
