import { WorkspaceListPageSkeleton } from "@/components/product/page-loading-skeletons";

export default function RecipientsLoading() {
  return (
    <WorkspaceListPageSkeleton
      eyebrowWidth="w-40"
      titleWidth="w-56"
      descriptionWidth="w-[38rem]"
      filterControlCount={4}
      tableMinWidth="min-w-[920px]"
      tableColumns={[
        { className: "w-[28%]" },
        { className: "w-[40%]" },
        { className: "w-[14%]", align: "right" },
        { className: "w-[18%]", align: "right" },
      ]}
    />
  );
}
