import { redirect } from "next/navigation";

export default function RedirectToAllCollections() {
  redirect("/collections/all");
}
