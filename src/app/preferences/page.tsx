import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddCategoryDialog } from "./components/add-category-dialog";
import { AddSubcategoryDialog } from "./components/add-subcategory-dialog";
import { DeleteCategoryForm } from "./components/delete-category-form";
import { DeleteSubcategoryForm } from "./components/delete-subcategory-form";
import { EditCategoryDialog } from "./components/edit-category-dialog";
import { EditSubcategoryDialog } from "./components/edit-subcategory-dialog";
import { ResetAllDialog } from "./components/reset-all-dialog";

export default async function PreferencesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.uuid) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Please sign in to view this page</p>
        </div>
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    where: { user_uuid: session.user.uuid },
    include: {
      Subcategory: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container mx-auto p-6 lg:pl-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground leading-snug">
            Manage your categories and subcategories to organize your
            transactions.
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
            <AddCategoryDialog />
            <ResetAllDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{category.name}</CardTitle>
              <div className="flex items-center">
                <EditCategoryDialog category={category} />
                <DeleteCategoryForm categoryId={category.id} />
              </div>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Subcategories</h4>
                    <AddSubcategoryDialog categoryId={category.id} />
                </div>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {category.Subcategory.map((sub) => (
                        <TableRow key={sub.id}>
                        <TableCell>{sub.name}</TableCell>
                        <TableCell className="text-right flex items-center justify-end">
                            <EditSubcategoryDialog subcategory={sub} categories={categories} />
                            <DeleteSubcategoryForm subcategoryId={sub.id} />
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
