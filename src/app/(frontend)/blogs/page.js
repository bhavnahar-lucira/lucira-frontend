import { redirect } from "next/navigation";

// SSG: This is a simple redirect page — render once at build, zero ISR.
export const dynamic = 'force-static';

export default function BlogsPage() {
  redirect("/blogs/stories");
}
