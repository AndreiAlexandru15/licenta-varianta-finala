import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Parolă", type: "password" }
      },      async authorize(credentials, req) {
        try {
          // Caută utilizatorul după email cu rolurile și permisiunile
          const user = await prisma.utilizator.findUnique({
            where: { email: credentials.email },
            include: {
              roluri: {
                where: {
                  activ: true
                },
                include: {
                  rol: {
                    select: {
                      permisiuni: {
                        include: {
                          permisiune: {
                            select: {
                              nume: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          });
          
          if (!user || !user.activ) return null;
          
          // Verifică parola folosind bcrypt
          const isValid = await bcrypt.compare(credentials.password, user.parolaHash);
          if (!isValid) return null;

          // Agregare permisiuni din toate rolurile active
          const permisiuniSet = new Set();
          user.roluri.forEach(rolUtilizator => {
            rolUtilizator.rol.permisiuni.forEach(rp => {
              if (rp.permisiune && rp.permisiune.nume) {
                permisiuniSet.add(rp.permisiune.nume);
              }
            });
          });
          const permisiuni = Array.from(permisiuniSet);
          
          return {
            id: user.id,
            name: `${user.nume} ${user.prenume}`,
            email: user.email,
            primariaId: user.primariaId,
            permissions: permisiuni
          };
        } catch (error) {
          console.error('Eroare la autentificare:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 zile
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.primariaId = user.primariaId;
        token.permissions = user.permissions; // Include permissions in token
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.primariaId = token.primariaId;
        session.user.permissions = token.permissions; // Include permissions in session
      }
      return session;
    }
  }
});

export { handler as GET, handler as POST };
