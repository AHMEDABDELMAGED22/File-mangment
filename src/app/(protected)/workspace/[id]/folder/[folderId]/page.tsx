import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/services/auth.service";
import { getWorkspaceById, getWorkspaceContents, getAllFolders, getFolderBreadcrumbs } from "@/services/workspace.service";
import { WorkspaceBreadcrumbs } from "@/components/workspace/breadcrumbs";
import { FileGrid } from "@/components/workspace/file-grid";
import { SearchBar } from "@/components/workspace/search-bar";
import { SortControls } from "@/components/workspace/sort-controls";
import { UploadDropzone } from "@/components/workspace/upload-dropzone";
import { CreateFolderButton } from "@/components/workspace/create-folder-button";

interface Props {
  params: Promise<{ id: string; folderId: string }>;
  searchParams: Promise<{ q?: string; sort?: string; order?: string }>;
}

export default async function FolderPage({ params, searchParams }: Props) {
  await requireAuth();
  const { id, folderId } = await params;
  const sp = await searchParams;

  const workspace = await getWorkspaceById(id);
  if (!workspace) redirect("/dashboard");

  const sortBy = sp.sort || "name";
  const sortOrder = (sp.order as "asc" | "desc") || "asc";

  const [contents, allFolders, breadcrumbs] = await Promise.all([
    getWorkspaceContents(id, folderId, sortBy, sortOrder, sp.q),
    getAllFolders(id),
    getFolderBreadcrumbs(id, folderId),
  ]);

  const basePath = `/workspace/${id}/folder/${folderId}`;
  const isEmpty = contents.folders.length === 0 && contents.files.length === 0;

  const ownerName = workspace.profiles?.full_name ? `${workspace.profiles.full_name}'s Workspace` : workspace.name;
  return (
    <div className="space-y-6">
      <WorkspaceBreadcrumbs workspaceId={id} workspaceName={ownerName} items={breadcrumbs} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Suspense fallback={null}>
          <SearchBar basePath={basePath} />
        </Suspense>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <SortControls basePath={basePath} />
          </Suspense>
          <CreateFolderButton workspaceId={id} parentFolderId={folderId} />
        </div>
      </div>

      <UploadDropzone workspaceId={id} folderId={folderId} />

      <FileGrid
        folders={contents.folders}
        files={contents.files}
        allFolders={allFolders}
        workspaceId={id}
        currentFolderId={folderId}
        isEmpty={isEmpty}
        isSearch={!!sp.q}
      />
    </div>
  );
}
