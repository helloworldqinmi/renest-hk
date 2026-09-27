import { redirect } from "next/navigation";

export default function Page() {
  redirect("/demo?step=new");
}
