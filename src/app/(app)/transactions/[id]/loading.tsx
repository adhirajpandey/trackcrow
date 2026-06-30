import { WorkspaceDetailPageSkeleton } from "@/components/product/page-loading-skeletons";

export default function TransactionDetailLoading() {
  return (
    <WorkspaceDetailPageSkeleton
      formLayout
      sidePanels={[
        { rows: 3, tallRows: true },
        { rows: 2, tallRows: true },
      ]}
    />
  );
}
