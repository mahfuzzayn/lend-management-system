import { type NextRequest } from "next/server";
import AdminModel from "@/models/Admin";
import { ApiError, apiSuccess, withApi } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

/** GET /api/auth/me - current admin from the session cookie, or 401. */
export async function GET(request: NextRequest) {
  return withApi(async () => {
    const session = requireSession(request);
    await connectToDatabase();

    const admin = await AdminModel.findById(session.sub);
    if (!admin) throw new ApiError(401, "This session is no longer valid.");

    return apiSuccess({
      admin: { id: String(admin._id), name: admin.name, email: admin.email },
    });
  });
}
