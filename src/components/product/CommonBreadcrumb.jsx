import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const formatHandle = (text = "") => {
  return text
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function CommonBreadcrumb({ handle }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        
        {/* Home */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="text-[10px]">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Collections */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/collections" className="text-[10px]">Collections</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Dynamic Collection */}
        {handle && (
          <>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[10px]">
                {formatHandle(handle)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}