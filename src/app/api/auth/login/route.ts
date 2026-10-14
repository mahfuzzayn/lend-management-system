import { type NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import AdminModel from "@/models/Admin";
import { loginSchema } from "@/schemas";
import { ApiError, apiSuccess, readJson, withApi, zodMessage } from "@/lib/api";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  clientIp,
  isLoginBlocked,
  recordLoginFailure,
  resetLoginFailures,
} from "@/lib/rate-limit";

/** POST /api/auth/login - { email, password } → httpOnly session cookie. */
export async function POST(request: NextRequest) {
  return withApi(async () => {
    const ip = clientIp(request);
    if (isLoginBlocked(ip)) {
      throw new ApiError(429, "Too many failed attempts. Try again in a few minutes.");
    }

    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(422, zodMessage(parsed.error));

    await connectToDatabase();
    const admin = await AdminModel.findOne({ email: parsed.data.email });
    const passwordOk = admin
      ? await bcrypt.compare(parsed.data.password, admin.passwordHash)
      : false;
    if (!admin || !passwordOk) {
      recordLoginFailure(ip);
      throw new ApiError(401, "Incorrect e-mail or password.");
    }
    resetLoginFailures(ip);

    // Pre-role admin docs (created before v1.4) are the owner: super-admin.
    const role = admin.role ?? "super-admin";
    const token = signSession({
      sub: String(admin._id),
      email: admin.email,
      name: admin.name,
      role,
    });
    (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());

    return apiSuccess({
      admin: {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role,
      },
    });
  });
}
