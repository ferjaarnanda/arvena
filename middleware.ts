import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROFILE_REQUIRED_PATHS = ["/resources", "/exchange", "/community"];

function isProtectedPath(pathname: string) {
  return PROFILE_REQUIRED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function isProfileComplete(profile: {
  full_name: string | null;
  username: string | null;
  province: string | null;
  province_code: string | null;
  city: string | null;
  city_code: string | null;
  district: string | null;
  district_code: string | null;
  role: string | null;
  organization: string | null;
  bio: string | null;
} | null) {
  if (!profile) return false;

  const baseComplete =
    hasValue(profile.full_name) &&
    hasValue(profile.username) &&
    hasValue(profile.province) &&
    hasValue(profile.province_code) &&
    hasValue(profile.city) &&
    hasValue(profile.city_code) &&
    hasValue(profile.district) &&
    hasValue(profile.district_code) &&
    hasValue(profile.role);

  if (!baseComplete) return false;

  switch (profile.role) {
    case "citizen":
    case "admin":
      return true;
    case "student":
    case "organization":
    case "business":
    case "community":
    case "government":
    case "other":
      return hasValue(profile.organization);
    case "researcher":
      return hasValue(profile.organization) && hasValue(profile.bio);
    default:
      return false;
  }
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const loginResponse = NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
    copyCookies(supabaseResponse, loginResponse);
    return loginResponse;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "full_name, username, province, province_code, city, city_code, district, district_code, role, organization, bio"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !isProfileComplete(profile)) {
    const profileResponse = NextResponse.redirect(
      new URL("/profile", request.url)
    );
    copyCookies(supabaseResponse, profileResponse);
    return profileResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
