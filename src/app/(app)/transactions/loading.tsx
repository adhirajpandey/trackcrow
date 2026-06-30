import { WorkspaceListPageSkeleton } from "@/components/product/page-loading-skeletons";

export default function TransactionsLoading() {
  return (
    <WorkspaceListPageSkeleton
      eyebrowWidth="w-44"
      titleWidth="w-64"
      descriptionWidth="w-[34rem]"
      actionWidths={["w-64", "w-40"]}
      filterControlCount={4}
      filterControlClassNames={["", "", "", "flex items-end lg:justify-end"]}
      tableMinWidth="min-w-[860px]"
      tableColumns={[
        { className: "w-[20%]" },
        { className: "w-[30%]" },
        { className: "w-[16%]", align: "right" },
        { className: "w-[22%]" },
        { className: "w-[12%]" },
      ]}
    />
  );
}
